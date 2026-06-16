// Edge Function: gerar-comentarista-auto
// Detecta rodadas/fases concluídas e dispara o comentário do "Seu Zé"
// automaticamente, publicando na hora. Pensada para um cron (ver cron-config.sql).
//
// FASE DE GRUPOS: a rodada N (1/2/3) é concluída quando TODOS os jogos com
// `rodada = N` (todos os 12 grupos) estão encerrados.
// MATA-MATA: cada fase (r32/oitavas/quartas/semis/final) é concluída quando todos
// os jogos daquela `fase` estão encerrados (o 3º lugar entra no recap da final).
// Idempotente: pula se já houver um comentário publicado para aquele tipo/rodada.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

const GROUP_ROUNDS = [1, 2, 3]

// Fases do mata-mata -> tipo do comentário. 'final' cobre final + 3º lugar.
const KO_PHASES: Array<{ tipo: string; fases: string[] }> = [
  { tipo: 'rodada_32avos',  fases: ['r32'] },
  { tipo: 'rodada_oitavas', fases: ['oitavas'] },
  { tipo: 'rodada_quartas', fases: ['quartas'] },
  { tipo: 'rodada_semis',   fases: ['semis'] },
  { tipo: 'rodada_final',   fases: ['final', 'terceiro'] },
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  const resultados: Array<Record<string, unknown>> = []

  // Gera (reusa gerar-comentarista) e publica; idempotência via checagem do tipo.
  async function gerarEPublicar(payload: Record<string, unknown>, rotulo: Record<string, unknown>) {
    try {
      const r = await fetch(`${supabaseUrl}/functions/v1/gerar-comentarista`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
        body: JSON.stringify(payload),
      })
      const j = await r.json().catch(() => ({}))
      if (r.ok && j.id) {
        await supabase.from('comentarios_ia')
          .update({ publicado: true, publicado_em: new Date().toISOString() })
          .eq('id', j.id)
        resultados.push({ ...rotulo, status: 'gerado_publicado', id: j.id })
      } else {
        resultados.push({ ...rotulo, status: 'erro', error: j.error ?? r.status })
      }
    } catch (e) {
      resultados.push({ ...rotulo, status: 'erro', error: String(e) })
    }
  }

  const countJogos = async (filtro: (q: ReturnType<typeof baseQuery>) => ReturnType<typeof baseQuery>) => {
    const { count } = await filtro(baseQuery())
    return count ?? 0
  }
  function baseQuery() {
    return supabase.from('jogos').select('*', { count: 'exact', head: true })
  }

  // ── Fase de grupos (rodadas 1/2/3) ──────────────────────────────────
  for (const n of GROUP_ROUNDS) {
    const total = await countJogos((q) => q.eq('rodada', n).eq('fase', 'grupos'))
    if (total === 0) { continue }
    const done = await countJogos((q) => q.eq('rodada', n).eq('fase', 'grupos').eq('encerrado', true))
    if (done < total) { resultados.push({ rodada: n, status: 'incompleta', done, total }); continue }

    const { count: jaPublicado } = await supabase
      .from('comentarios_ia').select('*', { count: 'exact', head: true })
      .eq('tipo', 'rodada_grupos').eq('numero_rodada', n).eq('publicado', true)
    if (jaPublicado && jaPublicado > 0) { resultados.push({ rodada: n, status: 'ja_publicado' }); continue }

    await gerarEPublicar({ tipo: 'rodada_grupos', numero_rodada: n }, { rodada: n })
  }

  // ── Mata-mata (por fase) ────────────────────────────────────────────
  for (const { tipo, fases } of KO_PHASES) {
    const total = await countJogos((q) => q.in('fase', fases))
    if (total === 0) { continue }
    const done = await countJogos((q) => q.in('fase', fases).eq('encerrado', true))
    if (done < total) { resultados.push({ tipo, status: 'incompleta', done, total }); continue }

    const { count: jaPublicado } = await supabase
      .from('comentarios_ia').select('*', { count: 'exact', head: true })
      .eq('tipo', tipo).eq('publicado', true)
    if (jaPublicado && jaPublicado > 0) { resultados.push({ tipo, status: 'ja_publicado' }); continue }

    await gerarEPublicar({ tipo }, { tipo })
  }

  return new Response(JSON.stringify({ resultados }), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})
