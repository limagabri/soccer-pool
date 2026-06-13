// Edge Function: gerar-story
// Generates a comic story card using OpenAI gpt-5.5.
// Body: { template: string }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API = 'https://api.openai.com/v1/chat/completions'
const MODEL = 'gpt-5.5'

type Template =
  | 'hall_vergonha'
  | 'zebra_dia'
  | 'vidente_chutometro'
  | 'subiu_afundou'
  | 'palpite_covarde'
  | 'telepata_rodada'

const SYSTEM = `Você é Seu Zé, comentarista de boteco do bolão da Copa 2026.
Escreva textos curtos (máximo 120 palavras), engraçados e provocativos.
Use gírias, humor e mencione os nomes reais dos participantes.
Nunca seja ofensivo, apenas bem-humorado.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' }
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const openaiKey   = Deno.env.get('OPENAI_API_KEY')!

  const supabase = createClient(supabaseUrl, serviceKey)
  const { template } = await req.json() as { template: Template }

  const { data: profiles } = await supabase.from('profiles').select('id, username')
  const { data: jogos }    = await supabase.from('jogos').select('id, time_casa, time_fora, gols_casa, gols_fora, rodada').eq('encerrado', true)
  const { data: palpites } = await supabase.from('palpites').select('user_id, jogo_id, gols_casa, gols_fora, pontos')
  const { data: ranking }  = await supabase.from('ranking_historico').select('user_id, posicao, pontos, snapshot_em').order('snapshot_em', { ascending: false }).limit(100)

  const nomeMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.username ?? 'Anônimo']))
  const jogoMap = Object.fromEntries((jogos ?? []).map(j => [j.id, j]))

  // ── Build data per template ────────────────────────────────────────────────
  let titulo = ''
  let dados: Record<string, unknown> = {}
  let userPrompt = ''

  if (template === 'hall_vergonha') {
    titulo = '🏆 Hall da Vergonha'
    let piorNome = '', piorErro = 0, piorDetalhes = ''
    for (const p of palpites ?? []) {
      const j = jogoMap[p.jogo_id]
      if (!j || j.gols_casa == null) continue
      const erro = Math.abs(p.gols_casa - j.gols_casa) + Math.abs(p.gols_fora - j.gols_fora)
      if (erro > piorErro) {
        piorErro = erro
        piorNome = nomeMap[p.user_id]
        piorDetalhes = `apostou ${p.gols_casa}x${p.gols_fora} em ${j.time_casa} x ${j.time_fora} (resultado: ${j.gols_casa}x${j.gols_fora})`
      }
    }
    dados = { homenageado: piorNome, detalhes: piorDetalhes, erro: piorErro }
    userPrompt = `Hall da Vergonha do dia. ${piorNome || 'Alguém'} merece o prêmio: ${piorDetalhes || 'por palpites horríveis'}. Escreva a consagração cômica.`

  } else if (template === 'zebra_dia') {
    titulo = '🦓 Zebra do Dia'
    let vencedorNome = '', zebraDetalhes = ''
    // Find user who correctly predicted the most unlikely result (low-scoring draw or upset)
    for (const p of palpites ?? []) {
      const j = jogoMap[p.jogo_id]
      if (!j || j.gols_casa == null) continue
      if (p.gols_casa === j.gols_casa && p.gols_fora === j.gols_fora) {
        // Correct! Was it a draw or low-scoring?
        if (j.gols_casa === 0 && j.gols_fora === 0) {
          vencedorNome = nomeMap[p.user_id]
          zebraDetalhes = `acertou o 0x0 em ${j.time_casa} x ${j.time_fora}`
        }
      }
    }
    if (!vencedorNome) {
      // Fallback: who got the most points today
      const pontosHoje: Record<string, number> = {}
      for (const p of palpites ?? []) {
        const j = jogoMap[p.jogo_id]
        if (!j) continue
        pontosHoje[p.user_id] = (pontosHoje[p.user_id] ?? 0) + (p.pontos ?? 0)
      }
      const top = Object.entries(pontosHoje).sort((a, b) => b[1] - a[1])[0]
      if (top) { vencedorNome = nomeMap[top[0]]; zebraDetalhes = `${top[1]} pontos` }
    }
    dados = { vencedor: vencedorNome, detalhes: zebraDetalhes }
    userPrompt = `Zebra do dia: ${vencedorNome || 'alguém'} pegou uma zebra e ${zebraDetalhes}. Comemore de forma exagerada.`

  } else if (template === 'vidente_chutometro') {
    titulo = '🔮 Vidente ou Chutômetro?'
    const stats: Record<string, { acertos: number; erros: number }> = {}
    for (const p of palpites ?? []) {
      const j = jogoMap[p.jogo_id]
      if (!j || j.gols_casa == null) continue
      if (!stats[p.user_id]) stats[p.user_id] = { acertos: 0, erros: 0 }
      if (p.gols_casa === j.gols_casa && p.gols_fora === j.gols_fora) stats[p.user_id].acertos++
      else stats[p.user_id].erros++
    }
    const melhor = Object.entries(stats).sort((a, b) => b[1].acertos - a[1].acertos)[0]
    const pior   = Object.entries(stats).sort((a, b) => b[1].erros - a[1].erros)[0]
    dados = {
      melhor: { nome: nomeMap[melhor?.[0]] ?? '—', ...melhor?.[1] },
      pior:   { nome: nomeMap[pior?.[0]]   ?? '—', ...pior?.[1] },
    }
    userPrompt = `Comparação de acertos: ${nomeMap[melhor?.[0]] ?? 'alguém'} acertou ${melhor?.[1]?.acertos ?? 0} placares. ${nomeMap[pior?.[0]] ?? 'outro'} errou ${pior?.[1]?.erros ?? 0} vezes. Comente ironicamente.`

  } else if (template === 'subiu_afundou') {
    titulo = '📈 Subiu / 📉 Afundou'
    // Compare last two snapshots
    const snapshots = (ranking ?? [])
    const userPos: Record<string, number[]> = {}
    for (const s of snapshots) {
      if (!userPos[s.user_id]) userPos[s.user_id] = []
      if (userPos[s.user_id].length < 2) userPos[s.user_id].push(s.posicao)
    }
    let maiorSubida = 0, nomeSubiu = ''
    let maiorQueda = 0, nomeAfundou = ''
    for (const [uid, posicoes] of Object.entries(userPos)) {
      if (posicoes.length < 2) continue
      const delta = posicoes[1] - posicoes[0] // older - newer = positive means moved up
      if (delta > maiorSubida) { maiorSubida = delta; nomeSubiu = nomeMap[uid] }
      if (delta < -maiorQueda) { maiorQueda = -delta; nomeAfundou = nomeMap[uid] }
    }
    dados = { subiu: { nome: nomeSubiu, posicoes: maiorSubida }, afundou: { nome: nomeAfundou, posicoes: maiorQueda } }
    userPrompt = `Movimentação do ranking: ${nomeSubiu || 'alguém'} subiu ${maiorSubida} posições. ${nomeAfundou || 'outro'} caiu ${maiorQueda} posições. Comente dramaticamente.`

  } else if (template === 'palpite_covarde') {
    titulo = '🐔 Palpite Mais Covarde'
    // Who predicted most 0x0 or 1x0 results
    const covardia: Record<string, number> = {}
    for (const p of palpites ?? []) {
      const total = p.gols_casa + p.gols_fora
      if (total <= 1) covardia[p.user_id] = (covardia[p.user_id] ?? 0) + 1
    }
    const campeao = Object.entries(covardia).sort((a, b) => b[1] - a[1])[0]
    dados = { covarde: { nome: nomeMap[campeao?.[0]] ?? '—', count: campeao?.[1] ?? 0 } }
    userPrompt = `${nomeMap[campeao?.[0]] ?? 'Alguém'} apostou ${campeao?.[1] ?? 0} placares covarde tipo 0x0 ou 1x0. Zombe dessa falta de coragem.`

  } else if (template === 'telepata_rodada') {
    titulo = '🧠 Telepata da Rodada'
    const exatos: Record<string, number> = {}
    for (const p of palpites ?? []) {
      if ((p.pontos ?? 0) === 10) exatos[p.user_id] = (exatos[p.user_id] ?? 0) + 1
    }
    const top = Object.entries(exatos).sort((a, b) => b[1] - a[1])[0]
    dados = { telepata: { nome: nomeMap[top?.[0]] ?? '—', acertos: top?.[1] ?? 0 } }
    userPrompt = `${nomeMap[top?.[0]] ?? 'Alguém'} acertou ${top?.[1] ?? 0} placares exatos. É vidência ou sorte? Comente exageradamente.`
  }

  // ── Call OpenAI ─────────────────────────────────────────────────────────────
  const aiRes = await fetch(OPENAI_API, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user',   content: userPrompt },
      ],
      max_completion_tokens: 200,
    }),
  })

  if (!aiRes.ok) {
    const detail = await aiRes.text()
    return new Response(JSON.stringify({ error: 'OpenAI error', status: aiRes.status, detail }), {
      status: 502, headers: { 'Content-Type': 'application/json' },
    })
  }

  const aiData = await aiRes.json()
  const conteudo_ia = aiData.choices?.[0]?.message?.content ?? ''

  const { data: saved, error } = await supabase
    .from('stories')
    .insert({ template, titulo, conteudo_ia, dados, publicado: false })
    .select('id')
    .single()

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  return new Response(
    JSON.stringify({ id: saved.id, titulo, conteudo_ia, dados }),
    { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
  )
})
