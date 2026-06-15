import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface EntradaHistorico {
  user_id: string
  posicao: number
  pontos_total: number
  data: string
}

export function useRankingHistorico() {
  const [historico, setHistorico] = useState<EntradaHistorico[]>([])

  const carregar = useCallback(async () => {
    const { data } = await supabase
      .from('ranking_historico')
      .select('user_id, posicao, pontos_total, data')
      .order('data')
    setHistorico((data as EntradaHistorico[]) ?? [])
  }, [])

  const salvarSnapshot = useCallback(
    async (linhas: { user_id: string; posicao: number; total: number }[]) => {
      if (linhas.length === 0) return
      const hoje = new Date().toISOString().split('T')[0]
      const rows = linhas.map((l) => ({
        user_id: l.user_id,
        posicao: l.posicao,
        pontos_total: l.total,
        data: hoje,
      }))
      await supabase
        .from('ranking_historico')
        .upsert(rows, { onConflict: 'user_id,data' })
      await carregar()
    },
    [carregar]
  )

  return { historico, carregar, salvarSnapshot }
}
