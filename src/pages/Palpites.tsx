import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Loader2, Lock, MapPin, MessageCircle, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Navbar } from '../components/Navbar'
import { Toast, type ToastInfo } from '../components/Toast'
import { ChatJogo } from '../components/ChatJogo'
import { PalpitesJogo } from '../components/PalpitesJogo'
import { CompartilharCard } from '../components/CompartilharCard'
import { useAuth } from '../contexts/AuthContext'
import { useJogos } from '../hooks/useJogos'
import { supabase } from '../lib/supabase'
import { calcularPontosJogo, formatarData, jogoComecou } from '../lib/utils'
import type { Jogo, Palpite } from '../types'

const FILTROS = [
  { id: 'agora', key: 'now' },
  { id: 'todos', key: 'all' },
  { id: '1', key: 'round1' },
  { id: '2', key: 'round2' },
  { id: '3', key: 'round3' },
  { id: 'mata', key: 'knockout' },
  { id: 'meus', key: 'mine' },
]

const FASE_PLACEHOLDER = '⏳'

interface InputPlacar {
  c: string
  f: string
}

function BadgePontos(
  { pontos, exato, resultado, t }:
  { pontos: number; exato: boolean; resultado: boolean; t: (k: string) => string }
) {
  const estilo = exato
    ? 'bg-brasil-green/20 text-brasil-green'
    : resultado
      ? 'bg-brasil-yellow/20 text-brasil-yellow'
      : 'bg-red-500/10 text-red-400'
  const rotulo = exato ? t('predictions.exactScore') : resultado ? t('predictions.correctWinner') : t('predictions.wrong')
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${estilo}`}>
      {rotulo} · +{pontos} pts
    </span>
  )
}

export function Palpites() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { jogos, loading: loadingJogos, error } = useJogos()

  const [palpites, setPalpites] = useState<Record<string, Palpite>>({})
  const [inputs, setInputs] = useState<Record<string, InputPlacar>>({})
  const [avancaInputs, setAvancaInputs] = useState<Record<string, string>>({})
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
        const av: Record<string, string> = {}
        for (const p of (data as Palpite[]) ?? []) {
          map[p.jogo_id] = p
          ins[p.jogo_id] = { c: String(p.gols_casa), f: String(p.gols_fora) }
          if (p.avanca) av[p.jogo_id] = p.avanca
        }
        setPalpites(map)
        setInputs(ins)
        setAvancaInputs(av)
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
    // "Próximos": apenas jogos que ainda não terminaram (em andamento + futuros).
    // Para ver os já encerrados, usar Rodadas ou Todos.
    if (filtro === 'agora') return cron.filter((j) => !j.encerrado)
    if (filtro === 'mata') return cron.filter((j) => (j.fase ?? 'grupos') !== 'grupos')
    return cron.filter((j) => (j.fase ?? 'grupos') === 'grupos' && j.rodada === Number(filtro))
  }, [jogos, filtro, palpites])

  function setInput(jogoId: string, lado: 'c' | 'f', valor: string) {
    setInputs((prev) => {
      const atual = prev[jogoId] ?? { c: '', f: '' }
      return { ...prev, [jogoId]: { ...atual, [lado]: valor } }
    })
  }

  function setAvanca(jogoId: string, time: string) {
    setAvancaInputs((prev) => ({ ...prev, [jogoId]: time }))
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
      setToast({ mensagem: t('predictions.invalidScore'), tipo: 'erro' })
      return
    }

    // Mata-mata: se o palpite for empate, precisa escolher quem avança nos pênaltis.
    const isKnockout = (jogo.fase ?? 'grupos') !== 'grupos'
    let avanca: string | null = null
    if (isKnockout && gc === gf) {
      avanca = avancaInputs[jogo.id] ?? null
      if (!avanca) {
        setToast({ mensagem: t('predictions.advancer.required'), tipo: 'erro' })
        return
      }
    }

    setSalvando(jogo.id)
    const { data, error } = await supabase
      .from('palpites')
      .upsert(
        { user_id: user.id, jogo_id: jogo.id, gols_casa: gc, gols_fora: gf, avanca },
        { onConflict: 'user_id,jogo_id' }
      )
      .select()
      .single()
    setSalvando(null)

    if (error) {
      setToast({ mensagem: t('predictions.error'), tipo: 'erro' })
      return
    }
    setPalpites((prev) => ({ ...prev, [jogo.id]: data as Palpite }))
    setToast({ mensagem: t('predictions.saved'), tipo: 'sucesso' })
  }

  const loading = loadingJogos || loadingPalpites

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-5xl tracking-wide sm:text-6xl">
          {t('predictions.titlePre')} <span className="text-brasil-green">{t('predictions.titleAccent')}</span>
        </h1>
        <p className="mt-2 text-zinc-400">{t('predictions.subtitle', { exact: 10, winner: 5 })}</p>

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
              {t(`predictions.filters.${f.key}`)}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {t('groups.loadError')} {error}
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
                {t('predictions.noneYet')}
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
              const isKnockout = (jogo.fase ?? 'grupos') !== 'grupos'
              // Mata-mata com times ainda indefinidos (placeholder ⏳) não aceita palpite.
              const indefinido = isKnockout && (jogo.emoji_casa === FASE_PLACEHOLDER || jogo.emoji_fora === FASE_PLACEHOLDER)
              const cNum = Number.parseInt(input?.c ?? '', 10)
              const fNum = Number.parseInt(input?.f ?? '', 10)
              const empatePalpite = !Number.isNaN(cNum) && cNum === fNum

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
                      {t('common.match')} {jogo.numero_jogo}
                      {isKnockout
                        ? ` · ${t(`predictions.phases.${jogo.fase}`)}`
                        : ` · ${t('common.group')} ${jogo.grupo} · ${t('common.round')} ${jogo.rodada}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {jogo.estadio ? `${jogo.estadio}, ${jogo.cidade} · ` : ''}{formatarData(jogo.data_jogo)}
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
                    ) : indefinido ? (
                      <span className="text-center text-xs text-zinc-500">
                        {t('predictions.tbd')}
                      </span>
                    ) : comecou ? (
                      <span className="flex items-center gap-1 text-sm text-zinc-500">
                        <Lock className="h-4 w-4" /> {t('predictions.inProgress')}
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

                  {/* Mata-mata: quem avança nos pênaltis (quando o palpite é empate) */}
                  {!comecou && !indefinido && isKnockout && empatePalpite && (
                    <div className="mt-4 flex flex-col items-center gap-2">
                      <p className="text-xs text-zinc-400">{t('predictions.advancer.question')}</p>
                      <div className="flex gap-2">
                        {[[jogo.time_casa, jogo.emoji_casa], [jogo.time_fora, jogo.emoji_fora]].map(([nome, emoji]) => (
                          <button
                            key={nome}
                            type="button"
                            onClick={() => setAvanca(jogo.id, nome)}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                              avancaInputs[jogo.id] === nome
                                ? 'bg-brasil-green/20 text-brasil-green'
                                : 'glass text-zinc-400 hover:text-zinc-100'
                            }`}
                          >
                            <span>{emoji}</span> {nome}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-zinc-600">{t('predictions.advancer.bonus')}</p>
                    </div>
                  )}

                  {/* Resultado e palpite */}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    {jogo.encerrado && palpite && (
                      <>
                        <span className="text-sm text-zinc-400">
                          {t('predictions.yourPick')} <strong>{palpite.gols_casa} x {palpite.gols_fora}</strong>
                        </span>
                        {(() => {
                          const exato = palpite.gols_casa === jogo.gols_casa && palpite.gols_fora === jogo.gols_fora
                          const resultado = Math.sign(palpite.gols_casa - palpite.gols_fora) === Math.sign(jogo.gols_casa! - jogo.gols_fora!)
                          const pts = calcularPontosJogo(
                            { gols_casa: palpite.gols_casa, gols_fora: palpite.gols_fora, avanca: palpite.avanca },
                            jogo,
                          )
                          return <BadgePontos t={t} pontos={pts} exato={exato} resultado={resultado} />
                        })()}
                      </>
                    )}
                    {jogo.encerrado && !palpite && (
                      <span className="text-sm text-zinc-600">{t('predictions.noPrediction')}</span>
                    )}
                    {!jogo.encerrado && comecou && palpite && (
                      <span className="text-sm text-zinc-400">
                        {t('predictions.yourPick')} <strong>{palpite.gols_casa} x {palpite.gols_fora}</strong> · {t('predictions.awaiting')}
                      </span>
                    )}
                    {!comecou && !indefinido && (
                      <button
                        onClick={() => salvar(jogo)}
                        disabled={salvando === jogo.id}
                        className="btn-gradient flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-bold text-black disabled:opacity-60"
                      >
                        {salvando === jogo.id && <Loader2 className="h-4 w-4 animate-spin" />}
                        {palpite ? t('predictions.update') : t('predictions.save')}
                      </button>
                    )}
                    {!comecou && indefinido && (
                      <span className="text-sm text-zinc-600">{t('predictions.awaitingTeams')}</span>
                    )}
                  </div>

                  {/* Barra de ações: compartilhar + palpites de todos + chat */}
                  <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-white/5 pt-3">
                    {palpite && (
                      <CompartilharCard jogo={jogo} palpite={palpite} />
                    )}
                    <div className="ml-auto flex items-center gap-1">
                      {comecou && (
                        <button
                          onClick={() => togglePalpites(jogo.id)}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition ${
                            palpitesEstaAberto
                              ? 'bg-brasil-yellow/15 text-brasil-yellow'
                              : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
                          }`}
                        >
                          <Users className="h-3.5 w-3.5" />
                          {t('matchPicks.title')}
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
