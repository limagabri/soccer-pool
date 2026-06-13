import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart2, ChevronDown, Star } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { GraficoRanking } from '../components/GraficoRanking'
import { useAuth } from '../contexts/AuthContext'
import { useJogos } from '../hooks/useJogos'
import { useRankingHistorico } from '../hooks/useRankingHistorico'
import { supabase } from '../lib/supabase'
import { agregarEstatisticas, type PalpiteResumo } from '../lib/pontuacao'

const MEDALHAS = ['🥇', '🥈', '🥉']

interface LinhaRanking {
  user_id: string
  username: string
  palpites: number
  exatos: number
  vencedor: number
  pontos: number
  ptsEspeciais: number
  total: number
}

export function Ranking() {
  const { user } = useAuth()
  const { jogos } = useJogos()
  const [palpites, setPalpites] = useState<PalpiteResumo[]>([])
  const [usernames, setUsernames] = useState<Record<string, string>>({})
  const [pontosEspeciais, setPontosEspeciais] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [mostrarGrafico, setMostrarGrafico] = useState(false)

  const { historico, carregar: carregarHistorico, salvarSnapshot } = useRankingHistorico()
  const snapshotSalvo = useRef(false)

  const carregar = useCallback(async () => {
    const [{ data: dataPalpites }, { data: dataProfiles }] = await Promise.all([
      supabase.from('palpites').select('user_id, jogo_id, gols_casa, gols_fora'),
      supabase.from('profiles').select('id, username').eq('is_admin', false),
    ])
    setPalpites((dataPalpites as PalpiteResumo[]) ?? [])
    const nomes: Record<string, string> = {}
    for (const p of (dataProfiles as { id: string; username: string }[]) ?? []) {
      nomes[p.id] = p.username
    }
    setUsernames(nomes)
    // pontos_especiais not yet in DB schema — defaults to 0
    setPontosEspeciais({})
    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
    carregarHistorico()

    const channel = supabase
      .channel('ranking-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'palpites' },
        () => carregar()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [carregar, carregarHistorico])

  const linhas: LinhaRanking[] = useMemo(() => {
    const stats = agregarEstatisticas(palpites, jogos)
    return [...stats.values()]
      .filter((s) => s.user_id in usernames)
      .map((s) => {
        const ptsEspeciais = pontosEspeciais[s.user_id] ?? 0
        return { ...s, username: usernames[s.user_id], ptsEspeciais, total: s.pontos + ptsEspeciais }
      })
      .sort(
        (a, b) =>
          b.total - a.total ||
          b.exatos - a.exatos ||
          b.vencedor - a.vencedor ||
          a.username.localeCompare(b.username)
      )
  }, [palpites, jogos, usernames, pontosEspeciais])

  // Salva snapshot uma vez por sessão após linhas carregarem
  useEffect(() => {
    if (linhas.length === 0 || snapshotSalvo.current) return
    snapshotSalvo.current = true
    const snapshot = linhas.map((l, i) => ({ user_id: l.user_id, posicao: i + 1, total: l.total }))
    salvarSnapshot(snapshot)
  }, [linhas, salvarSnapshot])

  const temEspeciais = linhas.some((l) => l.ptsEspeciais > 0)

  const usernamesMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const l of linhas) m[l.user_id] = l.username
    return m
  }, [linhas])

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-4xl tracking-wide sm:text-5xl md:text-6xl">
          <span className="text-brasil-yellow">Ranking</span> Geral
        </h1>
        <p className="mt-2 text-zinc-400">
          Quem está entendendo de futebol até agora? Atualiza em tempo real.
        </p>

        {loading ? (
          <div className="mt-8 space-y-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="glass h-16 animate-pulse" />
            ))}
          </div>
        ) : linhas.length === 0 ? (
          <p className="glass mt-8 p-10 text-center text-zinc-500">
            Nenhum palpite registrado ainda.
            {!user && ' Entre na sua conta para ver o ranking completo.'}
          </p>
        ) : (
          <>
            <div className="glass mt-8 overflow-x-auto">
              <table className="w-full min-w-[38rem] text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs tracking-wider text-zinc-500 uppercase">
                    <th className="px-4 py-3">#</th>
                    <th className="py-3">Participante</th>
                    <th className="px-2 py-3 text-center">Palpites</th>
                    <th className="px-2 py-3 text-center" title="Placar exato (10 pts)">
                      🎯 Exatos
                    </th>
                    <th className="px-2 py-3 text-center" title="Vencedor/empate (5 pts)">
                      ✓ Vencedor
                    </th>
                    <th className="px-2 py-3 text-center">Pts</th>
                    {temEspeciais && <th className="px-2 py-3 text-center">⭐ Bônus</th>}
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((linha, i) => {
                    const sou = user?.id === linha.user_id
                    return (
                      <motion.tr
                        key={linha.user_id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: Math.min(i * 0.06, 0.8) }}
                        className={`border-b border-white/5 last:border-0 ${
                          sou ? 'border-l-2 border-l-brasil-green bg-brasil-green/10' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-lg">
                          {MEDALHAS[i] ?? (
                            <span className="text-sm font-bold text-zinc-500">{i + 1}º</span>
                          )}
                        </td>
                        <td className="py-3">
                          <span className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brasil-green to-brasil-yellow text-xs font-bold text-black">
                              {linha.username.slice(0, 2).toUpperCase()}
                            </span>
                            <span className="font-medium">
                              {linha.username}
                              {sou && (
                                <span className="ml-2 text-xs font-semibold text-brasil-green">
                                  você
                                </span>
                              )}
                            </span>
                          </span>
                        </td>
                        <td className="px-2 py-3 text-center text-zinc-400">{linha.palpites}</td>
                        <td className="px-2 py-3 text-center text-zinc-400">{linha.exatos}</td>
                        <td className="px-2 py-3 text-center text-zinc-400">{linha.vencedor}</td>
                        <td className="px-2 py-3 text-center text-zinc-400">{linha.pontos}</td>
                        {temEspeciais && (
                          <td className="px-2 py-3 text-center">
                            {linha.ptsEspeciais > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-brasil-yellow/20 px-2 py-0.5 text-xs font-semibold text-brasil-yellow">
                                <Star className="h-3 w-3" />
                                +{linha.ptsEspeciais}
                              </span>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3 text-right font-display text-2xl text-brasil-yellow">
                          {linha.total}
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Seção evolução */}
            <div className="glass mt-4">
              <button
                onClick={() => setMostrarGrafico((v) => !v)}
                className="flex w-full items-center gap-2 px-5 py-4 text-sm font-medium text-zinc-400 transition hover:text-zinc-200"
              >
                <BarChart2 className="h-4 w-4 text-brasil-yellow" />
                Evolução do Ranking
                <ChevronDown
                  className={`ml-auto h-4 w-4 transition-transform ${mostrarGrafico ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence>
                {mostrarGrafico && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-white/5 px-4 pb-5 pt-4">
                      <GraficoRanking historico={historico} usernames={usernamesMap} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
