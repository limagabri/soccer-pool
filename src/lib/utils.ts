export function formatarData(iso: string): string {
  const d = new Date(iso)
  const data = d.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  })
  const hora = d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${data} · ${hora}`
}

/** Placar exato = 10 pts · vencedor/empate correto = 5 pts · errado = 0 */
export function calcularPontos(
  palpiteCasa: number,
  palpiteFora: number,
  golsCasa: number,
  golsFora: number
): number {
  if (palpiteCasa === golsCasa && palpiteFora === golsFora) return 10
  if (Math.sign(palpiteCasa - palpiteFora) === Math.sign(golsCasa - golsFora))
    return 5
  return 0
}

export function jogoComecou(dataJogo: string): boolean {
  return Date.now() >= new Date(dataJogo).getTime()
}
