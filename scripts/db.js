#!/usr/bin/env node
// Usage: node scripts/db.js --file supabase/minha_migracao.sql
// Requires DB_URL in environment or .env.local file

import { readFileSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Load .env.local if DB_URL not set
if (!process.env.DB_URL) {
  try {
    const envPath = join(ROOT, '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  } catch {
    // .env.local not present, rely on environment
  }
}

const dbUrl = process.env.DB_URL;
if (!dbUrl) {
  console.error('Erro: DB_URL não definido. Configure em .env.local ou no ambiente.');
  console.error('Exemplo de .env.local:');
  console.error('  DB_URL=postgresql://postgres.SEU_REF:SENHA@aws-0-us-west-2.pooler.supabase.com:5432/postgres');
  process.exit(1);
}

// Parse --file argument
const fileArgIdx = process.argv.indexOf('--file');
if (fileArgIdx === -1 || !process.argv[fileArgIdx + 1]) {
  console.error('Uso: node scripts/db.js --file supabase/minha_migracao.sql');
  process.exit(1);
}
const sqlFile = resolve(ROOT, process.argv[fileArgIdx + 1]);

let sql;
try {
  sql = readFileSync(sqlFile, 'utf-8');
} catch (err) {
  console.error(`Erro ao ler arquivo: ${sqlFile}`);
  console.error(err.message);
  process.exit(1);
}

// Dynamic import of pg (CommonJS module in ESM context)
const { default: pg } = await import('pg');
const { Client } = pg;

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

console.log(`Executando: ${process.argv[fileArgIdx + 1]}`);

try {
  await client.connect();
  await client.query(sql);
  console.log('✓ SQL executado com sucesso');

  // Verify triggers if sql touches 'jogos' table
  if (sql.includes('jogos')) {
    const result = await client.query(
      `SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'jogos'`
    );
    if (result.rows.length > 0) {
      console.log('\nTriggers na tabela jogos:');
      result.rows.forEach(row => console.log(' -', row.trigger_name));
    }
  }
} catch (err) {
  console.error('Erro ao executar SQL:');
  console.error(err.message);
  process.exit(1);
} finally {
  await client.end();
}
