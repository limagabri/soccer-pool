#!/usr/bin/env tsx
// scripts/seed-test-users.ts
// Creates 5 test users with varied palpites to populate ranking/stories data.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Load .env.local
const env: Record<string, string> = {}
try {
  const lines = readFileSync(join(ROOT, '.env.local'), 'utf-8').split('\n')
  for (const line of lines) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
  }
} catch { /* ignore */ }

const SUPABASE_URL  = env.VITE_SUPABASE_URL      || process.env.VITE_SUPABASE_URL!
const SERVICE_ROLE  = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('❌  VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios em .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
})

interface Jogo {
  id: string
  numero_jogo: number
  time_casa: string
  time_fora: string
  gols_casa: number
  gols_fora: number
}

// Palpite strategies — called with actual game result
type Strategy = (gc: number, gf: number, num: number) => { gols_casa: number; gols_fora: number }

function wrongWinner(gc: number, gf: number): { gols_casa: number; gols_fora: number } {
  // Always predicts opposite winner (0 pts guaranteed)
  if (gc > gf) return { gols_casa: 0, gols_fora: gc + 1 }
  if (gf > gc) return { gols_casa: gf + 1, gols_fora: 0 }
  return { gols_casa: 1, gols_fora: 0 } // draw → predicts home win
}

const STRATEGIES: Record<string, Strategy> = {
  // Pedro — Hall da Vergonha: always wrong, always inverts
  Pedro: (gc, gf) => wrongWinner(gc, gf),

  // João — Zebra do Dia: acertou exatos em J3 e J7 (zebras/surpresas), erra o resto
  Joao: (gc, gf, num) => {
    if (num === 3 || num === 7) return { gols_casa: gc, gols_fora: gf } // exact
    if (num === 2)              return { gols_casa: gc, gols_fora: gf } // acertou também
    return wrongWinner(gc, gf)
  },

  // Maria — subiu muito: acerta vencedor em quase tudo (5 pts cada), exato em J1 e J5
  Maria: (gc, gf, num) => {
    if (num === 1 || num === 5) return { gols_casa: gc, gols_fora: gf } // exact
    if (gc > gf) return { gols_casa: gc + 1, gols_fora: gf }           // right winner, different score
    if (gf > gc) return { gols_casa: gc, gols_fora: gf + 1 }           // right winner, different score
    return { gols_casa: 1, gols_fora: 1 }                               // draw → draw (5 pts)
  },

  // Carlos — Covarde: always 0×0 (0 pts everywhere unless actual result was 0×0)
  Carlos: () => ({ gols_casa: 0, gols_fora: 0 }),

  // Ana — Telepata: exact scores em J1, J3, J5, J7; right winner elsewhere
  Ana: (gc, gf, num) => {
    if ([1, 3, 5, 7].includes(num)) return { gols_casa: gc, gols_fora: gf } // exact
    if (gc > gf) return { gols_casa: gc + 1, gols_fora: gf }
    if (gf > gc) return { gols_casa: gc, gols_fora: gf + 1 }
    return { gols_casa: 0, gols_fora: 0 }
  },
}

const USERS = [
  { email: 'pedro@teste.com',  username: 'Pedro',  password: 'Teste@123' },
  { email: 'joao@teste.com',   username: 'Joao',   password: 'Teste@123' },
  { email: 'maria@teste.com',  username: 'Maria',  password: 'Teste@123' },
  { email: 'carlos@teste.com', username: 'Carlos', password: 'Teste@123' },
  { email: 'ana@teste.com',    username: 'Ana',    password: 'Teste@123' },
]

const ESPECIAIS: Record<string, {
  campeao: string; vice_campeao: string; terceiro: string; artilheiro: string; melhor_goleiro: string; melhor_defesa: string
}> = {
  Pedro:  { campeao: 'Argentina',    vice_campeao: 'Brasil',         terceiro: 'Holanda',   artilheiro: 'Messi',       melhor_goleiro: 'Dibu Martínez', melhor_defesa: 'Romero' },
  Joao:   { campeao: 'Japão',        vice_campeao: 'Marrocos',       terceiro: 'Senegal',   artilheiro: 'Osako',       melhor_goleiro: 'Sommer',        melhor_defesa: 'Hakimi' },
  Maria:  { campeao: 'Brasil',       vice_campeao: 'França',         terceiro: 'Argentina', artilheiro: 'Vinicius Jr', melhor_goleiro: 'Ederson',       melhor_defesa: 'Marquinhos' },
  Carlos: { campeao: 'Brasil',       vice_campeao: 'Alemanha',       terceiro: 'Espanha',   artilheiro: 'Neymar',      melhor_goleiro: 'Alisson',       melhor_defesa: 'Militão' },
  Ana:    { campeao: 'Brasil',       vice_campeao: 'Espanha',        terceiro: 'França',    artilheiro: 'Vinicius Jr', melhor_goleiro: 'Ederson',       melhor_defesa: 'Marquinhos' },
}

async function main() {
  console.log('🌱  Iniciando seed de usuários de teste...\n')

  // 1. Fetch encerrados games (J1–J8)
  const { data: jogos, error: jogosErr } = await supabase
    .from('jogos')
    .select('id, numero_jogo, time_casa, time_fora, gols_casa, gols_fora')
    .eq('encerrado', true)
    .order('numero_jogo')

  if (jogosErr || !jogos?.length) {
    console.error('❌  Nenhum jogo encerrado encontrado:', jogosErr?.message)
    process.exit(1)
  }
  console.log(`📋  ${jogos.length} jogos encerrados encontrados:`)
  for (const j of jogos as Jogo[]) {
    console.log(`    J${j.numero_jogo}: ${j.time_casa} ${j.gols_casa}×${j.gols_fora} ${j.time_fora}`)
  }
  console.log()

  const createdIds: Record<string, string> = {}

  // 2. Create / re-use each user
  for (const u of USERS) {
    // Check if user already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', u.username)
      .maybeSingle()

    if (existing?.id) {
      console.log(`⚠️   ${u.username} já existe — reutilizando (id: ${existing.id.slice(0, 8)}...)`)
      createdIds[u.username] = existing.id
      continue
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { username: u.username },
    })

    if (error) {
      // User might already exist in auth but not in profiles
      console.warn(`⚠️   Erro ao criar ${u.username}: ${error.message}`)
      continue
    }
    createdIds[u.username] = data.user.id
    console.log(`✅  ${u.username} criado (${u.email}) — id: ${data.user.id.slice(0, 8)}...`)

    // Brief pause to let the trigger create the profile
    await new Promise(r => setTimeout(r, 300))

    // Update profile: primeiro_acesso = false, senha_trocada = true
    await supabase
      .from('profiles')
      .update({ primeiro_acesso: false, senha_trocada: true })
      .eq('id', data.user.id)
  }
  console.log()

  // 3. Insert palpites for each user
  console.log('🎯  Inserindo palpites...')
  for (const u of USERS) {
    const userId = createdIds[u.username]
    if (!userId) { console.warn(`  ⚠️  Pulando ${u.username} (sem ID)`); continue }

    const strategy = STRATEGIES[u.username]
    const rows = (jogos as Jogo[]).map(j => ({
      user_id:   userId,
      jogo_id:   j.id,
      ...strategy(j.gols_casa, j.gols_fora, j.numero_jogo),
    }))

    const { error } = await supabase
      .from('palpites')
      .upsert(rows, { onConflict: 'user_id,jogo_id' })

    if (error) console.warn(`  ⚠️  Erro palpites ${u.username}: ${error.message}`)
    else       console.log(`  ✅  ${u.username}: ${rows.length} palpites inseridos`)
  }
  console.log()

  // 4. Re-trigger point calculation by touching encerrados jogos
  console.log('⚡  Recalculando pontos (re-trigger)...')
  for (const j of jogos as Jogo[]) {
    await supabase
      .from('jogos')
      .update({ gols_casa: j.gols_casa, gols_fora: j.gols_fora, encerrado: true })
      .eq('id', j.id)
  }
  console.log('  ✅  Trigger disparado para todos os jogos encerrados\n')

  // 5. Insert escolhas especiais
  console.log('🏆  Inserindo escolhas especiais...')
  for (const u of USERS) {
    const userId = createdIds[u.username]
    if (!userId) continue
    const e = ESPECIAIS[u.username]
    const { error } = await supabase
      .from('escolhas_especiais')
      .upsert({ user_id: userId, ...e }, { onConflict: 'user_id' })
    if (error) console.warn(`  ⚠️  Erro especiais ${u.username}: ${error.message}`)
    else       console.log(`  ✅  ${u.username}: campeão=${e.campeao}, artilheiro=${e.artilheiro}, goleiro=${e.melhor_goleiro}`)
  }
  console.log()

  // 6. Verification: show profiles and scores
  console.log('📊  Verificação final:')
  await new Promise(r => setTimeout(r, 800))

  const { data: profiles } = await supabase
    .from('profiles')
    .select('username, is_admin')
    .in('username', USERS.map(u => u.username))
    .order('username')

  console.log('\n  Profiles:')
  for (const p of profiles ?? []) {
    console.log(`    ${p.username} — is_admin: ${p.is_admin}`)
  }

  // Show palpite points summary
  const { data: palpitesSummary } = await supabase
    .from('palpites')
    .select('user_id, pontos')

  const byUser: Record<string, number> = {}
  for (const p of palpitesSummary ?? []) {
    byUser[p.user_id] = (byUser[p.user_id] ?? 0) + p.pontos
  }

  console.log('\n  Pontuação:')
  for (const u of USERS) {
    const uid = createdIds[u.username]
    if (uid) console.log(`    ${u.username}: ${byUser[uid] ?? 0} pts`)
  }

  console.log('\n✅  Seed completo!')
}

main().catch(err => {
  console.error('❌ Erro fatal:', err)
  process.exit(1)
})
