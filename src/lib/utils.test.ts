import { describe, it, expect } from 'vitest'
import { calcularPontos } from './utils'

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
