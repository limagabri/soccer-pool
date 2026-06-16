import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Clock, Loader2, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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

interface EventoJogo {
  id: string
  jogo_id: string
  tipo: 'gol' | 'gol_contra' | 'assistencia'
  jogador: string
  selecao: string
  minuto: number | null
}

interface EventoForm {
  tipo: EventoJogo['tipo']
  jogador: string
  selecao: string
  minuto: string
}

const FASES_MATAMATA = [
  { tk: 'r32',      inicio: 73,  count: 16 },
  { tk: 'r16',      inicio: 89,  count: 8  },
  { tk: 'quarters', inicio: 97,  count: 4  },
  { tk: 'semis',    inicio: 101, count: 2  },
  { tk: 'third',    inicio: 103, count: 1  },
  { tk: 'final',    inicio: 104, count: 1  },
]

function BadgeStatus({ encerrado, t }: { encerrado: boolean; t: (k: string) => string }) {
  return encerrado ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-900/40 px-2 py-0.5 text-xs font-medium text-green-400">
      <CheckCircle2 className="h-3 w-3" /> {t('admin.matches.statusFinished')}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-500">
      <Clock className="h-3 w-3" /> {t('admin.matches.statusPending')}
    </span>
  )
}

export function AdminJogos() {
  const { t } = useTranslation()
  const [jogos, setJogos] = useState<Jogo[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [modal, setModal] = useState<ModalState | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [feedbackId, setFeedbackId] = useState<string | null>(null)

  const [sincronizando, setSincronizando] = useState(false)
  const [syncMsg, setSyncMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // eventos
  const [eventos, setEventos] = useState<EventoJogo[]>([])
  const [carregandoEventos, setCarregandoEventos] = useState(false)
  const [eventoForm, setEventoForm] = useState<EventoForm>({ tipo: 'gol', jogador: '', selecao: '', minuto: '' })
  const [salvandoEvento, setSalvandoEvento] = useState(false)

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

  async function sincronizarAgora() {
    setSincronizando(true)
    setSyncMsg(null)
    try {
      const { data, error } = await supabase.functions.invoke('sync-resultados')
      if (error) throw error
      const d = data as { updated?: number; errors?: string[] }
      const txt = t('admin.matches.syncResult', { count: d.updated ?? 0 }) + (d.errors?.length ? t('admin.matches.syncErrors', { n: d.errors.length }) : '')
      setSyncMsg({ ok: true, text: txt })
      if ((d.updated ?? 0) > 0) {
        const { data: fresh } = await supabase.from('jogos').select('*').order('numero_jogo')
        if (fresh) setJogos(fresh as Jogo[])
      }
    } catch (err) {
      setSyncMsg({ ok: false, text: String(err) })
    }
    setSincronizando(false)
    setTimeout(() => setSyncMsg(null), 6000)
  }

  async function abrirModal(jogo: Jogo) {
    setModal({
      jogo,
      gols_casa: jogo.gols_casa != null ? String(jogo.gols_casa) : '',
      gols_fora: jogo.gols_fora != null ? String(jogo.gols_fora) : '',
      encerrado: jogo.encerrado,
    })
    setCarregandoEventos(true)
    setEventos([])
    setEventoForm({ tipo: 'gol', jogador: '', selecao: '', minuto: '' })
    const { data } = await supabase
      .from('eventos_jogo')
      .select('*')
      .eq('jogo_id', jogo.id)
      .order('minuto', { nullsFirst: false })
    setEventos((data as EventoJogo[]) ?? [])
    setCarregandoEventos(false)
  }

  function fecharModal() {
    setModal(null)
    setEventos([])
    setEventoForm({ tipo: 'gol', jogador: '', selecao: '', minuto: '' })
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
    }
  }

  async function adicionarEvento() {
    if (!modal || !eventoForm.jogador.trim() || !eventoForm.selecao.trim()) return
    setSalvandoEvento(true)
    const { data } = await supabase
      .from('eventos_jogo')
      .insert({
        jogo_id: modal.jogo.id,
        tipo: eventoForm.tipo,
        jogador: eventoForm.jogador.trim(),
        selecao: eventoForm.selecao.trim(),
        minuto: eventoForm.minuto ? parseInt(eventoForm.minuto) : null,
      })
      .select()
      .single()
    if (data) {
      setEventos((prev) => [...prev, data as EventoJogo])
      setEventoForm((f) => ({ ...f, jogador: '', minuto: '' }))
    }
    setSalvandoEvento(false)
  }

  async function removerEvento(id: string) {
    await supabase.from('eventos_jogo').delete().eq('id', id)
    setEventos((prev) => prev.filter((e) => e.id !== id))
  }

  const FILTROS: { id: Filtro; k: string }[] = [
    { id: 'todos', k: 'filterAll' },
    { id: 'pendentes', k: 'filterPending' },
    { id: 'encerrados', k: 'filterFinished' },
  ]

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{t('admin.matches.title')}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {t('admin.matches.summary', { done: jogos.filter((j) => j.encerrado).length, total: jogos.length })}
          </p>
        </div>
        <button
          onClick={sincronizarAgora}
          disabled={sincronizando}
          className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-700 hover:text-zinc-100 disabled:opacity-60"
        >
          {sincronizando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {t('admin.matches.syncNow')}
        </button>
      </div>

      {syncMsg && (
        <div className={`mb-4 rounded-lg border px-4 py-2.5 text-sm ${
          syncMsg.ok
            ? 'border-green-800/50 bg-green-900/20 text-green-400'
            : 'border-red-800/50 bg-red-900/20 text-red-400'
        }`}>
          {syncMsg.text}
        </div>
      )}

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filtro === f.id
                ? 'bg-green-700 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-100'
            }`}
          >
            {t(`admin.matches.${f.k}`)}
          </button>
        ))}
        <select
          value={GRUPOS.includes(filtro) ? filtro : ''}
          onChange={(e) => setFiltro(e.target.value || 'todos')}
          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-400 outline-none focus:ring-1 focus:ring-green-600"
        >
          <option value="">{t('admin.matches.groupOpt')}</option>
          {GRUPOS.map((g) => (
            <option key={g} value={g}>{t('common.group')} {g}</option>
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
                <th className="py-3">{t('admin.matches.colMatch')}</th>
                <th className="px-3 py-3 text-center">{t('admin.matches.colResult')}</th>
                <th className="px-3 py-3 text-center">{t('admin.matches.colStatus')}</th>
                <th className="px-4 py-3 text-center">{t('admin.matches.colDate')}</th>
                <th className="px-4 py-3 text-right">{t('admin.matches.colAction')}</th>
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
                    <span className="mt-0.5 block text-xs text-zinc-600">{t('common.group')} {jogo.grupo} · R{jogo.rodada}</span>
                  </td>
                  <td className="px-3 py-3 text-center font-mono text-zinc-300">
                    {jogo.gols_casa != null ? `${jogo.gols_casa}–${jogo.gols_fora}` : '–'}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <BadgeStatus encerrado={jogo.encerrado} t={t} />
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
                      {t('admin.common.edit')}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mata-mata — preview placeholders for J73–J104 */}
      <div className="mt-10">
        <h2 className="mb-5 text-xl font-bold text-zinc-100">{t('admin.matches.knockout')}</h2>
        <div className="space-y-8">
          {FASES_MATAMATA.map(({ tk, inicio, count }) => {
            const numeros = Array.from({ length: count }, (_, i) => inicio + i)
            return (
              <div key={tk}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">{t(`admin.matches.phases.${tk}`)}</h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {numeros.map((num) => {
                    const jogo = jogos.find((j) => j.numero_jogo === num)
                    return (
                      <div
                        key={num}
                        className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="text-xs text-zinc-600">J{num}</p>
                          {jogo ? (
                            <>
                              <p className="truncate text-sm font-medium text-zinc-200">
                                {jogo.emoji_casa} {jogo.time_casa}
                                <span className="mx-1 text-zinc-600">×</span>
                                {jogo.time_fora} {jogo.emoji_fora}
                              </p>
                              {jogo.encerrado ? (
                                <p className="text-xs text-green-500">
                                  {jogo.gols_casa}–{jogo.gols_fora} · {t('admin.matches.finished')}
                                </p>
                              ) : (
                                <p className="text-xs text-zinc-500">{formatarData(jogo.data_jogo)}</p>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-zinc-500">{t('admin.matches.tbd')}</p>
                              <p className="text-xs text-zinc-700">{t('admin.matches.awaitingQual')}</p>
                            </>
                          )}
                        </div>
                        {jogo && (
                          <button
                            onClick={() => abrirModal(jogo)}
                            className="ml-2 shrink-0 rounded-lg bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-100"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-8"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-xl border border-zinc-700 bg-zinc-900"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-zinc-800 p-5">
                <div>
                  <h2 className="font-semibold text-zinc-100">
                    {modal.jogo.emoji_casa} {modal.jogo.time_casa} × {modal.jogo.time_fora} {modal.jogo.emoji_fora}
                  </h2>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {t('common.group')} {modal.jogo.grupo} · {formatarData(modal.jogo.data_jogo)}
                  </p>
                </div>
                <button onClick={fecharModal} className="text-zinc-600 hover:text-zinc-300">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Resultado */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">{t('admin.matches.result')}</p>
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl">{modal.jogo.emoji_casa}</span>
                      <span className="text-xs text-zinc-400">{modal.jogo.time_casa}</span>
                      <input
                        type="number" min={0} max={20} value={modal.gols_casa}
                        onChange={(e) => setModal((m) => m && { ...m, gols_casa: e.target.value })}
                        className="h-12 w-14 rounded-lg border border-zinc-700 bg-zinc-800 text-center text-xl font-bold text-zinc-100 outline-none focus:border-green-600"
                      />
                    </div>
                    <span className="text-xl font-bold text-zinc-600">×</span>
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-2xl">{modal.jogo.emoji_fora}</span>
                      <span className="text-xs text-zinc-400">{modal.jogo.time_fora}</span>
                      <input
                        type="number" min={0} max={20} value={modal.gols_fora}
                        onChange={(e) => setModal((m) => m && { ...m, gols_fora: e.target.value })}
                        className="h-12 w-14 rounded-lg border border-zinc-700 bg-zinc-800 text-center text-xl font-bold text-zinc-100 outline-none focus:border-green-600"
                      />
                    </div>
                  </div>

                  <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-lg bg-zinc-800 px-4 py-2.5">
                    <input
                      type="checkbox" checked={modal.encerrado}
                      onChange={(e) => setModal((m) => m && { ...m, encerrado: e.target.checked })}
                      className="h-4 w-4 rounded accent-green-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{t('admin.matches.markFinished')}</p>
                      <p className="text-xs text-zinc-500">{t('admin.matches.autoPoints')}</p>
                    </div>
                  </label>

                  <button
                    onClick={salvarResultado}
                    disabled={salvando}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-60"
                  >
                    {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t('admin.matches.saveResult')}
                  </button>
                </div>

                {/* Divisor */}
                <div className="border-t border-zinc-800" />

                {/* Eventos */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">{t('admin.matches.events')}</p>

                  {carregandoEventos ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
                    </div>
                  ) : (
                    <>
                      {/* Lista */}
                      {eventos.length > 0 && (
                        <div className="mb-3 space-y-1.5 max-h-40 overflow-y-auto">
                          {eventos.map((ev) => (
                            <div key={ev.id} className="flex items-center justify-between rounded-lg bg-zinc-800 px-3 py-2 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-500">{ev.minuto ? `${ev.minuto}'` : '—'}</span>
                                <span className="text-zinc-400">{t(`admin.matches.evType.${ev.tipo}`)}</span>
                                <span className="font-medium text-zinc-200">{ev.jogador}</span>
                                <span className="text-xs text-zinc-500">({ev.selecao})</span>
                              </div>
                              <button
                                onClick={() => removerEvento(ev.id)}
                                className="ml-2 rounded p-1 text-zinc-600 transition hover:text-red-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Formulário novo evento */}
                      <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 space-y-2">
                        <p className="text-xs text-zinc-500">{t('admin.matches.addEvent')}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={eventoForm.tipo}
                            onChange={(e) => setEventoForm((f) => ({ ...f, tipo: e.target.value as EventoJogo['tipo'] }))}
                            className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 outline-none focus:border-green-600"
                          >
                            <option value="gol">{t('admin.matches.evType.gol')}</option>
                            <option value="gol_contra">{t('admin.matches.evType.gol_contra')}</option>
                            <option value="assistencia">{t('admin.matches.evType.assistencia')}</option>
                          </select>
                          <input
                            type="number" min={1} max={120} placeholder={t('admin.matches.minute')}
                            value={eventoForm.minuto}
                            onChange={(e) => setEventoForm((f) => ({ ...f, minuto: e.target.value }))}
                            className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 outline-none focus:border-green-600 placeholder:text-zinc-600"
                          />
                        </div>
                        <input
                          type="text" placeholder={t('admin.matches.player')}
                          value={eventoForm.jogador}
                          onChange={(e) => setEventoForm((f) => ({ ...f, jogador: e.target.value }))}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 outline-none focus:border-green-600 placeholder:text-zinc-600"
                        />
                        <input
                          type="text" placeholder={t('admin.matches.team')}
                          value={eventoForm.selecao}
                          onChange={(e) => setEventoForm((f) => ({ ...f, selecao: e.target.value }))}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 outline-none focus:border-green-600 placeholder:text-zinc-600"
                        />
                        <button
                          onClick={adicionarEvento}
                          disabled={salvandoEvento || !eventoForm.jogador.trim() || !eventoForm.selecao.trim()}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-600 py-1.5 text-sm font-medium text-zinc-300 transition hover:border-green-600 hover:text-green-400 disabled:opacity-40"
                        >
                          {salvandoEvento ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                          {t('admin.matches.add')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-zinc-800 px-5 py-3">
                <button
                  onClick={fecharModal}
                  className="w-full rounded-lg border border-zinc-700 py-2 text-sm font-medium text-zinc-400 transition hover:border-zinc-600"
                >
                  {t('admin.common.close')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
