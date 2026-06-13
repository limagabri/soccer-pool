// Edge Function: sync-resultados
// Fetches finished match results from football-data.org and updates the DB.
// Triggered by Supabase Cron every 2 minutes during tournament window.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const API_BASE = 'https://api.football-data.org/v4'
// Verify competition code at: https://api.football-data.org/v4/competitions
// WC is the current FIFA World Cup; update to WC2026 if needed
const COMPETITION = Deno.env.get('FOOTBALL_COMPETITION_CODE') ?? 'WC'

// English (football-data.org) → Portuguese (our database)
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
  'Peru': 'Peru',
  'Uruguay': 'Uruguai',
  'Italy': 'Itália',
  'South Korea': 'Coreia do Sul',
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
}

function toPortuguese(name: string): string {
  return TEAM_NAME_MAP[name] ?? name
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const apiKey      = Deno.env.get('FOOTBALL_API_KEY')!

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'FOOTBALL_API_KEY not set' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // Fetch LIVE + FINISHED matches
  const res = await fetch(
    `${API_BASE}/competitions/${COMPETITION}/matches?status=LIVE,FINISHED`,
    { headers: { 'X-Auth-Token': apiKey } }
  )

  if (!res.ok) {
    return new Response(
      JSON.stringify({ error: 'football-data.org API error', status: res.status }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const { matches } = await res.json() as {
    matches: Array<{
      status: string
      utcDate: string
      homeTeam: { name: string }
      awayTeam: { name: string }
      score: { fullTime: { home: number | null; away: number | null } }
    }>
  }

  let updated = 0
  const errors: string[] = []

  for (const match of matches) {
    if (match.status !== 'FINISHED') continue
    const { home, away } = match.score.fullTime
    if (home == null || away == null) continue

    const timeCasa = toPortuguese(match.homeTeam.name)
    const timeFora = toPortuguese(match.awayTeam.name)

    // Match by date (UTC day) + teams
    const dataDia = match.utcDate.slice(0, 10) // "YYYY-MM-DD"

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
    if (jogo.encerrado && jogo.gols_casa === home && jogo.gols_fora === away) continue

    const { error } = await supabase
      .from('jogos')
      .update({ gols_casa: home, gols_fora: away, encerrado: true })
      .eq('id', jogo.id)

    if (error) errors.push(`Update error for ${jogo.id}: ${error.message}`)
    else updated++
  }

  return new Response(
    JSON.stringify({ updated, checked: matches.length, errors }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
