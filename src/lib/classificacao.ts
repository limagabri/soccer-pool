// ⚠️ calcularTabela/calcularTodasTabelas/gruposCompletos/melhoresTerceiros e os
// critérios de desempate são duplicados em supabase/functions/_shared/bracket.ts
// (edge function gerar-mata-mata). Mudou aqui? Mude lá também.
import type { Jogo } from '../types'

export const GRUPOS = [...'ABCDEFGHIJKL']

export interface PlacarSimulado {
  gols_casa: number | null
  gols_fora: number | null
}

/** Placares simulados/extra, indexados por jogo.id */
export type Placares = Record<string, PlacarSimulado>

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

/** Resultado real (jogo encerrado) ou simulado; null se indefinido */
export function getPlacar(
  jogo: Jogo,
  placares?: Placares
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

/**
 * Critérios de desempate FIFA 2026:
 * 1) pontos  2) SG no confronto direto  3) gols no confronto direto
 * 4) SG geral  5) gols marcados geral  6) fair play (sem dados de
 * cartões — usamos ordem alfabética como critério estável final)
 */
function ordenarComDesempate(
  linhas: LinhaTabela[],
  jogosGrupo: Jogo[],
  placares?: Placares
): LinhaTabela[] {
  const porPontos = [...linhas].sort((a, b) => b.pts - a.pts)
  const resultado: LinhaTabela[] = []
  let i = 0

  while (i < porPontos.length) {
    const empatados = porPontos.filter((l) => l.pts === porPontos[i].pts)
    if (empatados.length === 1) {
      resultado.push(empatados[0])
      i++
      continue
    }

    // Mini-tabela apenas com os confrontos diretos entre os empatados
    const nomes = new Set(empatados.map((l) => l.time))
    const mini = new Map<string, { sg: number; gp: number }>()
    for (const nome of nomes) mini.set(nome, { sg: 0, gp: 0 })
    for (const j of jogosGrupo) {
      if (!nomes.has(j.time_casa) || !nomes.has(j.time_fora)) continue
      const p = getPlacar(j, placares)
      if (!p) continue
      const casa = mini.get(j.time_casa)!
      const fora = mini.get(j.time_fora)!
      casa.sg += p.casa - p.fora
      casa.gp += p.casa
      fora.sg += p.fora - p.casa
      fora.gp += p.fora
    }

    empatados.sort((a, b) => {
      const ma = mini.get(a.time)!
      const mb = mini.get(b.time)!
      return (
        mb.sg - ma.sg ||
        mb.gp - ma.gp ||
        b.sg - a.sg ||
        b.gp - a.gp ||
        a.time.localeCompare(b.time)
      )
    })

    resultado.push(...empatados)
    i += empatados.length
  }

  return resultado
}

export function calcularTabela(
  jogosGrupo: Jogo[],
  placares?: Placares
): LinhaTabela[] {
  const linhas = new Map<string, LinhaTabela>()
  for (const j of jogosGrupo) {
    if (!linhas.has(j.time_casa))
      linhas.set(j.time_casa, novaLinha(j.time_casa, j.emoji_casa, j.grupo ?? ''))
    if (!linhas.has(j.time_fora))
      linhas.set(j.time_fora, novaLinha(j.time_fora, j.emoji_fora, j.grupo ?? ''))
  }

  for (const j of jogosGrupo) {
    const p = getPlacar(j, placares)
    if (!p) continue
    const casa = linhas.get(j.time_casa)!
    const fora = linhas.get(j.time_fora)!
    casa.j++
    fora.j++
    casa.gp += p.casa
    casa.gc += p.fora
    fora.gp += p.fora
    fora.gc += p.casa
    if (p.casa > p.fora) {
      casa.v++
      fora.d++
      casa.pts += 3
    } else if (p.casa < p.fora) {
      fora.v++
      casa.d++
      fora.pts += 3
    } else {
      casa.e++
      fora.e++
      casa.pts++
      fora.pts++
    }
  }

  for (const l of linhas.values()) l.sg = l.gp - l.gc
  return ordenarComDesempate([...linhas.values()], jogosGrupo, placares)
}

export function calcularTodasTabelas(
  jogos: Jogo[],
  placares?: Placares
): Record<string, LinhaTabela[]> {
  const porGrupo: Record<string, Jogo[]> = {}
  for (const j of jogos) {
    if (!j.grupo) continue
    ;(porGrupo[j.grupo] ??= []).push(j)
  }
  const tabelas: Record<string, LinhaTabela[]> = {}
  for (const [g, js] of Object.entries(porGrupo))
    tabelas[g] = calcularTabela(js, placares)
  return tabelas
}

/** true para cada grupo cujos 6 jogos têm placar (real ou simulado) */
export function gruposCompletos(
  jogos: Jogo[],
  placares?: Placares
): Record<string, boolean> {
  const map: Record<string, boolean> = {}
  for (const j of jogos) {
    if (!j.grupo) continue
    const ok = getPlacar(j, placares) != null
    map[j.grupo] = (map[j.grupo] ?? true) && ok
  }
  return map
}

/** Os 8 melhores 3ºs colocados (pts, SG, GP, nome) — comparação entre grupos */
export function melhoresTerceiros(
  tabelas: Record<string, LinhaTabela[]>
): LinhaTabela[] {
  return Object.values(tabelas)
    .map((t) => t[2])
    .filter(Boolean)
    .sort(
      (a, b) =>
        b.pts - a.pts ||
        b.sg - a.sg ||
        b.gp - a.gp ||
        a.time.localeCompare(b.time)
    )
    .slice(0, 8)
}
