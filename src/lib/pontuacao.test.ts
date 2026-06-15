import { describe, it, expect } from 'vitest'
import { agregarEstatisticas, type PalpiteResumo } from './pontuacao'
import type { Jogo } from '../types'

// Mock mínimo de Jogo (só os campos que agregarEstatisticas usa).
function jogo(id: string, gc: number | null, gf: number | null, encerrado: boolean): Jogo {
  return { id, gols_casa: gc, gols_fora: gf, encerrado } as unknown as Jogo
}

describe('agregarEstatisticas', () => {
  const jogos = [
    jogo('j1', 2, 1, true),   // encerrado
    jogo('j2', 0, 0, true),   // encerrado
    jogo('j3', null, null, false), // não encerrado → conta palpite, não pontua
  ]

  const palpites: PalpiteResumo[] = [
    { user_id: 'u1', jogo_id: 'j1', gols_casa: 2, gols_fora: 1 }, // exato → 10
    { user_id: 'u1', jogo_id: 'j2', gols_casa: 1, gols_fora: 1 }, // acerta empate → 5
    { user_id: 'u1', jogo_id: 'j3', gols_casa: 3, gols_fora: 0 }, // pendente → 0 pts
    { user_id: 'u2', jogo_id: 'j1', gols_casa: 0, gols_fora: 3 }, // erra → 0
  ]

  it('soma pontos e classifica exatos/vencedor', () => {
    const stats = agregarEstatisticas(palpites, jogos)
    const u1 = stats.get('u1')!
    expect(u1.palpites).toBe(3)
    expect(u1.pontos).toBe(15)
    expect(u1.exatos).toBe(1)
    expect(u1.vencedor).toBe(1)

    const u2 = stats.get('u2')!
    expect(u2.pontos).toBe(0)
    expect(u2.palpites).toBe(1)
  })

  it('jogos não encerrados não pontuam mas contam como palpite', () => {
    const stats = agregarEstatisticas(
      [{ user_id: 'x', jogo_id: 'j3', gols_casa: 1, gols_fora: 0 }],
      jogos
    )
    expect(stats.get('x')!.pontos).toBe(0)
    expect(stats.get('x')!.palpites).toBe(1)
  })
})
