import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2, Pencil, X } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { Toast, type ToastInfo } from '../components/Toast'
import { useAuth } from '../contexts/AuthContext'
import { useJogos } from '../hooks/useJogos'
import { supabase } from '../lib/supabase'
import { calcularPontos, formatarData } from '../lib/utils'
import type { Palpite } from '../types'

export function Perfil() {
  const { user, profile, refreshProfile } = useAuth()
  const { jogos } = useJogos()

  const [palpites, setPalpites] = useState<Palpite[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [novoUsername, setNovoUsername] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [toast, setToast] = useState<ToastInfo | null>(null)

  const username =
    profile?.username ??
    (user?.user_metadata?.username as string | undefined) ??
    user?.email?.split('@')[0] ??
    'torcedor'

  useEffect(() => {
    if (!user) return
    supabase
      .from('palpites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPalpites((data as Palpite[]) ?? [])
        setLoading(false)
      })
  }, [user])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const jogosPorId = useMemo(() => new Map(jogos.map((j) => [j.id, j])), [jogos])

  const stats = useMemo(() => {
    let pontos = 0
    let exatos = 0
    for (const p of palpites) {
      const j = jogosPorId.get(p.jogo_id)
      if (!j?.encerrado || j.gols_casa == null || j.gols_fora == null) continue
      const pts = calcularPontos(p.gols_casa, p.gols_fora, j.gols_casa, j.gols_fora)
      pontos += pts
      if (pts === 10) exatos++
    }
    return { pontos, exatos, palpites: palpites.length }
  }, [palpites, jogosPorId])

  const historico = useMemo(() => palpites.slice(0, 10), [palpites])

  async function salvarUsername() {
    if (!user) return
    const nome = novoUsername.trim()
    if (nome.length < 3) {
      setToast({ mensagem: 'O nome precisa ter pelo menos 3 caracteres.', tipo: 'erro' })
      return
    }

    setSalvando(true)
    const { error } = await supabase
      .from('profiles')
      .update({ username: nome })
      .eq('id', user.id)
    setSalvando(false)

    if (error) {
      setToast({ mensagem: 'Não foi possível salvar o nome.', tipo: 'erro' })
      return
    }
    await refreshProfile()
    setEditando(false)
    setToast({ mensagem: 'Nome atualizado!', tipo: 'sucesso' })
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* Cabeçalho do perfil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass flex flex-col items-center gap-6 p-8 sm:flex-row"
        >
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brasil-green to-brasil-yellow font-display text-4xl text-black">
            {username.slice(0, 2).toUpperCase()}
          </div>

          <div className="flex-1 text-center sm:text-left">
            {editando ? (
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <input
                  autoFocus
                  value={novoUsername}
                  onChange={(e) => setNovoUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && salvarUsername()}
                  className="w-48 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-lg font-semibold outline-none transition focus:border-brasil-green"
                />
                <button
                  onClick={salvarUsername}
                  disabled={salvando}
                  title="Salvar"
                  className="rounded-lg bg-brasil-green/20 p-2 text-brasil-green transition hover:bg-brasil-green/30 disabled:opacity-60"
                >
                  {salvando ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Check className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={() => setEditando(false)}
                  title="Cancelar"
                  className="rounded-lg bg-white/5 p-2 text-zinc-400 transition hover:text-zinc-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 sm:justify-start">
                <h1 className="font-display text-4xl tracking-wide">{username}</h1>
                <button
                  onClick={() => {
                    setNovoUsername(username)
                    setEditando(true)
                  }}
                  title="Editar nome"
                  className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-brasil-yellow"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            )}
            <p className="mt-1 text-sm text-zinc-500">{user?.email}</p>
          </div>
        </motion.div>

        {/* Estatísticas */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { rotulo: 'Pontos', valor: stats.pontos, cor: 'text-brasil-yellow' },
            { rotulo: 'Palpites', valor: stats.palpites, cor: 'text-zinc-100' },
            { rotulo: 'Placares exatos', valor: stats.exatos, cor: 'text-brasil-green' },
          ].map(({ rotulo, valor, cor }, i) => (
            <motion.div
              key={rotulo}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="glass p-5 text-center"
            >
              <p className={`font-display text-4xl ${cor}`}>{valor}</p>
              <p className="mt-1 text-xs tracking-wider text-zinc-500 uppercase">{rotulo}</p>
            </motion.div>
          ))}
        </div>

        {/* Histórico */}
        <h2 className="mt-10 font-display text-3xl tracking-wide">
          Últimos <span className="text-brasil-green">palpites</span>
        </h2>

        {loading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="glass h-16 animate-pulse" />
            ))}
          </div>
        ) : historico.length === 0 ? (
          <p className="glass mt-4 p-8 text-center text-zinc-500">
            Você ainda não fez nenhum palpite.
          </p>
        ) : (
          <div className="glass mt-4 divide-y divide-white/5">
            {historico.map((p, i) => {
              const jogo = jogosPorId.get(p.jogo_id)
              if (!jogo) return null
              const temResultado =
                jogo.encerrado && jogo.gols_casa != null && jogo.gols_fora != null
              const pts = temResultado
                ? calcularPontos(p.gols_casa, p.gols_fora, jogo.gols_casa!, jogo.gols_fora!)
                : null

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.5) }}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {jogo.emoji_casa} {jogo.time_casa}
                      <span className="mx-1.5 text-zinc-600">x</span>
                      {jogo.emoji_fora} {jogo.time_fora}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {formatarData(jogo.data_jogo)} · Palpite:{' '}
                      <strong className="text-zinc-300">
                        {p.gols_casa} x {p.gols_fora}
                      </strong>
                      {temResultado && (
                        <>
                          {' '}
                          · Resultado:{' '}
                          <strong className="text-zinc-300">
                            {jogo.gols_casa} x {jogo.gols_fora}
                          </strong>
                        </>
                      )}
                    </p>
                  </div>
                  {pts != null ? (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        pts === 10
                          ? 'bg-brasil-green/20 text-brasil-green'
                          : pts === 5
                            ? 'bg-brasil-yellow/20 text-brasil-yellow'
                            : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      +{pts} pts
                    </span>
                  ) : (
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-500">
                      Aguardando
                    </span>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </main>

      <AnimatePresence>{toast && <Toast toast={toast} />}</AnimatePresence>
    </div>
  )
}
