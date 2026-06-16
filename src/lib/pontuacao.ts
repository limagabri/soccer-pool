import { supabase } from './supabase'
import { calcularPontosJogo } from './utils'
import type { Jogo } from '../types'

export interface PalpiteResumo {
  user_id: string
  jogo_id: string
  gols_casa: number
  gols_fora: number
  avanca?: string | null
}

export interface EstatisticasUsuario {
  user_id: string
  pontos: number
  palpites: number
  exatos: number
  vencedor: number
}

/**
 * Agrega pontos/acertos por usuário calculando palpite × resultado no
 * cliente — não depende da coluna palpites.pontos estar em dia.
 */
export function agregarEstatisticas(
  palpites: PalpiteResumo[],
  jogos: Jogo[]
): Map<string, EstatisticasUsuario> {
  const encerrados = new Map(
    jogos
      .filter((j) => j.encerrado && j.gols_casa != null && j.gols_fora != null)
      .map((j) => [j.id, j])
  )

  const stats = new Map<string, EstatisticasUsuario>()
  for (const p of palpites) {
    let s = stats.get(p.user_id)
    if (!s) {
      s = { user_id: p.user_id, pontos: 0, palpites: 0, exatos: 0, vencedor: 0 }
      stats.set(p.user_id, s)
    }
    s.palpites++

    const jogo = encerrados.get(p.jogo_id)
    if (!jogo) continue
    const pts = calcularPontosJogo(
      { gols_casa: p.gols_casa, gols_fora: p.gols_fora, avanca: p.avanca },
      jogo
    )
    s.pontos += pts
    const exato = p.gols_casa === jogo.gols_casa && p.gols_fora === jogo.gols_fora
    const resultado = Math.sign(p.gols_casa - p.gols_fora) === Math.sign(jogo.gols_casa! - jogo.gols_fora!)
    if (exato) s.exatos++
    else if (resultado) s.vencedor++
  }

  return stats
}

/**
 * Recalcula e persiste palpites.pontos de um jogo encerrado.
 *
 * Atenção: a RLS só permite UPDATE nos palpites do próprio usuário, então
 * cada cliente logado grava apenas os seus — os demais são ignorados em
 * silêncio. A UI nunca depende disso (usa agregarEstatisticas), a coluna
 * é só um cache para consultas diretas no banco.
 */
export async function recalcularPontosJogo(jogoId: string): Promise<void> {
  const { data: jogo } = await supabase
    .from('jogos')
    .select('*')
    .eq('id', jogoId)
    .single()

  const j = jogo as Jogo | null
  if (!j?.encerrado || j.gols_casa == null || j.gols_fora == null) return

  const { data: palpites } = await supabase
    .from('palpites')
    .select('id, gols_casa, gols_fora, pontos, avanca')
    .eq('jogo_id', jogoId)
  if (!palpites) return

  await Promise.all(
    palpites.map((p) => {
      const pontos = calcularPontosJogo(
        { gols_casa: p.gols_casa, gols_fora: p.gols_fora, avanca: p.avanca },
        j
      )
      if (pontos === p.pontos) return Promise.resolve(null)
      return supabase.from('palpites').update({ pontos }).eq('id', p.id)
    })
  )
}
