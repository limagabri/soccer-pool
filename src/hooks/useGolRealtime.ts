import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface GolEvento {
  id: string
  jogo_id: string
  tipo: 'gol' | 'gol_contra'
  jogador: string
  selecao: string
  minuto: number | null
}

export function useGolRealtime() {
  const [novoGol, setNovoGol] = useState<GolEvento | null>(null)
  const vistoRef = useRef(new Set<string>())

  useEffect(() => {
    const channel = supabase
      .channel('gol-realtime-global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'eventos_jogo' },
        (payload) => {
          const ev = payload.new as GolEvento & { tipo: string }
          if (ev.tipo !== 'gol' && ev.tipo !== 'gol_contra') return
          if (vistoRef.current.has(ev.id)) return
          vistoRef.current.add(ev.id)
          setNovoGol({ ...ev, tipo: ev.tipo as 'gol' | 'gol_contra' })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  function limparGol() { setNovoGol(null) }

  return { novoGol, limparGol }
}
