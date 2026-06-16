export type Fase = 'grupos' | 'r32' | 'oitavas' | 'quartas' | 'semis' | 'terceiro' | 'final'

export interface Jogo {
  id: string
  numero_jogo: number
  grupo: string | null
  time_casa: string
  time_fora: string
  emoji_casa: string
  emoji_fora: string
  data_jogo: string
  estadio: string | null
  cidade: string | null
  rodada: number
  fase: Fase
  gols_casa: number | null
  gols_fora: number | null
  vencedor_penaltis: string | null
  encerrado: boolean
}

export interface Palpite {
  id: string
  user_id: string
  jogo_id: string
  gols_casa: number
  gols_fora: number
  avanca: string | null
  pontos: number
  created_at: string
}
