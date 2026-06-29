// Lógica pura de classificação + chaveamento do mata-mata, portada para Deno.
//
// ⚠️ DUPLICAÇÃO INTENCIONAL: este arquivo espelha src/lib/classificacao.ts e
// src/lib/simulacao.ts (que o front usa via Vite e não dá pra importar aqui).
// Qualquer mudança em CHAVE_32, critérios de desempate ou montarChaveamento
// DEVE ser feita nos dois lugares. Mantido sem dependências de React/DB.

export interface JogoRow {
  id: string
  numero_jogo: number
  grupo: string | null
  time_casa: string
  time_fora: string
  emoji_casa: string
  emoji_fora: string
  gols_casa: number | null
  gols_fora: number | null
  encerrado: boolean
  fase?: string | null
  vencedor_penaltis?: string | null
}

export const GRUPOS = [...'ABCDEFGHIJKL']

// Ordem das 6 rodadas retornadas por montarChaveamento -> nome da fase em jogos.fase
export const FASES = ['r32', 'oitavas', 'quartas', 'semis', 'terceiro', 'final'] as const

export interface LinhaTabela {
  time: string
  emoji: string
  grupo: string
  j: number
  v: number
  e: number
  d: number
  gp: number
  gc: number
  sg: number
  pts: number
}

export interface PlacarSimulado {
  gols_casa: number | null
  gols_fora: number | null
}
export type Placares = Record<string, PlacarSimulado>

export function getPlacar(
  jogo: JogoRow,
  placares?: Placares,
): { casa: number; fora: number } | null {
  if (jogo.encerrado && jogo.gols_casa != null && jogo.gols_fora != null)
    return { casa: jogo.gols_casa, fora: jogo.gols_fora }
  const sim = placares?.[jogo.id]
  if (sim && sim.gols_casa != null && sim.gols_fora != null)
    return { casa: sim.gols_casa, fora: sim.gols_fora }
  return null
}

function novaLinha(time: string, emoji: string, grupo: string): LinhaTabela {
  return { time, emoji, grupo, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 }
}

function ordenarComDesempate(
  linhas: LinhaTabela[],
  jogosGrupo: JogoRow[],
  placares?: Placares,
): LinhaTabela[] {
  const porPontos = [...linhas].sort((a, b) => b.pts - a.pts)
  const resultado: LinhaTabela[] = []
  let i = 0
  while (i < porPontos.length) {
    const empatados = porPontos.filter((l) => l.pts === porPontos[i].pts)
    if (empatados.length === 1) {
      resultado.push(empatados[0]); i++; continue
    }
    const nomes = new Set(empatados.map((l) => l.time))
    const mini = new Map<string, { sg: number; gp: number }>()
    for (const nome of nomes) mini.set(nome, { sg: 0, gp: 0 })
    for (const j of jogosGrupo) {
      if (!nomes.has(j.time_casa) || !nomes.has(j.time_fora)) continue
      const p = getPlacar(j, placares)
      if (!p) continue
      const casa = mini.get(j.time_casa)!
      const fora = mini.get(j.time_fora)!
      casa.sg += p.casa - p.fora; casa.gp += p.casa
      fora.sg += p.fora - p.casa; fora.gp += p.fora
    }
    empatados.sort((a, b) => {
      const ma = mini.get(a.time)!
      const mb = mini.get(b.time)!
      return mb.sg - ma.sg || mb.gp - ma.gp || b.sg - a.sg || b.gp - a.gp || a.time.localeCompare(b.time)
    })
    resultado.push(...empatados)
    i += empatados.length
  }
  return resultado
}

export function calcularTabela(jogosGrupo: JogoRow[], placares?: Placares): LinhaTabela[] {
  const linhas = new Map<string, LinhaTabela>()
  for (const j of jogosGrupo) {
    if (!linhas.has(j.time_casa)) linhas.set(j.time_casa, novaLinha(j.time_casa, j.emoji_casa, j.grupo ?? ''))
    if (!linhas.has(j.time_fora)) linhas.set(j.time_fora, novaLinha(j.time_fora, j.emoji_fora, j.grupo ?? ''))
  }
  for (const j of jogosGrupo) {
    const p = getPlacar(j, placares)
    if (!p) continue
    const casa = linhas.get(j.time_casa)!
    const fora = linhas.get(j.time_fora)!
    casa.j++; fora.j++
    casa.gp += p.casa; casa.gc += p.fora
    fora.gp += p.fora; fora.gc += p.casa
    if (p.casa > p.fora) { casa.v++; fora.d++; casa.pts += 3 }
    else if (p.casa < p.fora) { fora.v++; casa.d++; fora.pts += 3 }
    else { casa.e++; fora.e++; casa.pts++; fora.pts++ }
  }
  for (const l of linhas.values()) l.sg = l.gp - l.gc
  return ordenarComDesempate([...linhas.values()], jogosGrupo, placares)
}

export function calcularTodasTabelas(jogos: JogoRow[], placares?: Placares): Record<string, LinhaTabela[]> {
  const porGrupo: Record<string, JogoRow[]> = {}
  for (const j of jogos) {
    if (!j.grupo) continue
    ;(porGrupo[j.grupo] ??= []).push(j)
  }
  const tabelas: Record<string, LinhaTabela[]> = {}
  for (const [g, js] of Object.entries(porGrupo)) tabelas[g] = calcularTabela(js, placares)
  return tabelas
}

export function gruposCompletos(jogos: JogoRow[], placares?: Placares): Record<string, boolean> {
  const map: Record<string, boolean> = {}
  for (const j of jogos) {
    if (!j.grupo) continue
    const ok = getPlacar(j, placares) != null
    map[j.grupo] = (map[j.grupo] ?? true) && ok
  }
  return map
}

export function melhoresTerceiros(tabelas: Record<string, LinhaTabela[]>): LinhaTabela[] {
  return Object.values(tabelas)
    .map((t) => t[2])
    .filter(Boolean)
    .sort((a, b) => b.pts - a.pts || b.sg - a.sg || b.gp - a.gp || a.time.localeCompare(b.time))
    .slice(0, 8)
}

// ── Chaveamento (FIFA World Cup 2026 — art. 12.6 + Annex C) ───────
import { ANNEX_C_LOOKUP, type AnnexCSlot } from './annex-c.ts'

export type Seed =
  | { tipo: '1º' | '2º'; grupo: string }
  | { tipo: '3º'; slot: AnnexCSlot }

/** J73–J88 na ordem do regulamento FIFA (M73–M88). */
export const CHAVE_32: [Seed, Seed][] = [
  [{ tipo: '2º', grupo: 'A' }, { tipo: '2º', grupo: 'B' }],       // M73
  [{ tipo: '1º', grupo: 'E' }, { tipo: '3º', slot: 'E' }],        // M74
  [{ tipo: '1º', grupo: 'F' }, { tipo: '2º', grupo: 'C' }],       // M75
  [{ tipo: '1º', grupo: 'C' }, { tipo: '2º', grupo: 'F' }],       // M76
  [{ tipo: '1º', grupo: 'I' }, { tipo: '3º', slot: 'I' }],        // M77
  [{ tipo: '2º', grupo: 'E' }, { tipo: '2º', grupo: 'I' }],       // M78
  [{ tipo: '1º', grupo: 'A' }, { tipo: '3º', slot: 'A' }],        // M79
  [{ tipo: '1º', grupo: 'L' }, { tipo: '3º', slot: 'L' }],        // M80
  [{ tipo: '1º', grupo: 'D' }, { tipo: '3º', slot: 'D' }],        // M81
  [{ tipo: '1º', grupo: 'G' }, { tipo: '3º', slot: 'G' }],        // M82
  [{ tipo: '2º', grupo: 'K' }, { tipo: '2º', grupo: 'L' }],       // M83
  [{ tipo: '1º', grupo: 'H' }, { tipo: '2º', grupo: 'J' }],       // M84
  [{ tipo: '1º', grupo: 'B' }, { tipo: '3º', slot: 'B' }],        // M85
  [{ tipo: '1º', grupo: 'J' }, { tipo: '2º', grupo: 'H' }],       // M86
  [{ tipo: '1º', grupo: 'K' }, { tipo: '3º', slot: 'K' }],        // M87
  [{ tipo: '2º', grupo: 'D' }, { tipo: '2º', grupo: 'G' }],       // M88
]

function chaveAnexC(terceiros: LinhaTabela[]): Record<AnnexCSlot, string> | null {
  const key = [...new Set(terceiros.map((t) => t.grupo))].sort().join('')
  return ANNEX_C_LOOKUP[key] ?? null
}

export interface TimeChave { nome: string; emoji: string }

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

export function chaveResultado(j: JogoMataMata): string {
  return `${j.id}|${j.casa?.nome ?? '?'}|${j.fora?.nome ?? '?'}`
}

export function vencedorMataMata(j: JogoMataMata, resultados: ResultadosMataMata): TimeChave | null {
  if (!j.casa || !j.fora) return null
  const r = resultados[chaveResultado(j)]
  if (!r || r.gols_casa == null || r.gols_fora == null) return null
  if (r.gols_casa > r.gols_fora) return j.casa
  if (r.gols_casa < r.gols_fora) return j.fora
  if (r.penaltis === 'casa') return j.casa
  if (r.penaltis === 'fora') return j.fora
  return null
}

export function loserMataMata(j: JogoMataMata, resultados: ResultadosMataMata): TimeChave | null {
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
  if (seed.tipo === '3º') return `Melhor 3º vs 1º do Grupo ${seed.slot}`
  return `${seed.tipo} do Grupo ${seed.grupo}`
}

function paraTime(l: LinhaTabela): TimeChave {
  return { nome: l.time, emoji: l.emoji }
}

export function montarChaveamento(
  tabelas: Record<string, LinhaTabela[]>,
  completos: Record<string, boolean>,
  terceiros: LinhaTabela[] | null,
  resultados: ResultadosMataMata,
): JogoMataMata[][] {
  function resolve(seed: Seed): TimeChave | null {
    if (seed.tipo === '3º') {
      if (!terceiros || terceiros.length < 8) return null
      const mapa = chaveAnexC(terceiros)
      if (!mapa) return null
      const grupo = mapa[seed.slot]
      if (!completos[grupo]) return null
      const t = tabelas[grupo]?.[2]
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
