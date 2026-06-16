export function formatarData(iso: string): string {
  const d = new Date(iso)
  const data = d.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
  const hora = d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
  return `${data} · ${hora}`
}

import { SCORING } from '../config/torneio'

/** Placar exato = 10 pts · vencedor/empate correto = 5 pts · errado = 0 (grupos) */
export function calcularPontos(
  palpiteCasa: number,
  palpiteFora: number,
  golsCasa: number,
  golsFora: number
): number {
  if (palpiteCasa === golsCasa && palpiteFora === golsFora) return SCORING.exactScore
  if (Math.sign(palpiteCasa - palpiteFora) === Math.sign(golsCasa - golsFora))
    return SCORING.correctWinner
  return 0
}

/**
 * Pontuação phase-aware (DEVE bater com a trigger em
 * supabase/migrations/017_mata_mata.sql):
 * - grupos: 10 exato / 5 resultado
 * - mata-mata: 15 exato / 10 resultado, +5 se acertar quem avança nos pênaltis
 *   (jogo real empatado e `avanca` == `vencedor_penaltis`).
 */
export function calcularPontosJogo(
  palpite: { gols_casa: number; gols_fora: number; avanca?: string | null },
  jogo: { fase?: string | null; gols_casa: number | null; gols_fora: number | null; vencedor_penaltis?: string | null }
): number {
  if (jogo.gols_casa == null || jogo.gols_fora == null) return 0
  const knockout = (jogo.fase ?? 'grupos') !== 'grupos'
  const exato = palpite.gols_casa === jogo.gols_casa && palpite.gols_fora === jogo.gols_fora
  const resultado = Math.sign(palpite.gols_casa - palpite.gols_fora) === Math.sign(jogo.gols_casa - jogo.gols_fora)

  let pts = exato
    ? (knockout ? SCORING.knockoutExact : SCORING.exactScore)
    : resultado
      ? (knockout ? SCORING.knockoutResult : SCORING.correctWinner)
      : 0

  if (
    knockout &&
    jogo.gols_casa === jogo.gols_fora &&
    jogo.vencedor_penaltis &&
    palpite.avanca === jogo.vencedor_penaltis
  ) {
    pts += SCORING.advancerBonus
  }
  return pts
}

/** true quando o palpite acertou o placar exato (qualquer fase). */
export function acertouPlacarExato(
  pCasa: number, pFora: number, gCasa: number, gFora: number
): boolean {
  return pCasa === gCasa && pFora === gFora
}

export function jogoComecou(dataJogo: string): boolean {
  return Date.now() >= new Date(dataJogo).getTime()
}
