#!/usr/bin/env tsx
/**
 * Runs pending database migrations in order.
 * Usage: npm run migrate [-- --seed]
 */

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const dotenv = require('dotenv')
const { Client } = require('pg')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

dotenv.config({ path: path.join(ROOT, '.env.local') })
dotenv.config({ path: path.join(ROOT, '.env') })

const seed = process.argv.includes('--seed')

const DB_URL = process.env.SUPABASE_DB_URL
  ?? buildUrl(process.env.SUPABASE_PROJECT_REF, process.env.SUPABASE_DB_PASSWORD)

function buildUrl(ref?: string, password?: string): string | undefined {
  if (!ref || !password) return undefined
  return `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
}

async function run() {
  if (!DB_URL) {
    console.error('❌ No database URL. Set SUPABASE_DB_URL or SUPABASE_PROJECT_REF + SUPABASE_DB_PASSWORD in .env.local')
    process.exit(1)
  }

  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log('✅ Connected to database\n')

  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name text PRIMARY KEY,
      executed_at timestamptz DEFAULT now()
    )
  `)

  const migrDir = path.join(ROOT, 'supabase', 'migrations')
  let files = fs.readdirSync(migrDir)
    .filter(f => f.endsWith('.sql') && !f.startsWith('000_'))
    .sort()

  if (seed) {
    files = [...files, '000_seed.sql']
  }

  let ran = 0
  for (const file of files) {
    const { rows } = await client.query('SELECT 1 FROM _migrations WHERE name = $1', [file])
    if (rows.length > 0) {
      console.log(`⏭️  ${file} — already executed`)
      continue
    }
    const sql = fs.readFileSync(path.join(migrDir, file), 'utf8')
    try {
      await client.query(sql)
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file])
      console.log(`✅ ${file}`)
      ran++
    } catch (err) {
      console.error(`❌ ${file}:`, (err as Error).message)
      await client.end()
      process.exit(1)
    }
  }

  await client.end()
  console.log(`\n${ran === 0 ? '✅ All migrations already up to date.' : `✅ Ran ${ran} migration(s).`}`)
}

run().catch(e => { console.error(e); process.exit(1) })
