#!/usr/bin/env tsx
/**
 * Automated setup: validates env, runs migrations, configures GitHub Secrets.
 * Usage: npm run setup [-- --seed]
 */

import fs from 'node:fs'
import path from 'node:path'
import { execSync, spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const dotenv = require('dotenv')
const { Client } = require('pg')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const ENV_FILE = path.join(ROOT, '.env.local')
const ENV_EXAMPLE = path.join(ROOT, '.env.example')

const BOLD  = '\x1b[1m'
const GREEN = '\x1b[32m'
const RED   = '\x1b[31m'
const YELLOW= '\x1b[33m'
const RESET = '\x1b[0m'

function log(msg: string)  { console.log(msg) }
function ok(msg: string)   { console.log(`${GREEN}✅ ${msg}${RESET}`) }
function warn(msg: string) { console.log(`${YELLOW}⚠️  ${msg}${RESET}`) }
function fail(msg: string) { console.error(`${RED}❌ ${msg}${RESET}`); process.exit(1) }
function header(msg: string) { console.log(`\n${BOLD}${msg}${RESET}`) }

const seed = process.argv.includes('--seed')

// ─── Step 1: Prerequisites ────────────────────────────────────────────────────
header('Step 1 — Prerequisites')

const nodeVer = parseInt(process.version.replace('v', '').split('.')[0])
if (nodeVer < 18) fail(`Node.js 18+ required. Found: ${process.version}`)
ok(`Node.js ${process.version}`)

if (!fs.existsSync(ENV_FILE)) {
  if (!fs.existsSync(ENV_EXAMPLE)) fail('.env.example not found')
  fs.copyFileSync(ENV_EXAMPLE, ENV_FILE)
  warn('.env.local created from .env.example — please fill in your credentials and re-run')
  process.exit(0)
}
ok('.env.local found')

// ─── Step 2: Validate env ─────────────────────────────────────────────────────
header('Step 2 — Environment variables')

dotenv.config({ path: ENV_FILE })

const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_PROJECT_REF', 'SUPABASE_DB_PASSWORD']
const missing = required.filter(k => !process.env[k])
if (missing.length > 0) fail(`Missing required variables in .env.local:\n   ${missing.join('\n   ')}`)

required.forEach(k => ok(`${k} is set`))

if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your_')) {
  warn('OPENAI_API_KEY not set — AI commentary (Seu Zé) and Stories will not work')
  warn('   Get a key at https://platform.openai.com/api-keys and add to .env.local')
  warn('   Also add it as a Supabase Edge Function Secret (see Step 4b below)')
} else {
  ok('OPENAI_API_KEY is set (will be pushed to Supabase secrets in Step 4b)')
}

if (!process.env.VITE_FOOTBALL_API_KEY || process.env.VITE_FOOTBALL_API_KEY.includes('sua_')) {
  warn('VITE_FOOTBALL_API_KEY not set — automatic result sync will not work')
  warn('   Register at https://www.football-data.org/client/register (free tier)')
} else {
  ok('VITE_FOOTBALL_API_KEY is set')
}

if (!process.env.VITE_VAPID_PUBLIC_KEY) {
  warn('VITE_VAPID_PUBLIC_KEY not set — generating VAPID keys...')
  try {
    const result = execSync('npx web-push generate-vapid-keys --json', { encoding: 'utf8' })
    const keys = JSON.parse(result)
    const envContent = fs.readFileSync(ENV_FILE, 'utf8')
    fs.writeFileSync(ENV_FILE,
      envContent
        .replace('VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here', `VITE_VAPID_PUBLIC_KEY=${keys.publicKey}`)
        .replace('VAPID_PRIVATE_KEY=your_vapid_private_key_here', `VAPID_PRIVATE_KEY=${keys.privateKey}`)
    )
    ok('VAPID keys generated and saved to .env.local')
    log(`   Public:  ${keys.publicKey.slice(0, 30)}…`)
    log(`   Private: [saved to .env.local — never commit!]`)
    dotenv.config({ path: ENV_FILE, override: true })
  } catch {
    warn('Could not auto-generate VAPID keys. Run: npx web-push generate-vapid-keys')
  }
}

// ─── Step 3: Run migrations ───────────────────────────────────────────────────
header('Step 3 — Database migrations')

const ref = process.env.SUPABASE_PROJECT_REF!
const pw  = process.env.SUPABASE_DB_PASSWORD!
const dbUrl = process.env.SUPABASE_DB_URL
  ?? `postgresql://postgres.${ref}:${encodeURIComponent(pw)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

const migrateArgs = seed ? ['--', '--seed'] : []
const result = spawnSync('npx', ['tsx', 'scripts/migrate.ts', ...migrateArgs], {
  cwd: ROOT,
  stdio: 'inherit',
  env: { ...process.env },
})
if (result.status !== 0) fail('Migration failed')

// ─── Step 4: GitHub Secrets ───────────────────────────────────────────────────
header('Step 4 — GitHub Secrets')

const ghRepo = process.env.GITHUB_REPO
if (!ghRepo) {
  warn('GITHUB_REPO not set in .env.local — skipping GitHub Secrets setup')
  warn('   Set GITHUB_REPO=your-username/your-repo to automate this step')
} else {
  const ghCheck = spawnSync('gh', ['auth', 'status'], { encoding: 'utf8' })
  if (ghCheck.status !== 0) {
    warn('gh CLI not authenticated. Run: gh auth login')
  } else {
    const secrets: Record<string, string> = {
      VITE_SUPABASE_URL:        process.env.VITE_SUPABASE_URL!,
      VITE_SUPABASE_ANON_KEY:   process.env.VITE_SUPABASE_ANON_KEY!,
      VITE_VAPID_PUBLIC_KEY:    process.env.VITE_VAPID_PUBLIC_KEY ?? '',
      VITE_FOOTBALL_API_KEY:    process.env.VITE_FOOTBALL_API_KEY ?? '',
    }
    for (const [name, value] of Object.entries(secrets)) {
      if (!value || value.includes('sua_') || value.includes('your_')) {
        warn(`Skipping GitHub Secret ${name} (placeholder or not set)`)
        continue
      }
      const r = spawnSync('gh', ['secret', 'set', name, '--body', value, '--repo', ghRepo], { encoding: 'utf8' })
      if (r.status === 0) ok(`GitHub Secret: ${name}`)
      else warn(`Could not set ${name}: ${r.stderr}`)
    }
  }
}

// ─── Step 4b: Supabase Edge Function Secrets ─────────────────────────────────
header('Step 4b — Supabase Edge Function Secrets')

const supabaseCLI = spawnSync('supabase', ['--version'], { encoding: 'utf8' })
if (supabaseCLI.status !== 0) {
  warn('Supabase CLI not found — skipping automatic Edge Function secret setup')
  warn('   Install: https://supabase.com/docs/guides/cli and run: supabase login')
  warn('   Then manually set secrets in: Supabase Dashboard → Settings → Edge Functions → Secrets')
  warn('   Required secrets: OPENAI_API_KEY, FOOTBALL_API_KEY, SUPABASE_SERVICE_ROLE_KEY')
} else {
  const edgeSecrets: Record<string, string> = {
    OPENAI_API_KEY:  process.env.OPENAI_API_KEY ?? '',
    FOOTBALL_API_KEY: process.env.VITE_FOOTBALL_API_KEY ?? '',
  }
  const ref = process.env.SUPABASE_PROJECT_REF!
  for (const [name, value] of Object.entries(edgeSecrets)) {
    if (!value || value.includes('sua_') || value.includes('your_')) {
      warn(`Skipping Supabase secret ${name} (placeholder or not set)`)
      continue
    }
    const r = spawnSync(
      'supabase', ['secrets', 'set', `${name}=${value}`, '--project-ref', ref],
      { encoding: 'utf8' }
    )
    if (r.status === 0) ok(`Supabase Edge Function Secret: ${name}`)
    else warn(`Could not set Supabase secret ${name}: ${r.stderr}`)
  }
}

// ─── Step 5: Verify connection ────────────────────────────────────────────────
header('Step 5 — Connection check')

const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
try {
  await client.connect()
  await client.query('SELECT 1')
  const tables = ['profiles', 'jogos', 'palpites', 'convites', 'comentarios', 'comentarios_ia', 'stories']
  for (const t of tables) {
    const { rows } = await client.query(`SELECT to_regclass('public.${t}')`)
    if (rows[0].to_regclass) ok(`Table '${t}' exists`)
    else warn(`Table '${t}' not found — did the migration run?`)
  }
  await client.end()
} catch (e) {
  warn(`DB check failed: ${(e as Error).message}`)
}

// ─── Done ─────────────────────────────────────────────────────────────────────
console.log(`
${GREEN}${BOLD}🎉 Setup complete!${RESET}

Next steps:
  1. ${BOLD}npm run dev${RESET}                 — start local development server
  2. ${BOLD}Deploy Edge Functions${RESET}:
       supabase functions deploy sync-resultados --project-ref ${process.env.SUPABASE_PROJECT_REF ?? '<ref>'}
       supabase functions deploy gerar-comentarista --project-ref ${process.env.SUPABASE_PROJECT_REF ?? '<ref>'}
       supabase functions deploy gerar-story --project-ref ${process.env.SUPABASE_PROJECT_REF ?? '<ref>'}
  3. ${BOLD}Enable pg_cron${RESET}: run supabase/functions/cron-config.sql in the Supabase SQL editor
  4. ${BOLD}git push origin main${RESET}        — triggers automatic deploy to GitHub Pages
`)
