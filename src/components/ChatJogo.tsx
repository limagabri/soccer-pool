import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Send, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const REACOES = [
  { emoji: '⚽', key: 'goal' },
  { emoji: '🔥', key: 'whatGame' },
  { emoji: '😱', key: 'noWay' },
  { emoji: '🤦', key: 'blunder' },
  { emoji: '🎯', key: 'nailedIt' },
  { emoji: '💀', key: 'rip' },
]

const COOLDOWN_MS = 10_000

interface Comentario {
  id: string
  user_id: string
  texto: string
  created_at: string
  username: string
}

interface Participante {
  id: string
  username: string
}

interface Props {
  jogo_id: string
}

function tempoRelativo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'agora'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

// Destaca @menções de usuários conhecidos (nomes podem ter espaço).
function renderComMencoes(texto: string, nomes: string[]): ReactNode {
  const ordenados = [...nomes].sort((a, b) => b.length - a.length)
  const out: ReactNode[] = []
  let buffer = ''
  let i = 0
  const lower = texto.toLowerCase()
  const flush = () => { if (buffer) { out.push(buffer); buffer = '' } }
  while (i < texto.length) {
    if (texto[i] === '@') {
      const resto = lower.slice(i + 1)
      const nome = ordenados.find((n) => n && resto.startsWith(n.toLowerCase()))
      if (nome) {
        flush()
        out.push(
          <span key={i} className="font-semibold text-brasil-green">
            @{texto.slice(i + 1, i + 1 + nome.length)}
          </span>
        )
        i += 1 + nome.length
        continue
      }
    }
    buffer += texto[i]
    i++
  }
  flush()
  return out
}

export function ChatJogo({ jogo_id }: Props) {
  const { t } = useTranslation()
  const { user, profile, isAdmin } = useAuth()
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [reacaoBounce, setReacaoBounce] = useState<string | null>(null)
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const ultimasReacoes = useRef<Record<string, number>>({})

  async function carregarComentarios() {
    const { data } = await supabase
      .from('comentarios')
      .select('id, user_id, texto, created_at')
      .eq('jogo_id', jogo_id)
      .order('created_at')

    if (!data) { setLoading(false); return }

    const userIds = [...new Set(data.map((c: { user_id: string }) => c.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds)

    const nomes: Record<string, string> = {}
    for (const p of (profiles as { id: string; username: string }[]) ?? [])
      nomes[p.id] = p.username

    setComentarios(data.map((c: { id: string; user_id: string; texto: string; created_at: string }) => ({ ...c, username: nomes[c.user_id] ?? 'Anônimo' })))
    setLoading(false)
  }

  // Lista de participantes (não-admin) para autocomplete de @menção.
  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, username')
      .eq('is_admin', false)
      .then(({ data }) => setParticipantes((data as Participante[]) ?? []))
  }, [])

  useEffect(() => {
    carregarComentarios()

    const channel = supabase
      .channel(`chat-${jogo_id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comentarios', filter: `jogo_id=eq.${jogo_id}` },
        async (payload) => {
          const novo = payload.new as { id: string; user_id: string; texto: string; created_at: string }
          let username = profile?.username ?? 'Anônimo'
          if (novo.user_id !== user?.id) {
            const { data } = await supabase.from('profiles').select('username').eq('id', novo.user_id).single()
            username = (data as { username: string } | null)?.username ?? 'Anônimo'
          }
          setComentarios((prev) => {
            if (prev.some((c) => c.id === novo.id)) return prev
            return [...prev, { ...novo, username }]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'comentarios', filter: `jogo_id=eq.${jogo_id}` },
        (payload) => {
          setComentarios((prev) => prev.filter((c) => c.id !== (payload.old as { id: string }).id))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jogo_id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comentarios])

  // ── Autocomplete de @menção ────────────────────────────────────────────────
  const mencaoQuery = useMemo(() => {
    const m = texto.match(/@([^@\n]*)$/)
    return m ? m[1] : null
  }, [texto])

  const sugestoes = useMemo(() => {
    if (mencaoQuery === null) return []
    const q = mencaoQuery.toLowerCase().trim()
    return participantes
      .filter((p) => p.id !== user?.id && p.username.toLowerCase().includes(q))
      .slice(0, 5)
  }, [mencaoQuery, participantes, user?.id])

  function escolherMencao(username: string) {
    setTexto((t) => t.replace(/@([^@\n]*)$/, `@${username} `))
  }

  async function enviar() {
    if (!user || !texto.trim() || enviando) return
    setEnviando(true)
    const conteudo = texto.trim()
    await supabase.from('comentarios').insert({ jogo_id, user_id: user.id, texto: conteudo })
    setTexto('')
    setEnviando(false)

    // Notifica (push) os usuários mencionados que tenham o PWA instalado.
    const mencionados = participantes
      .filter((p) => p.id !== user.id && conteudo.toLowerCase().includes(`@${p.username.toLowerCase()}`))
      .map((p) => p.id)
    if (mencionados.length) {
      supabase.functions.invoke('enviar-push', {
        body: {
          user_ids: mencionados,
          titulo: `💬 ${t('chat.mentionedYou', { name: profile?.username ?? '' })}`,
          mensagem: conteudo.slice(0, 120),
          url: 'palpites', // relativo ao scope do SW (base-agnóstico)
        },
      }).catch(() => { /* push é best-effort */ })
    }
  }

  async function deletar(id: string) {
    await supabase.from('comentarios').delete().eq('id', id)
  }

  function handleReacao(r: { emoji: string; key: string }) {
    if (!user) return
    const agora = Date.now()
    const ultima = ultimasReacoes.current[r.emoji] ?? 0
    if (agora - ultima < COOLDOWN_MS) return
    ultimasReacoes.current[r.emoji] = agora
    setReacaoBounce(r.emoji)
    setTimeout(() => setReacaoBounce(null), 350)
    supabase.from('comentarios').insert({ jogo_id, user_id: user.id, texto: `${r.emoji} ${t(`chat.reactions.${r.key}`)}` })
  }

  const restantes = 280 - texto.length
  const nomes = useMemo(() => participantes.map((p) => p.username), [participantes])

  return (
    <div className="flex flex-col">
      {/* Lista de mensagens */}
      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
          </div>
        ) : comentarios.length === 0 ? (
          <p className="py-4 text-center text-xs text-zinc-600">
            {t('chat.empty')}
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {comentarios.map((c) => {
              const minha = c.user_id === user?.id
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-start gap-2 ${minha ? 'flex-row-reverse' : ''}`}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brasil-green to-brasil-yellow text-[10px] font-bold text-black">
                    {c.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className={`max-w-[75%] ${minha ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div
                      className={`rounded-xl px-3 py-2 text-sm leading-snug ${
                        minha
                          ? 'rounded-tr-sm bg-brasil-green/20 text-zinc-100'
                          : 'rounded-tl-sm bg-white/[0.06] text-zinc-200'
                      }`}
                    >
                      {!minha && (
                        <span className="mb-0.5 block text-[10px] font-semibold text-brasil-green">
                          {c.username}
                        </span>
                      )}
                      {renderComMencoes(c.texto, nomes)}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="text-[10px] text-zinc-600">{tempoRelativo(c.created_at)}</span>
                      {(minha || isAdmin) && (
                        <button
                          onClick={() => deletar(c.id)}
                          className="text-zinc-700 transition hover:text-red-500"
                          title={t('chat.delete')}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reações rápidas */}
      {user && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {REACOES.map(r => (
            <motion.button
              key={r.emoji}
              animate={reacaoBounce === r.emoji ? { scale: [1, 1.4, 0.9, 1.1, 1] } : {}}
              transition={{ duration: 0.35 }}
              onClick={() => handleReacao(r)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-300 transition hover:border-brasil-green/40 hover:bg-brasil-green/10 hover:text-zinc-100"
            >
              {r.emoji} <span className="hidden sm:inline">{t(`chat.reactions.${r.key}`)}</span>
            </motion.button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="relative mt-2.5 flex items-end gap-2">
        {/* Dropdown de @menção */}
        {sugestoes.length > 0 && (
          <div className="absolute bottom-full left-0 mb-1 w-56 overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-xl">
            {sugestoes.map((p) => (
              <button
                key={p.id}
                onClick={() => escolherMencao(p.username)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-brasil-green/15"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brasil-green to-brasil-yellow text-[9px] font-bold text-black">
                  {p.username.slice(0, 2).toUpperCase()}
                </span>
                {p.username}
              </button>
            ))}
          </div>
        )}
        <div className="relative flex-1">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value.slice(0, 280))}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
            placeholder={t('chat.placeholder')}
            rows={1}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 pr-12 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-brasil-green/50"
          />
          <span className={`absolute bottom-2 right-3 text-[10px] ${restantes < 20 ? 'text-brasil-yellow' : 'text-zinc-600'}`}>
            {restantes}
          </span>
        </div>
        <button
          onClick={enviar}
          disabled={enviando || !texto.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brasil-green/20 text-brasil-green transition hover:bg-brasil-green/30 disabled:opacity-40"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
