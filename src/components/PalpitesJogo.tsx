import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { calcularPontos } from '../lib/utils'
import type { Jogo } from '../types'

interface Props {
  jogo: Jogo
}

interface PalpiteLinha {
  user_id: string
  username: string
  gols_casa: number
  gols_fora: number
  pontos: number | null
}

// Mostra os palpites de todos os participantes para um jogo. Só deve ser
// renderizado depois que o jogo começou — antes disso seria injusto revelar.
export function PalpitesJogo({ jogo }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [linhas, setLinhas] = useState<PalpiteLinha[]>([])
  const [loading, setLoading] = useState(true)

  const encerrado = jogo.encerrado && jogo.gols_casa != null && jogo.gols_fora != null

  useEffect(() => {
    let ativo = true
    async function carregar() {
      // palpites.user_id referencia auth.users (não profiles), então não dá
      // pra embutir profiles(...) — buscamos os nomes numa segunda query.
      const { data } = await supabase
        .from('palpites')
        .select('user_id, gols_casa, gols_fora')
        .eq('jogo_id', jogo.id)

      if (!ativo) return
      const palp = (data as { user_id: string; gols_casa: number; gols_fora: number }[]) ?? []

      const userIds = [...new Set(palp.map((p) => p.user_id))]
      const perfis: Record<string, { username: string; is_admin: boolean }> = {}
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, is_admin')
          .in('id', userIds)
        for (const p of (profiles as { id: string; username: string; is_admin: boolean }[]) ?? [])
          perfis[p.id] = { username: p.username, is_admin: p.is_admin }
      }
      if (!ativo) return

      const rows = palp
        .filter((p) => !perfis[p.user_id]?.is_admin)
        .map((p) => ({
          user_id: p.user_id,
          username: perfis[p.user_id]?.username ?? 'Anônimo',
          gols_casa: p.gols_casa,
          gols_fora: p.gols_fora,
          pontos: encerrado
            ? calcularPontos(p.gols_casa, p.gols_fora, jogo.gols_casa!, jogo.gols_fora!)
            : null,
        }))
      setLinhas(rows)
      setLoading(false)
    }
    carregar()
    return () => {
      ativo = false
    }
  }, [jogo.id, encerrado, jogo.gols_casa, jogo.gols_fora])

  const ordenadas = useMemo(() => {
    const arr = [...linhas]
    arr.sort((a, b) => {
      if (encerrado) return (b.pontos ?? 0) - (a.pontos ?? 0) || a.username.localeCompare(b.username)
      // Antes do resultado: eu primeiro, depois ordem alfabética.
      if (a.user_id === user?.id) return -1
      if (b.user_id === user?.id) return 1
      return a.username.localeCompare(b.username)
    })
    return arr
  }, [linhas, encerrado, user?.id])

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
      </div>
    )
  }

  if (ordenadas.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-zinc-600">
        {t('matchPicks.empty')}
      </p>
    )
  }

  return (
    <div className="space-y-1.5">
      <p className="mb-2 text-xs text-zinc-500">
        {t('matchPicks.count', { count: ordenadas.length })} ·{' '}
        {encerrado ? t('matchPicks.byPoints') : t('matchPicks.revealed')}
      </p>
      {ordenadas.map((l, i) => {
        const sou = l.user_id === user?.id
        const cor =
          l.pontos === 10
            ? 'text-brasil-green'
            : l.pontos === 5
              ? 'text-brasil-yellow'
              : encerrado
                ? 'text-zinc-500'
                : 'text-zinc-200'
        return (
          <motion.div
            key={l.user_id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
            className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 ${
              sou ? 'bg-brasil-green/10' : ''
            }`}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brasil-green to-brasil-yellow text-[10px] font-bold text-black">
              {l.username.slice(0, 2).toUpperCase()}
            </div>
            <span className="flex-1 truncate text-sm text-zinc-300">
              {l.username}
              {sou && <span className="ml-1.5 text-xs font-semibold text-brasil-green">{t('matchPicks.you')}</span>}
            </span>
            <span className={`font-mono text-sm font-bold tabular-nums ${cor}`}>
              {l.gols_casa} <span className="text-zinc-600">x</span> {l.gols_fora}
            </span>
            {l.pontos != null && (
              <span
                className={`w-12 shrink-0 text-right text-xs font-semibold ${
                  l.pontos > 0 ? cor : 'text-zinc-600'
                }`}
              >
                {l.pontos === 10 ? '🎯' : l.pontos === 5 ? '✓' : '·'} +{l.pontos}
              </span>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
