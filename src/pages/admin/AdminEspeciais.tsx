import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Award, Loader2, RefreshCw, Shield, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'

interface ResultadoForm {
  id: string | null
  campeao: string
  vice_campeao: string
  terceiro: string
  artilheiro: string
  melhor_jogador: string
  melhor_defesa: string
  finalizado: boolean
}

const VAZIO: ResultadoForm = {
  id: null, campeao: '', vice_campeao: '', terceiro: '',
  artilheiro: '', melhor_jogador: '', melhor_defesa: '', finalizado: false,
}

const INPUT =
  'w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-green-500 placeholder:text-zinc-600'

export function AdminEspeciais() {
  const { t } = useTranslation()
  const [form, setForm] = useState<ResultadoForm>(VAZIO)
  const [melhorDefesaAuto, setMelhorDefesaAuto] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [finalizando, setFinalizando] = useState(false)
  const [feedback, setFeedback] = useState<{ msg: string; erro: boolean } | null>(null)

  useEffect(() => {
    async function carregar() {
      const [{ data: res }, { data: jogos }] = await Promise.all([
        supabase.from('resultados_especiais').select('*').limit(1).maybeSingle(),
        supabase.from('jogos').select('time_casa, time_fora, gols_casa, gols_fora').eq('encerrado', true),
      ])

      if (res) {
        setForm({
          id: res.id,
          campeao: res.campeao ?? '',
          vice_campeao: res.vice_campeao ?? '',
          terceiro: res.terceiro ?? '',
          artilheiro: res.artilheiro ?? '',
          melhor_jogador: res.melhor_jogador ?? '',
          melhor_defesa: res.melhor_defesa ?? '',
          finalizado: res.finalizado ?? false,
        })
      }

      if (jogos && jogos.length > 0) {
        const sofridos: Record<string, number> = {}
        for (const j of jogos) {
          if (j.gols_casa == null || j.gols_fora == null) continue
          sofridos[j.time_casa] = (sofridos[j.time_casa] ?? 0) + j.gols_fora
          sofridos[j.time_fora] = (sofridos[j.time_fora] ?? 0) + j.gols_casa
        }
        const melhor = Object.entries(sofridos).sort((a, b) => a[1] - b[1])[0]
        if (melhor) setMelhorDefesaAuto(`${melhor[0]} (${t('admin.specials.goalsConceded', { n: melhor[1] })})`)
      }

      setLoading(false)
    }
    carregar()
  }, [])

  async function salvar() {
    setSalvando(true)
    setFeedback(null)
    const payload = {
      campeao: form.campeao,
      vice_campeao: form.vice_campeao,
      terceiro: form.terceiro,
      artilheiro: form.artilheiro,
      melhor_jogador: form.melhor_jogador,
      melhor_defesa: form.melhor_defesa,
      finalizado: form.finalizado,
    }
    let error
    if (form.id) {
      ;({ error } = await supabase.from('resultados_especiais').update(payload).eq('id', form.id))
    } else {
      const { data, error: e } = await supabase.from('resultados_especiais').insert(payload).select().single()
      if (data) setForm((f) => ({ ...f, id: (data as { id: string }).id }))
      error = e
    }
    setSalvando(false)
    setFeedback(error ? { msg: t('admin.specials.saveError'), erro: true } : { msg: t('admin.specials.saveOk'), erro: false })
    setTimeout(() => setFeedback(null), 3000)
  }

  async function finalizar() {
    if (!window.confirm(t('admin.specials.confirmFinalize'))) return
    setFinalizando(true)
    setFeedback(null)

    // Salvar com finalizado=true
    const payload = {
      campeao: form.campeao, vice_campeao: form.vice_campeao,
      terceiro: form.terceiro, artilheiro: form.artilheiro,
      melhor_jogador: form.melhor_jogador, melhor_defesa: form.melhor_defesa,
      finalizado: true,
    }
    if (form.id) {
      await supabase.from('resultados_especiais').update(payload).eq('id', form.id)
    } else {
      const { data } = await supabase.from('resultados_especiais').insert(payload).select().single()
      if (data) setForm((f) => ({ ...f, id: (data as { id: string }).id }))
    }

    // Calcular pontos especiais via RPC
    const { error } = await supabase.rpc('calcular_pontos_especiais')
    setFinalizando(false)
    setForm((f) => ({ ...f, finalizado: true }))
    setFeedback(error ? { msg: t('admin.specials.calcError', { msg: error.message }), erro: true } : { msg: t('admin.specials.finalizedOk'), erro: false })
    setTimeout(() => setFeedback(null), 5000)
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{t('admin.specials.title')}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t('admin.specials.subtitle')}</p>
        </div>
        {form.finalizado && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-900/30 px-3 py-1 text-sm font-medium text-green-400">
            <Trophy className="h-4 w-4" /> {t('admin.specials.cupFinalized')}
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulário */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 font-semibold text-zinc-200">{t('admin.specials.results')}</h2>
          <div className="space-y-4">
            {[
              { key: 'campeao', emoji: '🏆', tk: 'champion', pts: 30 },
              { key: 'vice_campeao', emoji: '🥈', tk: 'runnerUp', pts: 15 },
              { key: 'terceiro', emoji: '🥉', tk: 'third', pts: 10 },
              { key: 'artilheiro', emoji: '⚽', tk: 'topScorer', pts: 20 },
              { key: 'melhor_jogador', emoji: '🌟', tk: 'bestPlayer', pts: 15 },
            ].map(({ key, emoji, tk, pts }) => (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-300">{emoji} {t(`admin.specials.${tk}`)}</label>
                  <span className="text-xs text-green-500">+{pts} pts</span>
                </div>
                <input
                  type="text"
                  value={form[key as keyof ResultadoForm] as string}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={key === 'artilheiro' || key === 'melhor_jogador' ? t('admin.specials.playerName') : t('admin.specials.teamName')}
                  className={INPUT}
                  disabled={form.finalizado}
                />
              </div>
            ))}

            {/* Melhor defesa (auto-calculada) */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-300">
                  <Shield className="mr-1 inline h-3.5 w-3.5" /> {t('admin.specials.bestDefense')}
                </label>
                <span className="text-xs text-zinc-500">{t('admin.specials.autoCalc')}</span>
              </div>
              {melhorDefesaAuto && (
                <div className="mb-2 flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-400">
                  <RefreshCw className="h-3.5 w-3.5 text-green-500" />
                  {t('admin.specials.basedOn')} <span className="font-medium text-zinc-200">{melhorDefesaAuto}</span>
                </div>
              )}
              <input
                type="text"
                value={form.melhor_defesa}
                onChange={(e) => setForm((f) => ({ ...f, melhor_defesa: e.target.value }))}
                placeholder={t('admin.specials.confirmAdjust')}
                className={INPUT}
                disabled={form.finalizado}
              />
            </div>
          </div>

          {feedback && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`mt-4 rounded-lg px-3 py-2 text-sm ${
                feedback.erro ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
              }`}
            >
              {feedback.msg}
            </motion.p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={salvar}
              disabled={salvando || form.finalizado}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-700 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-zinc-600 disabled:opacity-50"
            >
              {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('admin.specials.saveDraft')}
            </button>
            <button
              onClick={finalizar}
              disabled={finalizando || form.finalizado || !form.campeao}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-50"
            >
              {finalizando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
              {t('admin.specials.finalizeCup')}
            </button>
          </div>
        </div>

        {/* Pontuação de referência */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 font-semibold text-zinc-200">{t('admin.specials.pointsTable')}</h2>
          <div className="space-y-3">
            {[
              { emoji: '🏆', tk: 'refChampion', pts: 30 },
              { emoji: '⚽', tk: 'refTopScorer', pts: 20 },
              { emoji: '🌟', tk: 'refBestPlayer', pts: 15 },
              { emoji: '🥈', tk: 'refRunnerUp', pts: 15 },
              { emoji: '🥉', tk: 'refThird', pts: 10 },
            ].map(({ emoji, tk, pts }) => (
              <div key={tk} className="flex items-center justify-between rounded-lg bg-zinc-800 px-4 py-3">
                <span className="text-sm text-zinc-300">{emoji} {t(`admin.specials.${tk}`)}</span>
                <span className="font-mono font-bold text-green-400">+{pts}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-zinc-600">
            {t('admin.specials.tableHint')}
          </p>
        </div>
      </div>
    </>
  )
}
