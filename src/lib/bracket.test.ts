import { describe, expect, it } from 'vitest'
import type { LinhaTabela } from './classificacao'
import { montarChaveamento, type JogoMataMata } from './simulacao'

function linha(time: string, grupo: string, pts: number): LinhaTabela {
  return { time, emoji: '⚽', grupo, j: 3, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts }
}

/** Classificação real da fase de grupos (Copa 2026, jun/2026). */
function tabelasReais(): Record<string, LinhaTabela[]> {
  const mk = (grupo: string, primeiro: string, segundo: string, terceiro: string) => [
    linha(primeiro, grupo, 7),
    linha(segundo, grupo, 4),
    linha(terceiro, grupo, 4),
    linha(`4º ${grupo}`, grupo, 0),
  ]
  return {
    A: mk('A', 'México', 'África do Sul', 'Coreia do Sul'),
    B: mk('B', 'Suíça', 'Canadá', 'Bósnia-Herzegóvina'),
    C: mk('C', 'Brasil', 'Marrocos', 'Escócia'),
    D: mk('D', 'Estados Unidos', 'Austrália', 'Paraguai'),
    E: mk('E', 'Alemanha', 'Costa do Marfim', 'Equador'),
    F: mk('F', 'Holanda', 'Japão', 'Suécia'),
    G: mk('G', 'Bélgica', 'Egito', 'Irã'),
    H: mk('H', 'Espanha', 'Cabo Verde', 'Uruguai'),
    I: mk('I', 'França', 'Noruega', 'Senegal'),
    J: mk('J', 'Argentina', 'Áustria', 'Argélia'),
    K: mk('K', 'Colômbia', 'Portugal', 'RD Congo'),
    L: mk('L', 'Inglaterra', 'Croácia', 'Gana'),
  }
}

describe('montarChaveamento — 32-avos FIFA 2026', () => {
  it('gera os 16 confrontos reais da rodada de 32', () => {
    const tabelas = tabelasReais()
    const completos = Object.fromEntries(Object.keys(tabelas).map((g) => [g, true]))
    const terceiros = [
      tabelas.E[2], tabelas.K[2], tabelas.F[2], tabelas.L[2],
      tabelas.B[2], tabelas.D[2], tabelas.J[2], tabelas.I[2],
    ]
    const [r32] = montarChaveamento(tabelas, completos, terceiros, {})

    const confrontos = r32.map((j: JogoMataMata) =>
      `${j.casa?.nome ?? '?'} vs ${j.fora?.nome ?? '?'}`
    )

    expect(confrontos).toEqual([
      'África do Sul vs Canadá',
      'Alemanha vs Paraguai',
      'Holanda vs Marrocos',
      'Brasil vs Japão',
      'França vs Suécia',
      'Costa do Marfim vs Noruega',
      'México vs Equador',
      'Inglaterra vs RD Congo',
      'Estados Unidos vs Bósnia-Herzegóvina',
      'Bélgica vs Senegal',
      'Portugal vs Croácia',
      'Espanha vs Áustria',
      'Suíça vs Argélia',
      'Argentina vs Cabo Verde',
      'Colômbia vs Gana',
      'Austrália vs Egito',
    ])
  })
})
