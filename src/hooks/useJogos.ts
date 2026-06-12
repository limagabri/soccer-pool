import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Jogo } from '../types'

/**
 * Busca os jogos e mantém em dia via Supabase Realtime — quando o admin
 * atualiza um resultado no Table Editor, todos os clientes recarregam.
 */
export function useJogos() {
  const [jogos, setJogos] = useState<Jogo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    const { data, error } = await supabase
      .from('jogos')
      .select('*')
      .order('numero_jogo')
    if (error) {
      setError(error.message)
    } else {
      setJogos((data as Jogo[]) ?? [])
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()

    const channel = supabase
      .channel('jogos-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jogos' },
        () => refetch()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refetch])

  return { jogos, loading, error, refetch }
}
