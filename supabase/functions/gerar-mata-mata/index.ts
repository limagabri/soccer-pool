// Edge Function: gerar-mata-mata
// Monta/atualiza automaticamente os jogos do mata-mata (J73–J104) a partir da
// classificação real dos grupos e dos resultados já registrados. Idempotente:
// nunca sobrescreve placar/encerrado/times de um jogo que já começou.
//
// Só age quando a fase de grupos está completa. Times ainda indefinidos ficam
// como placeholder (emoji ⏳ + rótulo de origem) e são preenchidos conforme as
// rodadas anteriores terminam.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  GRUPOS, FASES,
  calcularTodasTabelas, gruposCompletos, melhoresTerceiros,
  montarChaveamento,
  type JogoRow, type ResultadosMataMata, type TimeChave,
} from '../_shared/bracket.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

const PLACEHOLDER_EMOJI = '⏳'

// Datas placeholder por fase (UTC). A ESPN corrige data_jogo depois.
const FASE_DATA: Record<string, string> = {
  r32:      '2026-07-04T20:00:00Z',
  oitavas:  '2026-07-11T20:00:00Z',
  quartas:  '2026-07-17T20:00:00Z',
  semis:    '2026-07-21T20:00:00Z',
  terceiro: '2026-07-25T20:00:00Z',
  final:    '2026-07-26T20:00:00Z',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  const cols = 'id, numero_jogo, grupo, time_casa, time_fora, emoji_casa, emoji_fora, gols_casa, gols_fora, encerrado, fase, vencedor_penaltis'
  const { data: todos } = await supabase.from('jogos').select(cols)
  const jogos = (todos ?? []) as JogoRow[]

  const grupos = jogos.filter((j) => (j.fase ?? 'grupos') === 'grupos')
  const tabelas = calcularTodasTabelas(grupos)
  const completos = gruposCompletos(grupos)
  const tudoCompleto = GRUPOS.every((g) => completos[g])

  if (!tudoCompleto) {
    return new Response(
      JSON.stringify({ status: 'grupos_incompletos', criados: 0, atualizados: 0 }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  }

  const terceiros = melhoresTerceiros(tabelas)

  // Resultados já registrados do mata-mata, para resolver as próximas rodadas.
  const ko = jogos.filter((j) => (j.fase ?? 'grupos') !== 'grupos')
  const koPorNumero = new Map(ko.map((j) => [j.numero_jogo, j]))
  const resultados: ResultadosMataMata = {}
  for (const j of ko) {
    if (j.gols_casa == null || j.gols_fora == null) continue
    const penaltis =
      j.vencedor_penaltis === j.time_casa ? 'casa'
      : j.vencedor_penaltis === j.time_fora ? 'fora'
      : undefined
    resultados[`J${j.numero_jogo}|${j.time_casa}|${j.time_fora}`] = {
      gols_casa: j.gols_casa, gols_fora: j.gols_fora, penaltis,
    }
  }

  const rodadas = montarChaveamento(tabelas, completos, terceiros, resultados)

  let criados = 0, atualizados = 0, ignorados = 0
  const lado = (t: TimeChave | null, origem: string) =>
    t ? { nome: t.nome, emoji: t.emoji } : { nome: origem, emoji: PLACEHOLDER_EMOJI }

  for (let i = 0; i < rodadas.length; i++) {
    const fase = FASES[i]
    for (const jmm of rodadas[i]) {
      const numero = parseInt(jmm.id.slice(1), 10)
      const casa = lado(jmm.casa, jmm.origemCasa)
      const fora = lado(jmm.fora, jmm.origemFora)
      const existente = koPorNumero.get(numero)

      if (!existente) {
        const { error } = await supabase.from('jogos').insert({
          numero_jogo: numero,
          grupo: null,
          fase,
          time_casa: casa.nome, emoji_casa: casa.emoji,
          time_fora: fora.nome, emoji_fora: fora.emoji,
          data_jogo: FASE_DATA[fase],
          rodada: 1,
          encerrado: false,
        })
        if (!error) criados++
        continue
      }

      // Jogo já começou/encerrou: times e placar são definitivos — não toca.
      if (existente.encerrado || existente.gols_casa != null) { ignorados++; continue }

      // Atualiza só os times quando mudaram (placeholder -> real, etc.).
      if (existente.time_casa !== casa.nome || existente.time_fora !== fora.nome ||
          existente.emoji_casa !== casa.emoji || existente.emoji_fora !== fora.emoji ||
          (existente.fase ?? 'grupos') !== fase) {
        const { error } = await supabase.from('jogos').update({
          fase,
          time_casa: casa.nome, emoji_casa: casa.emoji,
          time_fora: fora.nome, emoji_fora: fora.emoji,
        }).eq('numero_jogo', numero)
        if (!error) atualizados++
      } else {
        ignorados++
      }
    }
  }

  return new Response(
    JSON.stringify({ status: 'ok', criados, atualizados, ignorados }),
    { headers: { ...CORS, 'Content-Type': 'application/json' } },
  )
})
