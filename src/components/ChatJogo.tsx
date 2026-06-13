import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Send, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Comentario {
  id: string
  user_id: string
  texto: string
  created_at: string
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

export function ChatJogo({ jogo_id }: Props) {
  const { user, profile, isAdmin } = useAuth()
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

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

  async function enviar() {
    if (!user || !texto.trim() || enviando) return
    setEnviando(true)
    await supabase.from('comentarios').insert({
      jogo_id,
      user_id: user.id,
      texto: texto.trim(),
    })
    setTexto('')
    setEnviando(false)
  }

  async function deletar(id: string) {
    await supabase.from('comentarios').delete().eq('id', id)
  }

  const restantes = 280 - texto.length

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
            Nenhuma mensagem ainda. Seja o primeiro a comentar!
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
                      {c.texto}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="text-[10px] text-zinc-600">{tempoRelativo(c.created_at)}</span>
                      {(minha || isAdmin) && (
                        <button
                          onClick={() => deletar(c.id)}
                          className="text-zinc-700 transition hover:text-red-500"
                          title="Deletar"
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

      {/* Input */}
      <div className="mt-3 flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value.slice(0, 280))}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
            placeholder="Escreva um comentário…"
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
