import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { recalcularPontosJogo } from '../lib/pontuacao'
import type { Jogo } from '../types'

/**
 * Watcher global: quando o admin encerra um jogo no Supabase
 * (encerrado=true com placar), recalcula os pontos dos palpites.
 * Inicializado uma única vez no App.
 */
export function usePontuacao() {
  useEffect(() => {
    const channel = supabase
      .channel('pontuacao-watcher')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'jogos' },
        (payload) => {
          const jogo = payload.new as Jogo
          if (jogo.encerrado && jogo.gols_casa != null && jogo.gols_fora != null) {
            recalcularPontosJogo(jogo.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
}
