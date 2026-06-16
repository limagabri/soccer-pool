import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'

interface Comentario {
  id: string
  jogo_id: string
  user_id: string
  texto: string
  created_at: string
  username: string
  jogo_label: string
}

function tempoRelativo(dateStr: string, t: (k: string) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return t('admin.now')
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function AdminChat() {
  const { t } = useTranslation()
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroJogo, setFiltroJogo] = useState('')

  async function carregar() {
    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: raw } = await supabase
      .from('comentarios')
      .select('id, jogo_id, user_id, texto, created_at')
      .gte('created_at', ontem)
      .order('created_at', { ascending: false })

    if (!raw) { setLoading(false); return }

    const userIds = [...new Set(raw.map((c: { user_id: string }) => c.user_id))]
    const jogoIds = [...new Set(raw.map((c: { jogo_id: string }) => c.jogo_id))]

    const [{ data: profiles }, { data: jogos }] = await Promise.all([
      supabase.from('profiles').select('id, username').in('id', userIds),
      supabase.from('jogos').select('id, numero_jogo, time_casa, time_fora').in('id', jogoIds),
    ])

    const nomes: Record<string, string> = {}
    for (const p of (profiles as { id: string; username: string }[]) ?? []) nomes[p.id] = p.username

    const jogosMap: Record<string, string> = {}
    for (const j of (jogos as { id: string; numero_jogo: number; time_casa: string; time_fora: string }[]) ?? [])
      jogosMap[j.id] = `${t('common.match')} ${j.numero_jogo}: ${j.time_casa} × ${j.time_fora}`

    setComentarios(
      (raw as { id: string; jogo_id: string; user_id: string; texto: string; created_at: string }[]).map((c) => ({
        ...c,
        username: nomes[c.user_id] ?? t('admin.anon'),
        jogo_label: jogosMap[c.jogo_id] ?? c.jogo_id,
      }))
    )
    setLoading(false)
  }

  useEffect(() => {
    carregar()

    const channel = supabase
      .channel('admin-chat-watcher')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comentarios' }, () => carregar())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comentarios' }, (payload) => {
        setComentarios((prev) => prev.filter((c) => c.id !== (payload.old as { id: string }).id))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function deletar(id: string) {
    await supabase.from('comentarios').delete().eq('id', id)
  }

  const jogoOpcoes = [...new Set(comentarios.map((c) => c.jogo_label))].sort()

  const filtrados = filtroJogo
    ? comentarios.filter((c) => c.jogo_label === filtroJogo)
    : comentarios

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{t('admin.chat.title')}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t('admin.chat.subtitle')}</p>
        </div>
        <select
          value={filtroJogo}
          onChange={(e) => setFiltroJogo(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-green-600"
        >
          <option value="">{t('admin.chat.allMatches')}</option>
          {jogoOpcoes.map((j) => (
            <option key={j} value={j}>{j}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-12 text-center text-zinc-500">
          {t('admin.chat.empty')}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">{t('admin.user')}</th>
                <th className="px-4 py-3">{t('admin.chat.colMatch')}</th>
                <th className="px-4 py-3">{t('admin.chat.colMessage')}</th>
                <th className="px-4 py-3 text-center">{t('admin.chat.colTime')}</th>
                <th className="px-4 py-3 text-right">{t('admin.chat.colAction')}</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-zinc-800/50 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-zinc-200">{c.username}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{c.jogo_label}</td>
                  <td className="max-w-xs px-4 py-3 text-zinc-300">
                    <p className="truncate">{c.texto}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-zinc-500">{tempoRelativo(c.created_at, t)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deletar(c.id)}
                      className="rounded p-1.5 text-zinc-600 transition hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
