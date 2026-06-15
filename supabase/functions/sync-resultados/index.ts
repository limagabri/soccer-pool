// Edge Function: sync-resultados
// Fetches finished match results from ESPN public API (no auth needed) and updates the DB.
// Triggered by Supabase Cron every 2 minutes during tournament window.
// Can also be triggered manually via AdminJogos "Sincronizar agora" button.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'
// Per-match detail endpoint — has the goalscorers (keyEvents) the scoreboard lacks.
const ESPN_SUMMARY = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary'

interface EspnTeam {
  team: { displayName: string }
  score: string
  homeAway: 'home' | 'away'
}

interface EspnEvent {
  id: string
  date: string
  competitions: Array<{
    status: { type: { name: string; completed: boolean } }
    competitors: EspnTeam[]
  }>
}

// ESPN display name → Portuguese name used in the DB
const TEAM_NAME_MAP: Record<string, string> = {
  'Brazil': 'Brasil',
  'France': 'França',
  'Germany': 'Alemanha',
  'Netherlands': 'Holanda',
  'Spain': 'Espanha',
  'England': 'Inglaterra',
  'Portugal': 'Portugal',
  'Argentina': 'Argentina',
  'United States': 'Estados Unidos',
  'USA': 'Estados Unidos',
  'Mexico': 'México',
  'Canada': 'Canadá',
  'Panama': 'Panamá',
  'Morocco': 'Marrocos',
  'Ukraine': 'Ucrânia',
  'Iraq': 'Iraque',
  'South Africa': 'África do Sul',
  'Tunisia': 'Tunísia',
  'Switzerland': 'Suíça',
  'Senegal': 'Senegal',
  'Colombia': 'Colômbia',
  'Ecuador': 'Equador',
  'Nigeria': 'Nigéria',
  'Japan': 'Japão',
  "Côte d'Ivoire": 'Costa do Marfim',
  'Ivory Coast': 'Costa do Marfim',
  'Costa Rica': 'Costa Rica',
  'Peru': 'Peru',
  'Uruguay': 'Uruguai',
  'Italy': 'Itália',
  'South Korea': 'Coreia do Sul',
  'Korea Republic': 'Coreia do Sul',
  'Algeria': 'Argélia',
  'Croatia': 'Croácia',
  'Iran': 'Irã',
  'Belgium': 'Bélgica',
  'Australia': 'Austrália',
  'Romania': 'Romênia',
  'Saudi Arabia': 'Arábia Saudita',
  'DR Congo': 'RD Congo',
  'Congo DR': 'RD Congo',
  'Serbia': 'Sérvia',
  'Poland': 'Polônia',
  'Denmark': 'Dinamarca',
  'Austria': 'Áustria',
  'Turkey': 'Turquia',
  'Türkiye': 'Turquia',
  'Turkiye': 'Turquia',
  'Sweden': 'Suécia',
  'Norway': 'Noruega',
  // Names must match exactly what's stored in the DB (from seed SQL)
  'Bosnia-Herzegovina': 'Bósnia-Herzegóvina',
  'Bosnia and Herzegovina': 'Bósnia-Herzegóvina',
  'Paraguay': 'Paraguai',
  'Czech Republic': 'Rep. Tcheca',
  'Czechia': 'Rep. Tcheca',
  'Haiti': 'Haiti',
  'Curacao': 'Curaçao',
  'Curaçao': 'Curaçao',
  'Jordan': 'Jordânia',
  'Uzbekistan': 'Uzbequistão',
  'Venezuela': 'Venezuela',
  'Chile': 'Chile',
  'Honduras': 'Honduras',
  'Guatemala': 'Guatemala',
  'El Salvador': 'El Salvador',
  'Cuba': 'Cuba',
  'Jamaica': 'Jamaica',
  'Trinidad & Tobago': 'Trinidad e Tobago',
  'Trinidad and Tobago': 'Trinidad e Tobago',
  'Slovenia': 'Eslovênia',
  'Slovakia': 'Eslováquia',
  'Hungary': 'Hungria',
  'Scotland': 'Escócia',
  'Wales': 'País de Gales',
  'Albania': 'Albânia',
  'Cameroon': 'Camarões',
  'Ghana': 'Gana',
  'Egypt': 'Egito',
  'Mali': 'Mali',
  'Benin': 'Benim',
  'Cape Verde': 'Cabo Verde',
  'New Zealand': 'Nova Zelândia',
  'United Arab Emirates': 'Emirados Árabes',
  'UAE': 'Emirados Árabes',
  'Qatar': 'Catar',
  'Indonesia': 'Indonésia',
  'Thailand': 'Tailândia',
  'Vietnam': 'Vietnã',
}

function toPT(name: string): string {
  return TEAM_NAME_MAP[name] ?? name
}

// "16'", "90'+2'", "45+1'" → 16 / 90 / 45
function parseMinuto(raw?: string): number | null {
  if (!raw) return null
  const m = raw.match(/\d+/)
  return m ? parseInt(m[0], 10) : null
}

interface EventoGol {
  jogo_id: string
  tipo: 'gol' | 'gol_contra' | 'assistencia'
  jogador: string
  selecao: string
  minuto: number | null
}

// Fetches the match summary from ESPN and extracts goals + assists.
// keyEvents with scoringPlay=true are goals; participants[0] is the scorer,
// participants[1] (when present) is the assister.
async function buscarEventosGol(espnEventId: string, jogoId: string): Promise<EventoGol[]> {
  const res = await fetch(`${ESPN_SUMMARY}?event=${espnEventId}`)
  if (!res.ok) return []
  // deno-lint-ignore no-explicit-any
  const data = await res.json() as any
  const keyEvents = (data?.keyEvents ?? []) as Array<Record<string, unknown>>
  const out: EventoGol[] = []

  for (const ev of keyEvents) {
    // deno-lint-ignore no-explicit-any
    const e = ev as any
    if (!e?.scoringPlay) continue
    const selecao = toPT(e.team?.displayName ?? '')
    const minuto = parseMinuto(e.clock?.displayValue)
    const golContra = /own goal/i.test(e.type?.text ?? '')

    const artilheiro = e.participants?.[0]?.athlete?.displayName
    if (artilheiro) {
      out.push({ jogo_id: jogoId, tipo: golContra ? 'gol_contra' : 'gol', jogador: artilheiro, selecao, minuto })
    }
    // Assists don't count for own goals.
    const assistente = e.participants?.[1]?.athlete?.displayName
    if (assistente && !golContra) {
      out.push({ jogo_id: jogoId, tipo: 'assistencia', jogador: assistente, selecao, minuto })
    }
  }
  return out
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  // Accept optional body: { dates: ["YYYYMMDD", ...] } to sync specific dates
  let customDates: string[] | undefined
  try {
    const body = await req.json()
    if (Array.isArray(body?.dates)) customDates = body.dates
  } catch { /* GET or empty body */ }

  // Default: yesterday + today (catches late-finishing games from previous UTC day)
  let datesToFetch: string[]
  if (customDates?.length) {
    datesToFetch = customDates
  } else {
    const pad = (n: number) => String(n).padStart(2, '0')
    const fmt = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`
    const now = new Date()
    const yesterday = new Date(now.getTime() - 86_400_000)
    datesToFetch = [fmt(yesterday), fmt(now)]
  }

  const allEvents: EspnEvent[] = []
  for (const dateStr of datesToFetch) {
    const res = await fetch(`${ESPN_BASE}?dates=${dateStr}`)
    if (!res.ok) continue
    const data = await res.json() as { events?: EspnEvent[] }
    if (data.events) allEvents.push(...data.events)
  }

  let updated = 0
  let eventosSync = 0
  const errors: string[] = []
  const seen = new Set<string>()

  for (const event of allEvents) {
    if (seen.has(event.id)) continue
    seen.add(event.id)

    const comp = event.competitions?.[0]
    if (!comp?.status.type.completed) continue

    const home = comp.competitors.find((c) => c.homeAway === 'home')
    const away = comp.competitors.find((c) => c.homeAway === 'away')
    if (!home || !away) continue

    const scoreHome = parseInt(home.score, 10)
    const scoreAway = parseInt(away.score, 10)
    if (isNaN(scoreHome) || isNaN(scoreAway)) continue

    const timeCasa = toPT(home.team.displayName)
    const timeFora = toPT(away.team.displayName)
    const dataDia  = event.date.slice(0, 10) // "YYYY-MM-DD"

    const { data: jogos } = await supabase
      .from('jogos')
      .select('id, encerrado, gols_casa, gols_fora')
      .eq('time_casa', timeCasa)
      .eq('time_fora', timeFora)
      .gte('data_jogo', `${dataDia}T00:00:00`)
      .lt('data_jogo',  `${dataDia}T23:59:59`)
      .limit(1)

    if (!jogos?.length) {
      errors.push(`Not found: ${timeCasa} x ${timeFora} on ${dataDia}`)
      continue
    }

    const jogo = jogos[0]

    // 1) Update the score when it changed (or the game just finished).
    const placarMudou =
      !jogo.encerrado || jogo.gols_casa !== scoreHome || jogo.gols_fora !== scoreAway
    if (placarMudou) {
      const { error } = await supabase
        .from('jogos')
        .update({ gols_casa: scoreHome, gols_fora: scoreAway, encerrado: true })
        .eq('id', jogo.id)
      if (error) {
        errors.push(`Update error for ${jogo.id}: ${error.message}`)
        continue
      }
      updated++
    }

    // 2) Sync goalscorers/assists (feeds the Artilharia). Cheap-by-default:
    //    only hit the summary endpoint when the goals we already stored don't
    //    add up to the final score — so the cron stays light and old games get
    //    backfilled automatically.
    const totalGols = scoreHome + scoreAway
    const { count } = await supabase
      .from('eventos_jogo')
      .select('id', { count: 'exact', head: true })
      .eq('jogo_id', jogo.id)
      .in('tipo', ['gol', 'gol_contra'])

    if ((count ?? 0) !== totalGols) {
      try {
        const eventos = await buscarEventosGol(event.id, jogo.id)
        // Only replace if it actually changes the stored set, to avoid churn
        // when ESPN's data is momentarily incomplete.
        if (eventos.length && eventos.filter((e) => e.tipo !== 'assistencia').length !== (count ?? 0)) {
          await supabase.from('eventos_jogo').delete().eq('jogo_id', jogo.id)
          const { error: evErr } = await supabase.from('eventos_jogo').insert(eventos)
          if (evErr) errors.push(`Eventos error for ${jogo.id}: ${evErr.message}`)
          else eventosSync += eventos.length
        }
      } catch (err) {
        errors.push(`Eventos fetch for ${jogo.id}: ${String(err)}`)
      }
    }
  }

  return new Response(
    JSON.stringify({ updated, eventosSync, checked: allEvents.length, datesToFetch, errors }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
