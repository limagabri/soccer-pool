import { describe, it, expect } from 'vitest'
import { calcularPontos, calcularPontosJogo } from './utils'

describe('calcularPontos', () => {
  it('dá 10 no placar exato', () => {
    expect(calcularPontos(2, 1, 2, 1)).toBe(10)
    expect(calcularPontos(0, 0, 0, 0)).toBe(10)
  })

  it('dá 5 ao acertar o vencedor (sem placar exato)', () => {
    expect(calcularPontos(3, 0, 2, 1)).toBe(5) // casa vence
    expect(calcularPontos(0, 2, 1, 3)).toBe(5) // fora vence
  })

  it('dá 5 ao acertar o empate (placar diferente)', () => {
    expect(calcularPontos(1, 1, 2, 2)).toBe(5)
  })

  it('dá 0 ao errar o resultado', () => {
    expect(calcularPontos(2, 0, 0, 1)).toBe(0) // apostou casa, deu fora
    expect(calcularPontos(1, 1, 2, 0)).toBe(0) // apostou empate, deu vitória
  })
})

describe('calcularPontosJogo (phase-aware)', () => {
  const grupo = (gc: number, gf: number) => ({ fase: 'grupos' as const, gols_casa: gc, gols_fora: gf })
  const ko = (gc: number, gf: number, venc?: string) => ({ fase: 'oitavas' as const, gols_casa: gc, gols_fora: gf, vencedor_penaltis: venc })

  it('grupos: 10 exato / 5 resultado / 0 erro', () => {
    expect(calcularPontosJogo({ gols_casa: 2, gols_fora: 1 }, grupo(2, 1))).toBe(10)
    expect(calcularPontosJogo({ gols_casa: 3, gols_fora: 1 }, grupo(2, 1))).toBe(5)
    expect(calcularPontosJogo({ gols_casa: 0, gols_fora: 1 }, grupo(2, 1))).toBe(0)
  })

  it('mata-mata: 15 exato / 10 resultado', () => {
    expect(calcularPontosJogo({ gols_casa: 2, gols_fora: 1 }, ko(2, 1))).toBe(15)
    expect(calcularPontosJogo({ gols_casa: 3, gols_fora: 1 }, ko(2, 1))).toBe(10)
    expect(calcularPontosJogo({ gols_casa: 0, gols_fora: 1 }, ko(2, 1))).toBe(0)
  })

  it('mata-mata empate: +5 ao acertar quem avança', () => {
    // jogo real 1x1, avançou o "Brasil" nos pênaltis
    // palpite empate exato + avança certo = 15 + 5
    expect(calcularPontosJogo({ gols_casa: 1, gols_fora: 1, avanca: 'Brasil' }, ko(1, 1, 'Brasil'))).toBe(20)
    // palpite empate (placar diferente) + avança certo = 10 + 5
    expect(calcularPontosJogo({ gols_casa: 0, gols_fora: 0, avanca: 'Brasil' }, ko(1, 1, 'Brasil'))).toBe(15)
    // avança errado = sem bônus
    expect(calcularPontosJogo({ gols_casa: 1, gols_fora: 1, avanca: 'Croácia' }, ko(1, 1, 'Brasil'))).toBe(15)
    // não escolheu quem avança = sem bônus
    expect(calcularPontosJogo({ gols_casa: 1, gols_fora: 1 }, ko(1, 1, 'Brasil'))).toBe(15)
  })
})
