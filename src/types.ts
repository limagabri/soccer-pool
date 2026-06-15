export interface Jogo {
  id: string
  numero_jogo: number
  grupo: string
  time_casa: string
  time_fora: string
  emoji_casa: string
  emoji_fora: string
  data_jogo: string
  estadio: string | null
  cidade: string | null
  rodada: number
  gols_casa: number | null
  gols_fora: number | null
  encerrado: boolean
}

export interface Palpite {
  id: string
  user_id: string
  jogo_id: string
  gols_casa: number
  gols_fora: number
  pontos: number
  created_at: string
}
