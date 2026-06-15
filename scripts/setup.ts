#!/usr/bin/env tsx
/**
 * Soccer Pool — Interactive Setup Wizard
 * Configures everything automatically for a new project clone.
 * Usage: npm run setup
 */

import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { execSync, spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const dotenv  = require('dotenv')
const { Client } = require('pg')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT       = path.resolve(__dirname, '..')
const ENV_FILE   = path.join(ROOT, '.env.local')
const ENV_EXAMPLE = path.join(ROOT, '.env.example')

// ── Terminal colors ──────────────────────────────────────────────────────────
const C = {
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  dim:    '\x1b[2m',
  reset:  '\x1b[0m',
}
const ok   = (m: string) => console.log(`${C.green}  ✅ ${m}${C.reset}`)
const warn = (m: string) => console.log(`${C.yellow}  ⚠️  ${m}${C.reset}`)
const fail = (m: string): never => { console.error(`${C.red}  ❌ ${m}${C.reset}`); process.exit(1) }
const info = (m: string) => console.log(`     ${C.dim}${m}${C.reset}`)
const step = (n: number, title: string) =>
  console.log(`\n${C.bold}${C.cyan}━━━ Step ${n} — ${title} ━━━${C.reset}`)

// ── Readline helper ──────────────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

async function ask(prompt: string, defaultVal = '', sensitive = false): Promise<string> {
  const hint = defaultVal
    ? ` [${sensitive && defaultVal.length > 4 ? defaultVal.slice(0, 4) + '****' : defaultVal}]`
    : ''
  return new Promise(resolve =>
    rl.question(`  ${prompt}${hint}: `, ans => resolve(ans.trim() || defaultVal))
  )
}

// ── Env file helpers ─────────────────────────────────────────────────────────
function readEnv(): Record<string, string> {
  try {
    const lines = fs.readFileSync(ENV_FILE, 'utf8').split('\n')
    const env: Record<string, string> = {}
    for (const line of lines) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const eq = t.indexOf('=')
      if (eq === -1) continue
      env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    }
    return env
  } catch { return {} }
}

function setEnvVar(key: string, value: string) {
  let content = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : ''
  const re = new RegExp(`^${key}=.*$`, 'm')
  if (re.test(content)) {
    content = content.replace(re, `${key}=${value}`)
  } else {
    content = content.trimEnd() + `\n${key}=${value}\n`
  }
  fs.writeFileSync(ENV_FILE, content)
}

function isPlaceholder(v?: string): boolean {
  return !v || v.includes('YOUR_') || v.includes('your_') || v.includes('your-')
}

// ─────────────────────────────────────────────────────────────────────────────
// BANNER
// ─────────────────────────────────────────────────────────────────────────────
console.log(`
${C.bold}${C.green}  ⚽ Soccer Pool — Setup Wizard${C.reset}
  ${'═'.repeat(38)}
  This script configures everything automatically.
  Estimated time: 5 minutes
`)

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Prerequisites
// ─────────────────────────────────────────────────────────────────────────────
step(1, 'Prerequisites')

const nodeVer = parseInt(process.version.replace('v', '').split('.')[0])
if (nodeVer < 18) fail(`Node.js 18+ required. Found: ${process.version}`)
ok(`Node.js ${process.version}`)

const gitOk = spawnSync('git', ['--version'], { encoding: 'utf8' }).status === 0
if (gitOk) ok('git installed')
else warn('git not found — install from https://git-scm.com')

const ghOk = spawnSync('gh', ['--version'], { encoding: 'utf8' }).status === 0
if (ghOk) ok('gh CLI installed (GitHub Secrets will be configured automatically)')
else      warn('gh CLI not found — GitHub Secrets must be added manually (see Step 5 output)')

const supabaseCLI = spawnSync('supabase', ['--version'], { encoding: 'utf8' }).status === 0
if (supabaseCLI) ok('Supabase CLI installed (Edge Functions will be deployed automatically)')
else             warn('Supabase CLI not found — Edge Functions must be deployed manually (see Step 6)')

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Environment variables
// ─────────────────────────────────────────────────────────────────────────────
step(2, 'Environment variables')

if (!fs.existsSync(ENV_FILE)) {
  if (!fs.existsSync(ENV_EXAMPLE)) fail('.env.example not found')
  fs.copyFileSync(ENV_EXAMPLE, ENV_FILE)
  info('.env.local created from .env.example')
}

let env = readEnv()

const needsSetup = isPlaceholder(env.VITE_SUPABASE_URL) || isPlaceholder(env.SUPABASE_DB_PASSWORD)

if (needsSetup) {
  console.log(`\n  ${C.bold}Supabase credentials${C.reset}`)
  info('Find these at https://supabase.com/dashboard/project/_/settings/api\n')

  const url = await ask('VITE_SUPABASE_URL', env.VITE_SUPABASE_URL)
  if (url && url !== env.VITE_SUPABASE_URL) setEnvVar('VITE_SUPABASE_URL', url)

  const anonKey = await ask('VITE_SUPABASE_ANON_KEY', env.VITE_SUPABASE_ANON_KEY, true)
  if (anonKey) setEnvVar('VITE_SUPABASE_ANON_KEY', anonKey)

  const serviceKey = await ask('SUPABASE_SERVICE_ROLE_KEY (sensitive)', '', true)
  if (serviceKey) setEnvVar('SUPABASE_SERVICE_ROLE_KEY', serviceKey)

  // Auto-extract project ref from URL
  const autoRef = url?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? ''
  if (autoRef) {
    setEnvVar('SUPABASE_PROJECT_REF', autoRef)
    info(`Project ref extracted from URL: ${autoRef}`)
  } else {
    const ref = await ask('SUPABASE_PROJECT_REF', env.SUPABASE_PROJECT_REF)
    if (ref) setEnvVar('SUPABASE_PROJECT_REF', ref)
  }

  const dbPass = await ask('SUPABASE_DB_PASSWORD (sensitive)', '', true)
  if (dbPass) setEnvVar('SUPABASE_DB_PASSWORD', dbPass)

  console.log(`\n  ${C.bold}Deployment${C.reset}`)
  const baseUrl = await ask('VITE_BASE_URL', env.VITE_BASE_URL || 'https://username.github.io/soccer-pool')
  if (baseUrl) setEnvVar('VITE_BASE_URL', baseUrl)

  const ghRepo = await ask('GITHUB_REPO (e.g. username/soccer-pool)', env.GITHUB_REPO || '')
  if (ghRepo) setEnvVar('GITHUB_REPO', ghRepo)

  console.log(`\n  ${C.bold}Optional integrations${C.reset}`)
  const openai = await ask('OPENAI_API_KEY (optional — AI commentary)', '', true)
  if (openai) setEnvVar('OPENAI_API_KEY', openai)

  const football = await ask('VITE_FOOTBALL_API_KEY (optional — auto results)', '', true)
  if (football) setEnvVar('VITE_FOOTBALL_API_KEY', football)

  env = readEnv()
}

// Load into process.env and validate
dotenv.config({ path: ENV_FILE, override: true })
env = readEnv()

const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_PROJECT_REF', 'SUPABASE_DB_PASSWORD']
const missing = required.filter(k => isPlaceholder(env[k]))
if (missing.length > 0) fail(`Missing required variables in .env.local:\n   ${missing.join('\n   ')}`)
required.forEach(k => ok(k))

// VAPID key generation
if (isPlaceholder(env.VITE_VAPID_PUBLIC_KEY)) {
  warn('Generating VAPID keys for Web Push...')
  try {
    const raw = execSync('npx web-push generate-vapid-keys --json', { encoding: 'utf8' })
    const keys = JSON.parse(raw)
    setEnvVar('VITE_VAPID_PUBLIC_KEY', keys.publicKey)
    setEnvVar('VAPID_PRIVATE_KEY', keys.privateKey)
    env = readEnv()
    ok('VAPID keys generated and saved to .env.local')
    info(`Public: ${keys.publicKey.slice(0, 30)}…`)
    info('Private key: [saved to .env.local — never commit!]')
  } catch {
    warn('Could not auto-generate VAPID keys. Run: npx web-push generate-vapid-keys')
  }
} else {
  ok('VAPID keys already configured')
}

if (!isPlaceholder(env.OPENAI_API_KEY)) ok('OPENAI_API_KEY set')
else warn('OPENAI_API_KEY not set — AI commentary and Stories will be disabled')

if (!isPlaceholder(env.VITE_FOOTBALL_API_KEY)) ok('VITE_FOOTBALL_API_KEY set')
else warn('VITE_FOOTBALL_API_KEY not set — automatic result sync will be disabled')

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Database migrations
// ─────────────────────────────────────────────────────────────────────────────
step(3, 'Database migrations')

const ref    = env.SUPABASE_PROJECT_REF!
const pw     = env.SUPABASE_DB_PASSWORD!
const dbUrl  = env.SUPABASE_DB_URL
  || `postgresql://postgres.${ref}:${encodeURIComponent(pw)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

const seedArg = process.argv.includes('--seed') ? ['--', '--seed'] : []
const migrResult = spawnSync('npx', ['tsx', 'scripts/migrate.ts', ...seedArg], {
  cwd: ROOT, stdio: 'inherit', env: { ...process.env, SUPABASE_DB_URL: dbUrl },
})
if (migrResult.status !== 0) fail('Migration failed — check the error above')

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — Supabase configuration (Auth redirect URLs + Realtime)
// ─────────────────────────────────────────────────────────────────────────────
step(4, 'Supabase configuration')

const baseUrl   = (env.VITE_BASE_URL || '').replace(/\/$/, '')
const redirects = [
  `${baseUrl}/auth/callback`,
  `${baseUrl}/nova-senha`,
  'http://localhost:5173/auth/callback',
  'http://localhost:5173/nova-senha',
].filter(Boolean)

// Try Supabase Management API (requires SUPABASE_ACCESS_TOKEN)
const accessToken = env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN
if (accessToken && ref) {
  try {
    const resp = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ additional_redirect_urls: redirects.join(',') }),
    })
    if (resp.ok) ok('Auth redirect URLs configured via Management API')
    else warn(`Management API responded with ${resp.status} — configure redirect URLs manually`)
  } catch {
    warn('Could not reach Supabase Management API')
  }
} else {
  warn('SUPABASE_ACCESS_TOKEN not set — configure redirect URLs manually:')
  for (const url of redirects) info(`  ${url}`)
  info('Go to: Supabase Dashboard → Authentication → URL Configuration')
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5 — GitHub Secrets
// ─────────────────────────────────────────────────────────────────────────────
step(5, 'GitHub Secrets')

const ghRepo = env.GITHUB_REPO
const secrets: Record<string, string> = {
  VITE_SUPABASE_URL:      env.VITE_SUPABASE_URL      ?? '',
  VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY ?? '',
  VITE_VAPID_PUBLIC_KEY:  env.VITE_VAPID_PUBLIC_KEY  ?? '',
  VITE_FOOTBALL_API_KEY:  env.VITE_FOOTBALL_API_KEY  ?? '',
  SUPABASE_DB_URL:        dbUrl,
}

if (!ghRepo || isPlaceholder(ghRepo)) {
  warn('GITHUB_REPO not set — showing secrets to configure manually:')
  console.log()
  console.log('  Add these secrets at:')
  console.log(`  https://github.com/YOUR_USERNAME/soccer-pool/settings/secrets/actions\n`)
  for (const [k, v] of Object.entries(secrets)) {
    if (v) console.log(`  ${C.bold}${k}${C.reset} = ${v.slice(0, 20)}…`)
  }
} else if (!ghOk) {
  warn('gh CLI not available — add secrets manually at:')
  info(`https://github.com/${ghRepo}/settings/secrets/actions`)
} else {
  const ghAuth = spawnSync('gh', ['auth', 'status'], { encoding: 'utf8' })
  if (ghAuth.status !== 0) {
    warn('gh CLI not authenticated. Run: gh auth login')
  } else {
    for (const [name, value] of Object.entries(secrets)) {
      if (!value || isPlaceholder(value)) { warn(`Skipping ${name} (not set)`); continue }
      const r = spawnSync('gh', ['secret', 'set', name, '--body', value, '--repo', ghRepo], { encoding: 'utf8' })
      if (r.status === 0) ok(`GitHub Secret: ${name}`)
      else warn(`Could not set ${name}: ${r.stderr?.trim()}`)
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6 — Edge Functions
// ─────────────────────────────────────────────────────────────────────────────
step(6, 'Edge Functions')

const functions = ['sync-resultados', 'gerar-comentarista', 'gerar-story', 'enviar-push', 'admin-upsert-palpites', 'criar-usuario']

if (!supabaseCLI) {
  warn('Supabase CLI not found. Deploy Edge Functions manually:')
  for (const fn of functions) info(`supabase functions deploy ${fn} --project-ref ${ref}`)
  info('\nInstall CLI: https://supabase.com/docs/guides/cli')
} else {
  const supaAuth = spawnSync('supabase', ['projects', 'list'], { encoding: 'utf8' })
  if (supaAuth.status !== 0) {
    warn('Supabase CLI not authenticated. Run: supabase login')
    for (const fn of functions) info(`supabase functions deploy ${fn} --project-ref ${ref}`)
  } else {
    for (const fn of functions) {
      const fnDir = path.join(ROOT, 'supabase', 'functions', fn)
      if (!fs.existsSync(fnDir)) continue
      const r = spawnSync('supabase', ['functions', 'deploy', fn, '--project-ref', ref], { encoding: 'utf8', cwd: ROOT })
      if (r.status === 0) ok(`Deployed: ${fn}`)
      else warn(`Could not deploy ${fn}: ${r.stderr?.trim()}`)
    }
    // Push Edge Function secrets
    const edgeSecrets: Record<string, string> = {
      OPENAI_API_KEY:               env.OPENAI_API_KEY ?? '',
      FOOTBALL_API_KEY:             env.VITE_FOOTBALL_API_KEY ?? '',
      VAPID_PRIVATE_KEY:            env.VAPID_PRIVATE_KEY ?? '',
      SUPABASE_SERVICE_ROLE_KEY:    env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    }
    for (const [name, value] of Object.entries(edgeSecrets)) {
      if (!value || isPlaceholder(value)) continue
      spawnSync('supabase', ['secrets', 'set', `${name}=${value}`, '--project-ref', ref], { encoding: 'utf8' })
    }
    ok('Edge Function secrets pushed')
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 7 — Create admin user
// ─────────────────────────────────────────────────────────────────────────────
step(7, 'Admin user')

const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
if (!serviceKey || isPlaceholder(serviceKey)) {
  warn('SUPABASE_SERVICE_ROLE_KEY not set — create admin user manually:')
  info('1. Go to Supabase Dashboard → Authentication → Users → Add user')
  info('2. Run: UPDATE profiles SET is_admin = true WHERE id = \'<user-id\'>;')
} else {
  const createAdmin = await ask('Create admin user now? (y/n)', 'y')
  if (createAdmin.toLowerCase() === 'y') {
    const adminEmail = await ask('Admin email')
    const adminPass  = await ask('Admin password (min 8 chars)', '', true)

    if (adminEmail && adminPass) {
      const { createClient } = await import('@supabase/supabase-js')
      const adminClient = createClient(env.VITE_SUPABASE_URL!, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      const { data, error } = await adminClient.auth.admin.createUser({
        email: adminEmail,
        password: adminPass,
        email_confirm: true,
      })

      if (error) {
        warn(`Could not create admin user: ${error.message}`)
      } else {
        await new Promise(r => setTimeout(r, 1000)) // wait for profile trigger
        await adminClient.from('profiles').update({ is_admin: true }).eq('id', data.user.id)
        ok(`Admin user created: ${adminEmail}`)
        info(`User ID: ${data.user.id}`)
      }
    }
  } else {
    info('Skipped — create admin user manually when ready')
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 8 — Final verification
// ─────────────────────────────────────────────────────────────────────────────
step(8, 'Verification')

const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
try {
  await client.connect()
  await client.query('SELECT 1')
  ok('Database connection')

  const tables = ['profiles', 'jogos', 'palpites', 'convites', 'comentarios', 'comentarios_ia', 'stories', 'push_subscriptions']
  for (const t of tables) {
    const { rows } = await client.query(`SELECT to_regclass('public.${t}')`)
    if (rows[0].to_regclass) ok(`Table '${t}'`)
    else warn(`Table '${t}' not found — re-run migrations`)
  }

  const { rows: [{ count }] } = await client.query('SELECT COUNT(*) as count FROM jogos')
  if (parseInt(count) >= 48) ok(`${count} matches in database`)
  else warn(`Only ${count} matches found — run: npm run migrate -- --seed`)

  await client.end()
} catch (e) {
  warn(`DB verification failed: ${(e as Error).message}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 9 — Summary
// ─────────────────────────────────────────────────────────────────────────────
rl.close()

const adminUrl = `${baseUrl}/admin`
console.log(`
${C.green}${C.bold}  ✅ Setup complete!${C.reset}
  ${'═'.repeat(38)}

  ${C.bold}Development:${C.reset}
    npm run dev         → http://localhost:5173

  ${C.bold}Deploy:${C.reset}
    git push origin main  (GitHub Actions handles the rest)
    Site: ${baseUrl || 'https://USERNAME.github.io/soccer-pool'}

  ${C.bold}Admin panel:${C.reset}
    ${adminUrl || '/admin'}

  ${C.bold}Documentation:${C.reset}
    README.md          — Quick start and architecture
    MANUAL_SETUP.md    — Step-by-step manual setup guide

  ${C.dim}Need help? Open an issue on GitHub.${C.reset}
`)
