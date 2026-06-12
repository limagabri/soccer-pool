import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Clock, Loader2, Pencil, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatarData } from '../../lib/utils'
import { GRUPOS } from '../../lib/classificacao'
import type { Jogo } from '../../types'

type Filtro = 'todos' | 'pendentes' | 'encerrados' | string

interface ModalState {
  jogo: Jogo
  gols_casa: string
  gols_fora: string
  encerrado: boolean
}

function BadgeStatus({ encerrado }: { encerrado: boolean }) {
  return encerrado ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-900/40 px-2 py-0.5 text-xs font-medium text-green-400">
      <CheckCircle2 className="h-3 w-3" /> Encerrado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-500">
      <Clock className="h-3 w-3" /> Pendente
    </span>
  )
}

export function AdminJogos() {
  const [jogos, setJogos] = useState<Jogo[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [modal, setModal] = useState<ModalState | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [feedbackId, setFeedbackId] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('jogos')
      .select('*')
      .order('numero_jogo')
      .then(({ data }) => {
        setJogos((data as Jogo[]) ?? [])
        setLoading(false)
      })
  }, [])

  const jogosFiltrados = useMemo(() => {
    if (filtro === 'pendentes') return jogos.filter((j) => !j.encerrado)
    if (filtro === 'encerrados') return jogos.filter((j) => j.encerrado)
    if (GRUPOS.includes(filtro)) return jogos.filter((j) => j.grupo === filtro)
    return jogos
  }, [jogos, filtro])

  function abrirModal(jogo: Jogo) {
    setModal({
      jogo,
      gols_casa: jogo.gols_casa != null ? String(jogo.gols_casa) : '',
      gols_fora: jogo.gols_fora != null ? String(jogo.gols_fora) : '',
      encerrado: jogo.encerrado,
    })
  }

  async function salvarResultado() {
    if (!modal) return
    const gc = Number.parseInt(modal.gols_casa, 10)
    const gf = Number.parseInt(modal.gols_fora, 10)
    if (Number.isNaN(gc) || Number.isNaN(gf) || gc < 0 || gf < 0) return

    setSalvando(true)
    const { data, error } = await supabase
      .from('jogos')
      .update({ gols_casa: gc, gols_fora: gf, encerrado: modal.encerrado })
      .eq('id', modal.jogo.id)
      .select()
      .single()
    setSalvando(false)

    if (!error && data) {
      setJogos((prev) => prev.map((j) => (j.id === modal.jogo.id ? (data as Jogo) : j)))
      setFeedbackId(modal.jogo.id)
      setTimeout(() => setFeedbackId(null), 2000)
      setModal(null)
    }
  }

  const FILTROS: { id: Filtro; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'pendentes', label: 'Pendentes' },
    { id: 'encerrados', label: 'Encerrados' },
    ...GRUPOS.map((g) => ({ id: g as Filtro, label: `Grupo ${g}` })),
  ]

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Jogos</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {jogos.filter((j) => j.encerrado).length} de {jogos.length} jogos encerrados
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTROS.slice(0, 3).map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filtro === f.id
                ? 'bg-green-700 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-100'
            }`}
          >
            {f.label}
          </button>
        ))}
        <select
          value={GRUPOS.includes(filtro) ? filtro : ''}
          onChange={(e) => setFiltro(e.target.value || 'todos')}
          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-400 outline-none focus:ring-1 focus:ring-green-600"
        >
          <option value="">Grupo…</option>
          {GRUPOS.map((g) => (
            <option key={g} value={g}>Grupo {g}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-zinc-800" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs tracking-wider text-zinc-500 uppercase">
                <th className="px-4 py-3">#</th>
                <th className="py-3">Partida</th>
                <th className="px-3 py-3 text-center">Resultado</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Data</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {jogosFiltrados.map((jogo) => (
                <motion.tr
                  key={jogo.id}
                  initial={false}
                  animate={{ backgroundColor: feedbackId === jogo.id ? 'rgba(34,197,94,0.1)' : 'transparent' }}
                  className="border-b border-zinc-800/50 last:border-0"
                >
                  <td className="px-4 py-3 text-zinc-500">{jogo.numero_jogo}</td>
                  <td className="py-3">
                    <span className="flex items-center gap-2 font-medium text-zinc-200">
                      <span>{jogo.emoji_casa}</span>
                      <span className="hidden sm:inline">{jogo.time_casa}</span>
                      <span className="text-zinc-600">×</span>
                      <span className="hidden sm:inline">{jogo.time_fora}</span>
                      <span>{jogo.emoji_fora}</span>
                    </span>
                    <span className="mt-0.5 block text-xs text-zinc-600">Grupo {jogo.grupo} · R{jogo.rodada}</span>
                  </td>
                  <td className="px-3 py-3 text-center font-mono text-zinc-300">
                    {jogo.gols_casa != null ? `${jogo.gols_casa}–${jogo.gols_fora}` : '–'}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <BadgeStatus encerrado={jogo.encerrado} />
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-zinc-500">
                    {formatarData(jogo.data_jogo)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => abrirModal(jogo)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700 hover:text-zinc-100"
                    >
                      <Pencil className="h-3 w-3" />
                      Resultado
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-6"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-zinc-100">Inserir Resultado</h2>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {modal.jogo.time_casa} × {modal.jogo.time_fora}
                  </p>
                </div>
                <button onClick={() => setModal(null)} className="text-zinc-600 hover:text-zinc-300">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 py-4">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">{modal.jogo.emoji_casa}</span>
                  <span className="text-xs text-zinc-400">{modal.jogo.time_casa}</span>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={modal.gols_casa}
                    onChange={(e) => setModal((m) => m && { ...m, gols_casa: e.target.value })}
                    className="h-14 w-16 rounded-lg border border-zinc-700 bg-zinc-800 text-center text-2xl font-bold text-zinc-100 outline-none focus:border-green-600"
                  />
                </div>
                <span className="text-2xl font-bold text-zinc-600">×</span>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">{modal.jogo.emoji_fora}</span>
                  <span className="text-xs text-zinc-400">{modal.jogo.time_fora}</span>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={modal.gols_fora}
                    onChange={(e) => setModal((m) => m && { ...m, gols_fora: e.target.value })}
                    className="h-14 w-16 rounded-lg border border-zinc-700 bg-zinc-800 text-center text-2xl font-bold text-zinc-100 outline-none focus:border-green-600"
                  />
                </div>
              </div>

              <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-lg bg-zinc-800 px-4 py-3">
                <input
                  type="checkbox"
                  checked={modal.encerrado}
                  onChange={(e) => setModal((m) => m && { ...m, encerrado: e.target.checked })}
                  className="h-4 w-4 rounded accent-green-500"
                />
                <div>
                  <p className="text-sm font-medium text-zinc-200">Marcar como encerrado</p>
                  <p className="text-xs text-zinc-500">Pontos serão calculados automaticamente pelo trigger</p>
                </div>
              </label>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setModal(null)}
                  className="flex-1 rounded-lg border border-zinc-700 py-2.5 text-sm font-medium text-zinc-400 transition hover:border-zinc-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarResultado}
                  disabled={salvando}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-60"
                >
                  {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
                  Salvar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
