/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Jogo } from '../types'

interface JogosCtx {
  jogos: Jogo[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const JogosContext = createContext<JogosCtx | null>(null)

export function JogosProvider({ children }: { children: ReactNode }) {
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jogos' }, () => refetch())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [refetch])

  return (
    <JogosContext.Provider value={{ jogos, loading, error, refetch }}>
      {children}
    </JogosContext.Provider>
  )
}

export function useJogos() {
  const ctx = useContext(JogosContext)
  if (!ctx) throw new Error('useJogos precisa estar dentro de JogosProvider')
  return ctx
}
