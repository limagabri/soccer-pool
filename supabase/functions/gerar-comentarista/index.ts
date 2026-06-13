// Edge Function: gerar-comentarista
// Generates a round recap by "Seu Zé" using OpenAI gpt-5.5.
// Body: { tipo: string, numero_rodada?: number }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API = 'https://api.openai.com/v1/chat/completions'
const MODEL = 'gpt-5.5'

const SYSTEM_PROMPT = `Você é Seu Zé, um comentarista de boteco brasileiro apaixonado por futebol.
Você comenta os resultados do bolão entre amigos de forma engraçada, exagerada e bem-humorada.
Use gírias brasileiras, referências à cultura popular, faça piadas com os nomes dos participantes
e seus palpites errados. Seja dramático nas derrotas e eufórico nos acertos.
Máximo 300 palavras. Nunca seja ofensivo, apenas engraçado e provocador no bom sentido.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const openaiKey   = Deno.env.get('OPENAI_API_KEY')!

  const authHeader = req.headers.get('authorization') ?? ''
  const supabase   = createClient(supabaseUrl, serviceKey)
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!)
  userClient.auth.setSession({ access_token: authHeader.replace('Bearer ', ''), refresh_token: '' })

  const { tipo, numero_rodada } = await req.json() as {
    tipo: string
    numero_rodada?: number
  }

  // ── 1. Fetch relevant game data ────────────────────────────────────────────
  let jogosQuery = supabase
    .from('jogos')
    .select('id, numero_jogo, time_casa, time_fora, emoji_casa, emoji_fora, gols_casa, gols_fora, rodada, grupo')
    .eq('encerrado', true)

  if (tipo === 'rodada_grupos' && numero_rodada) {
    jogosQuery = jogosQuery.eq('rodada', numero_rodada)
  }

  const { data: jogos } = await jogosQuery.order('numero_jogo')

  // ── 2. Fetch ranking (top 10) ─────────────────────────────────────────────
  const { data: palpites } = await supabase
    .from('palpites')
    .select('user_id, pontos, gols_casa, gols_fora, jogo_id')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username')

  const nomeMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.username]))

  // Aggregate points per user
  const pontosPorUser: Record<string, number> = {}
  for (const p of palpites ?? []) {
    pontosPorUser[p.user_id] = (pontosPorUser[p.user_id] ?? 0) + (p.pontos ?? 0)
  }
  const ranking = Object.entries(pontosPorUser)
    .map(([uid, pts]) => ({ nome: nomeMap[uid] ?? 'Anônimo', pts }))
    .sort((a, b) => b.pts - a.pts)
    .slice(0, 10)

  // Pior palpite da rodada
  let piorPalpite = ''
  if (jogos?.length && palpites?.length) {
    const jogosIds = new Set(jogos.map(j => j.id))
    const rodadaPalpites = palpites.filter(p => jogosIds.has(p.jogo_id))
    const jogoMap = Object.fromEntries(jogos.map(j => [j.id, j]))
    let maiorErro = 0
    for (const p of rodadaPalpites) {
      const j = jogoMap[p.jogo_id]
      if (!j || j.gols_casa == null) continue
      const erro = Math.abs((p.gols_casa - j.gols_casa)) + Math.abs((p.gols_fora - j.gols_fora))
      if (erro > maiorErro) {
        maiorErro = erro
        piorPalpite = `${nomeMap[p.user_id] ?? 'Alguém'} apostou ${p.gols_casa}x${p.gols_fora} no jogo ${j.time_casa} x ${j.time_fora} (resultado foi ${j.gols_casa}x${j.gols_fora})`
      }
    }
  }

  // ── 3. Build prompt ────────────────────────────────────────────────────────
  const resultados = (jogos ?? [])
    .map(j => `${j.emoji_casa} ${j.time_casa} ${j.gols_casa}x${j.gols_fora} ${j.time_fora} ${j.emoji_fora}`)
    .join('\n')

  const rankingTexto = ranking
    .map((r, i) => `${i + 1}º ${r.nome} — ${r.pts} pts`)
    .join('\n')

  const tipoLabel: Record<string, string> = {
    'rodada_grupos': `Rodada ${numero_rodada ?? ''} da Fase de Grupos`,
    'rodada_32avos': '32-avos de Final',
    'rodada_oitavas': 'Oitavas de Final',
    'rodada_quartas': 'Quartas de Final',
    'rodada_semis': 'Semifinais',
    'rodada_final': 'Final da Copa',
  }

  const userPrompt = `Você está comentando a ${tipoLabel[tipo] ?? tipo} do nosso bolão da Copa 2026.

RESULTADOS DA RODADA:
${resultados || 'Nenhum jogo encerrado ainda.'}

RANKING ATUAL (TOP 10):
${rankingTexto || 'Sem dados de ranking.'}

${piorPalpite ? `PIOR PALPITE DA RODADA: ${piorPalpite}` : ''}

Faça um comentário de boteco engraçado e irônico sobre esses resultados. Mencione os nomes reais dos participantes do bolão. Exagere nas reações. Seja dramático!`

  // ── 4. Call OpenAI ─────────────────────────────────────────────────────────
  const aiRes = await fetch(OPENAI_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userPrompt },
      ],
      max_completion_tokens: 500,
    }),
  })

  if (!aiRes.ok) {
    const err = await aiRes.text()
    return new Response(JSON.stringify({ error: 'OpenAI error', detail: err }), {
      status: 502, headers: { 'Content-Type': 'application/json' },
    })
  }

  const aiData = await aiRes.json()
  const conteudo = aiData.choices?.[0]?.message?.content ?? ''

  // ── 5. Save to DB ──────────────────────────────────────────────────────────
  const { data: saved, error: saveErr } = await supabase
    .from('comentarios_ia')
    .insert({ tipo, numero_rodada: numero_rodada ?? null, conteudo, publicado: false })
    .select('id')
    .single()

  if (saveErr) {
    return new Response(JSON.stringify({ error: saveErr.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify({ id: saved.id, conteudo }),
    { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
  )
})
