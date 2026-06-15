import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Loader2, Lock, MapPin, MessageCircle, Users } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { Toast, type ToastInfo } from '../components/Toast'
import { ChatJogo } from '../components/ChatJogo'
import { PalpitesJogo } from '../components/PalpitesJogo'
import { CompartilharCard } from '../components/CompartilharCard'
import { useAuth } from '../contexts/AuthContext'
import { useJogos } from '../hooks/useJogos'
import { supabase } from '../lib/supabase'
import { calcularPontos, formatarData, jogoComecou } from '../lib/utils'
import type { Jogo, Palpite } from '../types'

const FILTROS = [
  { id: 'agora', label: 'Agora' },
  { id: 'todos', label: 'Todos' },
  { id: '1', label: 'Rodada 1' },
  { id: '2', label: 'Rodada 2' },
  { id: '3', label: 'Rodada 3' },
  { id: 'meus', label: 'Meus palpites' },
]

interface InputPlacar {
  c: string
  f: string
}

function BadgePontos({ pontos }: { pontos: number }) {
  const estilo =
    pontos === 10
      ? 'bg-brasil-green/20 text-brasil-green'
      : pontos === 5
        ? 'bg-brasil-yellow/20 text-brasil-yellow'
        : 'bg-red-500/10 text-red-400'
  const rotulo = pontos === 10 ? '🎯 Placar exato' : pontos === 5 ? '✓ Acertou o vencedor' : '✗ Errou'
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${estilo}`}>
      {rotulo} · +{pontos} pts
    </span>
  )
}

export function Palpites() {
  const { user } = useAuth()
  const { jogos, loading: loadingJogos, error } = useJogos()

  const [palpites, setPalpites] = useState<Record<string, Palpite>>({})
  const [inputs, setInputs] = useState<Record<string, InputPlacar>>({})
  const [salvando, setSalvando] = useState<string | null>(null)
  const [loadingPalpites, setLoadingPalpites] = useState(true)
  const [filtro, setFiltro] = useState('agora')
  const [toast, setToast] = useState<ToastInfo | null>(null)

  // chat
  const [chatAberto, setChatAberto] = useState<Set<string>>(new Set())
  const [contagemComentarios, setContagemComentarios] = useState<Record<string, number>>({})
  const contagemCarregada = useRef(false)

  // palpites de todos (revelados após o jogo começar)
  const [palpitesAbertos, setPalpitesAbertos] = useState<Set<string>>(new Set())
  const [contagemPalpites, setContagemPalpites] = useState<Record<string, number>>({})
  const contagemPalpitesCarregada = useRef(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('palpites')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const map: Record<string, Palpite> = {}
        const ins: Record<string, InputPlacar> = {}
        for (const p of (data as Palpite[]) ?? []) {
          map[p.jogo_id] = p
          ins[p.jogo_id] = { c: String(p.gols_casa), f: String(p.gols_fora) }
        }
        setPalpites(map)
        setInputs(ins)
        setLoadingPalpites(false)
      })
  }, [user])

  // Carregar contagem de comentários uma vez
  useEffect(() => {
    if (!user || contagemCarregada.current) return
    contagemCarregada.current = true
    supabase.from('comentarios').select('jogo_id').then(({ data }) => {
      const counts: Record<string, number> = {}
      for (const c of (data as { jogo_id: string }[]) ?? [])
        counts[c.jogo_id] = (counts[c.jogo_id] ?? 0) + 1
      setContagemComentarios(counts)
    })
  }, [user])

  // Contagem de palpites por jogo (para o badge do botão "Palpites de todos")
  useEffect(() => {
    if (!user || contagemPalpitesCarregada.current) return
    contagemPalpitesCarregada.current = true
    supabase.from('palpites').select('jogo_id').then(({ data }) => {
      const counts: Record<string, number> = {}
      for (const p of (data as { jogo_id: string }[]) ?? [])
        counts[p.jogo_id] = (counts[p.jogo_id] ?? 0) + 1
      setContagemPalpites(counts)
    })
  }, [user])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const jogosFiltrados = useMemo(() => {
    // Sempre cronológico (a coluna numero_jogo não reflete a ordem real).
    const cron = [...jogos].sort(
      (a, b) => new Date(a.data_jogo).getTime() - new Date(b.data_jogo).getTime()
    )
    if (filtro === 'meus') return cron.filter((j) => palpites[j.id])
    if (filtro === 'todos') return cron
    if (filtro === 'agora') {
      // Janela em torno de hoje: jogos recentes (3 dias) + próximos (5 dias).
      const ini = Date.now() - 3 * 86_400_000
      const fim = Date.now() + 5 * 86_400_000
      const janela = cron.filter((j) => {
        const t = new Date(j.data_jogo).getTime()
        return t >= ini && t <= fim
      })
      // Fora do período de jogos (janela vazia) → mostra os próximos.
      return janela.length ? janela : cron.filter((j) => !j.encerrado).slice(0, 10)
    }
    return cron.filter((j) => j.rodada === Number(filtro))
  }, [jogos, filtro, palpites])

  function setInput(jogoId: string, lado: 'c' | 'f', valor: string) {
    setInputs((prev) => {
      const atual = prev[jogoId] ?? { c: '', f: '' }
      return { ...prev, [jogoId]: { ...atual, [lado]: valor } }
    })
  }

  function toggleChat(jogoId: string) {
    setChatAberto((prev) => {
      const novo = new Set(prev)
      if (novo.has(jogoId)) novo.delete(jogoId)
      else novo.add(jogoId)
      return novo
    })
  }

  function togglePalpites(jogoId: string) {
    setPalpitesAbertos((prev) => {
      const novo = new Set(prev)
      if (novo.has(jogoId)) novo.delete(jogoId)
      else novo.add(jogoId)
      return novo
    })
  }

  async function salvar(jogo: Jogo) {
    if (!user) return
    const v = inputs[jogo.id]
    const gc = Number.parseInt(v?.c ?? '', 10)
    const gf = Number.parseInt(v?.f ?? '', 10)
    if (Number.isNaN(gc) || Number.isNaN(gf) || gc < 0 || gf < 0) {
      setToast({ mensagem: 'Preencha um placar válido.', tipo: 'erro' })
      return
    }

    setSalvando(jogo.id)
    const { data, error } = await supabase
      .from('palpites')
      .upsert(
        { user_id: user.id, jogo_id: jogo.id, gols_casa: gc, gols_fora: gf },
        { onConflict: 'user_id,jogo_id' }
      )
      .select()
      .single()
    setSalvando(null)

    if (error) {
      setToast({ mensagem: 'Erro ao salvar palpite. Tente novamente.', tipo: 'erro' })
      return
    }
    setPalpites((prev) => ({ ...prev, [jogo.id]: data as Palpite }))
    setToast({ mensagem: 'Palpite salvo! Boa sorte. 🍀', tipo: 'sucesso' })
  }

  const loading = loadingJogos || loadingPalpites

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-5xl tracking-wide sm:text-6xl">
          Meus <span className="text-brasil-green">Palpites</span>
        </h1>
        <p className="mt-2 text-zinc-400">
          Placar exato vale <strong className="text-brasil-green">10 pts</strong>, acertar o
          vencedor ou empate vale <strong className="text-brasil-yellow">5 pts</strong>.
        </p>

        {/* Filtros */}
        <div className="mt-8 flex gap-2 overflow-x-auto pb-1">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
                filtro === f.id
                  ? 'bg-brasil-green/15 text-brasil-green'
                  : 'glass text-zinc-400 hover:text-zinc-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            Erro ao carregar jogos: {error}
          </p>
        )}

        {loading && (
          <div className="mt-6 space-y-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="glass h-36 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && (
          <div className="mt-6 space-y-4">
            {jogosFiltrados.length === 0 && (
              <p className="glass p-8 text-center text-zinc-500">
                Nenhum jogo aqui ainda.
              </p>
            )}
            {jogosFiltrados.map((jogo, i) => {
              const palpite = palpites[jogo.id]
              const comecou = jogoComecou(jogo.data_jogo) || jogo.encerrado
              const input = inputs[jogo.id]
              const chatEstaAberto = chatAberto.has(jogo.id)
              const qtdComentarios = contagemComentarios[jogo.id] ?? 0
              const palpitesEstaAberto = palpitesAbertos.has(jogo.id)
              const qtdPalpites = contagemPalpites[jogo.id] ?? 0

              return (
                <motion.div
                  key={jogo.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
                  className="glass p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                    <span>
                      Jogo {jogo.numero_jogo} · Grupo {jogo.grupo} · Rodada {jogo.rodada}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {jogo.estadio}, {jogo.cidade} · {formatarData(jogo.data_jogo)}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-3 sm:gap-5">
                    <div className="flex flex-1 items-center justify-end gap-2 text-right">
                      <span className="text-sm font-medium sm:text-base">{jogo.time_casa}</span>
                      <span className="text-2xl">{jogo.emoji_casa}</span>
                    </div>

                    {jogo.encerrado ? (
                      <span className="font-display text-3xl tracking-widest text-brasil-yellow">
                        {jogo.gols_casa} x {jogo.gols_fora}
                      </span>
                    ) : comecou ? (
                      <span className="flex items-center gap-1 text-sm text-zinc-500">
                        <Lock className="h-4 w-4" /> Em andamento
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="number" min={0} max={20} value={input?.c ?? ''}
                          onChange={(e) => setInput(jogo.id, 'c', e.target.value)}
                          className="h-11 w-12 rounded-lg border border-white/10 bg-white/[0.05] text-center text-lg font-bold outline-none transition focus:border-brasil-green"
                        />
                        <span className="text-zinc-600">x</span>
                        <input
                          type="number" min={0} max={20} value={input?.f ?? ''}
                          onChange={(e) => setInput(jogo.id, 'f', e.target.value)}
                          className="h-11 w-12 rounded-lg border border-white/10 bg-white/[0.05] text-center text-lg font-bold outline-none transition focus:border-brasil-green"
                        />
                      </div>
                    )}

                    <div className="flex flex-1 items-center gap-2">
                      <span className="text-2xl">{jogo.emoji_fora}</span>
                      <span className="text-sm font-medium sm:text-base">{jogo.time_fora}</span>
                    </div>
                  </div>

                  {/* Resultado e palpite */}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    {jogo.encerrado && palpite && (
                      <>
                        <span className="text-sm text-zinc-400">
                          Seu palpite: <strong>{palpite.gols_casa} x {palpite.gols_fora}</strong>
                        </span>
                        <BadgePontos
                          pontos={calcularPontos(palpite.gols_casa, palpite.gols_fora, jogo.gols_casa!, jogo.gols_fora!)}
                        />
                      </>
                    )}
                    {jogo.encerrado && !palpite && (
                      <span className="text-sm text-zinc-600">Você não palpitou neste jogo.</span>
                    )}
                    {!jogo.encerrado && comecou && palpite && (
                      <span className="text-sm text-zinc-400">
                        Seu palpite: <strong>{palpite.gols_casa} x {palpite.gols_fora}</strong> · aguardando resultado
                      </span>
                    )}
                    {!comecou && (
                      <button
                        onClick={() => salvar(jogo)}
                        disabled={salvando === jogo.id}
                        className="btn-gradient flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-bold text-black disabled:opacity-60"
                      >
                        {salvando === jogo.id && <Loader2 className="h-4 w-4 animate-spin" />}
                        {palpite ? 'Atualizar palpite' : 'Salvar palpite'}
                      </button>
                    )}
                  </div>

                  {/* Barra de ações: compartilhar + palpites de todos + chat */}
                  <div className="mt-3 flex items-center gap-1 border-t border-white/5 pt-3">
                    {palpite && (
                      <CompartilharCard jogo={jogo} palpite={palpite} />
                    )}
                    {comecou && (
                      <button
                        onClick={() => togglePalpites(jogo.id)}
                        className={`ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition ${
                          palpitesEstaAberto
                            ? 'bg-brasil-yellow/15 text-brasil-yellow'
                            : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
                        }`}
                      >
                        <Users className="h-3.5 w-3.5" />
                        Palpites
                        {qtdPalpites > 0 && (
                          <span className="rounded-full bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">
                            {qtdPalpites}
                          </span>
                        )}
                        <ChevronDown
                          className={`h-3 w-3 transition-transform ${palpitesEstaAberto ? 'rotate-180' : ''}`}
                        />
                      </button>
                    )}
                    <button
                      onClick={() => toggleChat(jogo.id)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition ${
                        comecou ? '' : 'ml-auto'
                      } ${
                        chatEstaAberto
                          ? 'bg-brasil-green/15 text-brasil-green'
                          : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
                      }`}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Chat
                      {qtdComentarios > 0 && (
                        <span className="rounded-full bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">
                          {qtdComentarios}
                        </span>
                      )}
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${chatEstaAberto ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>

                  {/* Palpites de todos — expandido */}
                  <AnimatePresence>
                    {palpitesEstaAberto && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 border-t border-white/5 pt-3">
                          <PalpitesJogo jogo={jogo} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Chat expandido */}
                  <AnimatePresence>
                    {chatEstaAberto && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 border-t border-white/5 pt-3">
                          <ChatJogo jogo_id={jogo.id} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
