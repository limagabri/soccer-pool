import type { LinhaTabela } from './classificacao'

/** Força aproximada por ranking FIFA (0-100) para a simulação aleatória */
export const FORCA: Record<string, number> = {
  Argentina: 96,
  Espanha: 95,
  França: 94,
  Inglaterra: 93,
  Brasil: 92,
  Portugal: 91,
  Holanda: 90,
  Bélgica: 88,
  Alemanha: 88,
  Croácia: 86,
  Marrocos: 85,
  Uruguai: 85,
  Colômbia: 85,
  Japão: 84,
  'Estados Unidos': 82,
  México: 82,
  Suíça: 82,
  Senegal: 81,
  Noruega: 81,
  'Coreia do Sul': 80,
  Equador: 80,
  Áustria: 80,
  Turquia: 79,
  Canadá: 77,
  Austrália: 77,
  Egito: 76,
  Irã: 76,
  Argélia: 76,
  Suécia: 76,
  Escócia: 75,
  'Costa do Marfim': 75,
  Paraguai: 74,
  Tunísia: 74,
  'Rep. Tcheca': 74,
  Gana: 73,
  'Bósnia-Herzegóvina': 73,
  Catar: 70,
  'Arábia Saudita': 70,
  'África do Sul': 70,
  Panamá: 70,
  'RD Congo': 70,
  Uzbequistão: 69,
  Jordânia: 68,
  Iraque: 68,
  'Nova Zelândia': 66,
  'Cabo Verde': 66,
  Haiti: 62,
  Curaçao: 62,
}

function poisson(lambda: number): number {
  const limite = Math.exp(-lambda)
  let gols = 0
  let p = Math.random()
  while (p > limite && gols < 6) {
    gols++
    p *= Math.random()
  }
  return gols
}

export function simularPlacar(casa: string, fora: string) {
  const fc = FORCA[casa] ?? 70
  const ff = FORCA[fora] ?? 70
  const diff = (fc - ff) / 12
  return {
    gols_casa: poisson(Math.max(0.3, 1.35 + diff * 0.45)),
    gols_fora: poisson(Math.max(0.3, 1.15 - diff * 0.45)),
  }
}

/** Probabilidade de o time da casa vencer uma disputa de pênaltis */
export function probVitoria(casa: string, fora: string): number {
  const fc = FORCA[casa] ?? 70
  const ff = FORCA[fora] ?? 70
  return fc / (fc + ff)
}

// ── Chaveamento do mata-mata ────────────────────────────────────────

export type Seed =
  | { tipo: '1º' | '2º'; grupo: string }
  | { tipo: '3º'; indice: number }

/**
 * Rodada de 32 (simplificada): 8 cabeças de grupo enfrentam os 8
 * melhores 3ºs, os demais 1ºs e 2ºs se cruzam sem repetir grupo.
 */
export const CHAVE_32: [Seed, Seed][] = [
  [{ tipo: '1º', grupo: 'A' }, { tipo: '3º', indice: 7 }],
  [{ tipo: '2º', grupo: 'B' }, { tipo: '2º', grupo: 'C' }],
  [{ tipo: '1º', grupo: 'F' }, { tipo: '2º', grupo: 'L' }],
  [{ tipo: '1º', grupo: 'E' }, { tipo: '3º', indice: 4 }],
  [{ tipo: '1º', grupo: 'I' }, { tipo: '3º', indice: 2 }],
  [{ tipo: '2º', grupo: 'D' }, { tipo: '2º', grupo: 'G' }],
  [{ tipo: '1º', grupo: 'K' }, { tipo: '2º', grupo: 'J' }],
  [{ tipo: '1º', grupo: 'B' }, { tipo: '3º', indice: 6 }],
  [{ tipo: '1º', grupo: 'C' }, { tipo: '3º', indice: 5 }],
  [{ tipo: '2º', grupo: 'A' }, { tipo: '2º', grupo: 'F' }],
  [{ tipo: '1º', grupo: 'G' }, { tipo: '2º', grupo: 'H' }],
  [{ tipo: '1º', grupo: 'D' }, { tipo: '3º', indice: 3 }],
  [{ tipo: '1º', grupo: 'J' }, { tipo: '3º', indice: 1 }],
  [{ tipo: '2º', grupo: 'E' }, { tipo: '2º', grupo: 'I' }],
  [{ tipo: '1º', grupo: 'L' }, { tipo: '2º', grupo: 'K' }],
  [{ tipo: '1º', grupo: 'H' }, { tipo: '3º', indice: 0 }],
]

export const NOMES_RODADAS = [
  '32-avos de final',
  'Oitavas de final',
  'Quartas de final',
  'Semifinais',
  '3º lugar',
  'Final',
]

export interface TimeChave {
  nome: string
  emoji: string
}

export interface JogoMataMata {
  id: string
  rotulo: string
  casa: TimeChave | null
  fora: TimeChave | null
  origemCasa: string
  origemFora: string
}

export interface ResultadoMataMata {
  gols_casa: number | null
  gols_fora: number | null
  penaltis?: 'casa' | 'fora'
}

export type ResultadosMataMata = Record<string, ResultadoMataMata>

/**
 * A chave do resultado inclui os times: se a simulação dos grupos mudar
 * os classificados, os resultados antigos deixam de ser encontrados em
 * vez de vazarem para o confronto errado.
 */
export function chaveResultado(j: JogoMataMata): string {
  return `${j.id}|${j.casa?.nome ?? '?'}|${j.fora?.nome ?? '?'}`
}

export function vencedorMataMata(
  j: JogoMataMata,
  resultados: ResultadosMataMata
): TimeChave | null {
  if (!j.casa || !j.fora) return null
  const r = resultados[chaveResultado(j)]
  if (!r || r.gols_casa == null || r.gols_fora == null) return null
  if (r.gols_casa > r.gols_fora) return j.casa
  if (r.gols_casa < r.gols_fora) return j.fora
  if (r.penaltis === 'casa') return j.casa
  if (r.penaltis === 'fora') return j.fora
  return null
}

export function loserMataMata(
  j: JogoMataMata,
  resultados: ResultadosMataMata
): TimeChave | null {
  if (!j.casa || !j.fora) return null
  const r = resultados[chaveResultado(j)]
  if (!r || r.gols_casa == null || r.gols_fora == null) return null
  if (r.gols_casa > r.gols_fora) return j.fora
  if (r.gols_casa < r.gols_fora) return j.casa
  if (r.penaltis === 'casa') return j.fora
  if (r.penaltis === 'fora') return j.casa
  return null
}

function rotuloSeed(seed: Seed): string {
  if (seed.tipo === '3º') return `${seed.indice + 1}º melhor 3º`
  return `${seed.tipo} do Grupo ${seed.grupo}`
}

function paraTime(l: LinhaTabela): TimeChave {
  return { nome: l.time, emoji: l.emoji }
}

/**
 * Monta as 5 rodadas do mata-mata a partir das tabelas dos grupos.
 * Times indefinidos (grupo incompleto / jogo anterior sem resultado)
 * ficam null e o card mostra a origem ("1º do Grupo A", "Vencedor J73").
 */
export function montarChaveamento(
  tabelas: Record<string, LinhaTabela[]>,
  completos: Record<string, boolean>,
  terceiros: LinhaTabela[] | null,
  resultados: ResultadosMataMata
): JogoMataMata[][] {
  function resolve(seed: Seed): TimeChave | null {
    if (seed.tipo === '3º') {
      const t = terceiros?.[seed.indice]
      return t ? paraTime(t) : null
    }
    if (!completos[seed.grupo]) return null
    const t = tabelas[seed.grupo]?.[seed.tipo === '1º' ? 0 : 1]
    return t ? paraTime(t) : null
  }

  let numero = 73
  const r32: JogoMataMata[] = CHAVE_32.map(([s1, s2]) => {
    const j: JogoMataMata = {
      id: `J${numero}`,
      rotulo: `Jogo ${numero}`,
      casa: resolve(s1),
      fora: resolve(s2),
      origemCasa: rotuloSeed(s1),
      origemFora: rotuloSeed(s2),
    }
    numero++
    return j
  })

  const rodadas: JogoMataMata[][] = [r32]
  let atual = r32

  // Generate R16, QF, SF — stop when 2 games remain (the semi-finals)
  while (atual.length > 2) {
    const proxima: JogoMataMata[] = []
    for (let i = 0; i < atual.length; i += 2) {
      const a = atual[i]
      const b = atual[i + 1]
      proxima.push({
        id: `J${numero}`,
        rotulo: `Jogo ${numero}`,
        casa: vencedorMataMata(a, resultados),
        fora: vencedorMataMata(b, resultados),
        origemCasa: `Vencedor ${a.rotulo}`,
        origemFora: `Vencedor ${b.rotulo}`,
      })
      numero++
    }
    rodadas.push(proxima)
    atual = proxima
  }

  // atual is the SF round (2 games); add 3rd place and final as separate rounds
  const sf1 = atual[0]
  const sf2 = atual[1]

  rodadas.push([{
    id: `J${numero}`,
    rotulo: `Jogo ${numero}`,
    casa: loserMataMata(sf1, resultados),
    fora: loserMataMata(sf2, resultados),
    origemCasa: `Perdedor ${sf1.rotulo}`,
    origemFora: `Perdedor ${sf2.rotulo}`,
  }])
  numero++

  rodadas.push([{
    id: `J${numero}`,
    rotulo: 'Final',
    casa: vencedorMataMata(sf1, resultados),
    fora: vencedorMataMata(sf2, resultados),
    origemCasa: `Vencedor ${sf1.rotulo}`,
    origemFora: `Vencedor ${sf2.rotulo}`,
  }])

  return rodadas
}
