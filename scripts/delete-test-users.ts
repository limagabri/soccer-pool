#!/usr/bin/env tsx
/**
 * Deletes the 5 test users from Supabase auth.users.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * Usage: npx tsx scripts/delete-test-users.ts
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const env: Record<string, string> = {}
try {
  const lines = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf-8').split('\n')
  for (const line of lines) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  }
} catch { /* rely on process.env */ }

const SUPABASE_URL      = env.VITE_SUPABASE_URL      || process.env.VITE_SUPABASE_URL!
const SERVICE_ROLE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local')
  process.exit(1)
}

const TEST_EMAILS = [
  'ana@teste.com',
  'pedro@teste.com',
  'joao@teste.com',
  'maria@teste.com',
  'carlos@teste.com',
]

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log('🗑️  Deleting test users from auth.users...\n')

  const { data: allUsers, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr) {
    console.error('❌  Could not list users:', listErr.message)
    process.exit(1)
  }

  const testUsers = allUsers.users.filter(u => TEST_EMAILS.includes(u.email ?? ''))

  if (testUsers.length === 0) {
    console.log('✅  No test users found — nothing to delete.')
    return
  }

  console.log(`Found ${testUsers.length} test user(s):`)
  for (const u of testUsers) console.log(`  - ${u.email} (${u.id})`)
  console.log()

  for (const u of testUsers) {
    const { error } = await supabase.auth.admin.deleteUser(u.id)
    if (error) console.warn(`  ⚠️  Could not delete ${u.email}: ${error.message}`)
    else       console.log(`  ✅  Deleted ${u.email}`)
  }

  // Confirm
  const { data: remaining } = await supabase.auth.admin.listUsers()
  const still = remaining?.users.filter(u => TEST_EMAILS.includes(u.email ?? '')) ?? []
  if (still.length === 0) console.log('\n✅  All test users deleted.')
  else console.warn(`\n⚠️  ${still.length} user(s) could not be deleted: ${still.map(u => u.email).join(', ')}`)
}

main().catch(e => { console.error(e); process.exit(1) })
