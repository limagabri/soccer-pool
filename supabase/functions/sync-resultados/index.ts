// Edge Function: sync-resultados
// Fetches finished match results from ESPN public API (no auth needed) and updates the DB.
// Triggered by Supabase Cron every 2 minutes during tournament window.
// Can also be triggered manually via AdminJogos "Sincronizar agora" button.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'

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
  'Sweden': 'Suécia',
  'Norway': 'Noruega',
  'Bosnia-Herzegovina': 'Bósnia e Herzegovina',
  'Bosnia and Herzegovina': 'Bósnia e Herzegovina',
  'Paraguay': 'Paraguai',
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
  'Czech Republic': 'República Tcheca',
  'Czechia': 'República Tcheca',
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

Deno.serve(async (req) => {
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
    if (jogo.encerrado && jogo.gols_casa === scoreHome && jogo.gols_fora === scoreAway) continue

    const { error } = await supabase
      .from('jogos')
      .update({ gols_casa: scoreHome, gols_fora: scoreAway, encerrado: true })
      .eq('id', jogo.id)

    if (error) errors.push(`Update error for ${jogo.id}: ${error.message}`)
    else updated++
  }

  return new Response(
    JSON.stringify({ updated, checked: allEvents.length, datesToFetch, errors }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
