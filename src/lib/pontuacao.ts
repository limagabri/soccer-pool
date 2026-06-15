import { supabase } from './supabase'
import { calcularPontos } from './utils'
import type { Jogo } from '../types'

export interface PalpiteResumo {
  user_id: string
  jogo_id: string
  gols_casa: number
  gols_fora: number
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
    const pts = calcularPontos(p.gols_casa, p.gols_fora, jogo.gols_casa!, jogo.gols_fora!)
    s.pontos += pts
    if (pts === 10) s.exatos++
    else if (pts === 5) s.vencedor++
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
    .select('id, gols_casa, gols_fora, pontos')
    .eq('jogo_id', jogoId)
  if (!palpites) return

  await Promise.all(
    palpites.map((p) => {
      const pontos = calcularPontos(p.gols_casa, p.gols_fora, j.gols_casa!, j.gols_fora!)
      if (pontos === p.pontos) return Promise.resolve(null)
      return supabase.from('palpites').update({ pontos }).eq('id', p.id)
    })
  )
}
