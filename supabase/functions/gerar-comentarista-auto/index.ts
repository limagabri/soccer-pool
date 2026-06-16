// Edge Function: gerar-comentarista-auto
// Detecta rodadas concluídas e dispara o comentário do "Seu Zé" automaticamente,
// publicando na hora. Pensada para um cron (ver supabase/functions/cron-config.sql).
//
// FASE DE GRUPOS: a rodada N é considerada concluída quando TODOS os jogos com
// `rodada = N` (todos os 12 grupos) estão encerrados. Gera 1 comentário por rodada,
// uma única vez (idempotente: pula se já houver comentário publicado para a rodada).
//
// MATA-MATA (32avos, oitavas, quartas, semis, final): ainda não automatizado porque
// esses jogos não existem na tabela `jogos` (o bolão cobre apenas a fase de grupos).
// Quando/se os jogos de mata-mata forem modelados, basta estender PHASES abaixo.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

// Rodadas da fase de grupos a observar.
const GROUP_ROUNDS = [1, 2, 3]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  const countJogos = async (rodada: number, encerrado?: boolean) => {
    let q = supabase.from('jogos').select('*', { count: 'exact', head: true }).eq('rodada', rodada)
    if (encerrado !== undefined) q = q.eq('encerrado', encerrado)
    const { count } = await q
    return count ?? 0
  }

  const resultados: Array<Record<string, unknown>> = []

  for (const n of GROUP_ROUNDS) {
    const total = await countJogos(n)
    if (total === 0) continue
    const done = await countJogos(n, true)

    if (done < total) {
      resultados.push({ rodada: n, status: 'incompleta', done, total })
      continue
    }

    // Já existe comentário PUBLICADO para esta rodada? Então não refaz.
    const { count: jaPublicado } = await supabase
      .from('comentarios_ia').select('*', { count: 'exact', head: true })
      .eq('tipo', 'rodada_grupos').eq('numero_rodada', n).eq('publicado', true)

    if (jaPublicado && jaPublicado > 0) {
      resultados.push({ rodada: n, status: 'ja_publicado' })
      continue
    }

    // Gera (reusa gerar-comentarista) e publica.
    try {
      const r = await fetch(`${supabaseUrl}/functions/v1/gerar-comentarista`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
        body: JSON.stringify({ tipo: 'rodada_grupos', numero_rodada: n }),
      })
      const j = await r.json().catch(() => ({}))
      if (r.ok && j.id) {
        await supabase
          .from('comentarios_ia')
          .update({ publicado: true, publicado_em: new Date().toISOString() })
          .eq('id', j.id)
        resultados.push({ rodada: n, status: 'gerado_publicado', id: j.id })
      } else {
        resultados.push({ rodada: n, status: 'erro', error: j.error ?? r.status })
      }
    } catch (e) {
      resultados.push({ rodada: n, status: 'erro', error: String(e) })
    }
  }

  return new Response(JSON.stringify({ resultados }), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})
