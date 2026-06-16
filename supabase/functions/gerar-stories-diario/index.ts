// Edge Function: gerar-stories-diario
// Orquestra a geração dos 6 stories do dia anterior e PUBLICA todos.
// Pensada para ser chamada por um cron diário (ver supabase/functions/cron-config.sql).
//
// Body (opcional): { dia?: "YYYY-MM-DD" }  // BRT; sem ele, usa o dia anterior.
//
// Reutiliza a função `gerar-story` (que já faz o recorte do dia) chamando-a
// uma vez por template, em paralelo, e depois marca todos como publicados.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

const TEMPLATES = [
  'hall_vergonha',
  'zebra_dia',
  'vidente_chutometro',
  'subiu_afundou',
  'palpite_covarde',
  'telepata_rodada',
] as const

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  let dia: string | undefined
  try {
    const body = await req.json()
    dia = body?.dia
  } catch { /* sem body */ }

  const fnUrl = `${supabaseUrl}/functions/v1/gerar-story`

  // Gera os 6 templates em paralelo (cada um já filtra o dia anterior).
  const resultados = await Promise.all(
    TEMPLATES.map(async (template) => {
      try {
        const r = await fetch(fnUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
          body: JSON.stringify(dia ? { template, dia } : { template }),
        })
        const j = await r.json().catch(() => ({}))
        if (r.ok && j.id) return { template, ok: true, id: j.id as string }
        return { template, ok: false, status: r.status, error: j.error ?? 'falha' }
      } catch (e) {
        return { template, ok: false, error: String(e) }
      }
    }),
  )

  const ids = resultados.filter((r) => r.ok && r.id).map((r) => r.id as string)

  // Publica todos os gerados de uma vez.
  if (ids.length) {
    await supabase
      .from('stories')
      .update({ publicado: true, publicado_em: new Date().toISOString() })
      .in('id', ids)
  }

  return new Response(
    JSON.stringify({ dia: dia ?? 'ontem (BRT)', gerados: ids.length, resultados }),
    { headers: { ...CORS, 'Content-Type': 'application/json' } },
  )
})
