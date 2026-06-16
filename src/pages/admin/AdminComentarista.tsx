import { useEffect, useState } from 'react'
import { Loader2, RefreshCw, Send, Eye } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { ComentaristaCard } from '../../components/ComentaristaCard'

interface ComentarioIA {
  id: string
  tipo: string
  numero_rodada: number | null
  conteudo: string
  publicado: boolean
  gerado_em: string
  publicado_em: string | null
}

const TIPOS = [
  { value: 'rodada_grupos',  rodadas: [1, 2, 3] },
  { value: 'rodada_32avos',  rodadas: [] },
  { value: 'rodada_oitavas', rodadas: [] },
  { value: 'rodada_quartas', rodadas: [] },
  { value: 'rodada_semis',   rodadas: [] },
  { value: 'rodada_final',   rodadas: [] },
]

export function AdminComentarista() {
  const { t } = useTranslation()
  const [historico, setHistorico] = useState<ComentarioIA[]>([])
  const [tipo, setTipo] = useState('rodada_grupos')
  const [rodada, setRodada] = useState(1)
  const [gerando, setGerando] = useState(false)
  const [publicando, setPublicando] = useState<string | null>(null)
  const [preview, setPreview] = useState<ComentarioIA | null>(null)
  const [editando, setEditando] = useState('')
  const [erro, setErro] = useState('')

  const tipoAtual = TIPOS.find(tp => tp.value === tipo)!

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data } = await supabase
      .from('comentarios_ia')
      .select('id, tipo, numero_rodada, conteudo, publicado, gerado_em, publicado_em')
      .order('gerado_em', { ascending: false })
    setHistorico((data as ComentarioIA[]) ?? [])
  }

  async function gerar() {
    setGerando(true)
    setErro('')
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-comentarista`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? ''}`,
      },
      body: JSON.stringify({ tipo, numero_rodada: tipoAtual.rodadas.length > 0 ? rodada : undefined }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setErro(err.error ?? t('admin.pundit.genError'))
      setGerando(false)
      return
    }
    const data = await res.json()
    const novo: ComentarioIA = {
      id: data.id,
      tipo,
      numero_rodada: tipoAtual.rodadas.length > 0 ? rodada : null,
      conteudo: data.conteudo,
      publicado: false,
      gerado_em: new Date().toISOString(),
      publicado_em: null,
    }
    setPreview(novo)
    setEditando(data.conteudo)
    carregar()
    setGerando(false)
  }

  async function publicar(id: string, conteudo: string) {
    setPublicando(id)
    await supabase
      .from('comentarios_ia')
      .update({ conteudo, publicado: true, publicado_em: new Date().toISOString() })
      .eq('id', id)
    await carregar()
    setPreview(null)
    setPublicando(null)
  }

  async function despublicar(id: string) {
    await supabase.from('comentarios_ia').update({ publicado: false, publicado_em: null }).eq('id', id)
    carregar()
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-zinc-100">{t('admin.pundit.title')}</h1>

      {/* Generator */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
        <h2 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">{t('admin.pundit.generateComment')}</h2>

        <div className="flex flex-wrap gap-3">
          <select
            value={tipo}
            onChange={e => setTipo(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-green-600"
          >
            {TIPOS.map(tp => <option key={tp.value} value={tp.value}>{t(`admin.pundit.types.${tp.value}`)}</option>)}
          </select>

          {tipoAtual.rodadas.length > 0 && (
            <select
              value={rodada}
              onChange={e => setRodada(Number(e.target.value))}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-green-600"
            >
              {tipoAtual.rodadas.map(r => <option key={r} value={r}>{t('common.round')} {r}</option>)}
            </select>
          )}

          <button
            onClick={gerar}
            disabled={gerando}
            className="flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-60"
          >
            {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {preview ? t('admin.pundit.regenerate') : t('admin.pundit.generateAI')}
          </button>
        </div>

        {erro && <p className="text-sm text-red-400">{erro}</p>}

        {preview && (
          <div className="space-y-3">
            <ComentaristaCard conteudo={editando} publicado_em={null} />
            <details className="group">
              <summary className="cursor-pointer select-none text-xs text-zinc-600 hover:text-zinc-400">
                {t('admin.pundit.adjustText')}
              </summary>
              <textarea
                value={editando}
                onChange={e => setEditando(e.target.value)}
                rows={5}
                className="mt-2 w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-400 outline-none focus:border-zinc-600"
                placeholder={t('admin.pundit.editPlaceholder')}
              />
            </details>
            <div className="flex gap-3">
              <button
                onClick={() => publicar(preview.id, editando)}
                disabled={!!publicando}
                className="flex items-center gap-2 rounded-lg bg-brasil-green/80 px-4 py-2 text-sm font-semibold text-black transition hover:bg-brasil-green disabled:opacity-60"
              >
                {publicando === preview.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {t('admin.pundit.publish')}
              </button>
              <button onClick={() => setPreview(null)} className="text-sm text-zinc-500 hover:text-zinc-300">
                {t('admin.pundit.discard')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">{t('admin.pundit.history')}</h2>
        {historico.length === 0 ? (
          <p className="text-sm text-zinc-600">{t('admin.pundit.empty')}</p>
        ) : (
          historico.map(c => (
            <div key={c.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.publicado ? 'bg-green-900/40 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
                    {c.publicado ? t('admin.pundit.published') : t('admin.pundit.draft')}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {t(`admin.pundit.types.${c.tipo}`)}
                    {c.numero_rodada ? ` R${c.numero_rodada}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {!c.publicado && (
                    <button
                      onClick={() => { setPreview(c); setEditando(c.conteudo) }}
                      className="flex items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                    >
                      <Eye className="h-3 w-3" /> {t('admin.common.edit')}
                    </button>
                  )}
                  {c.publicado ? (
                    <button onClick={() => despublicar(c.id)} className="text-xs text-red-500 hover:text-red-400">
                      {t('admin.pundit.unpublish')}
                    </button>
                  ) : (
                    <button
                      onClick={() => publicar(c.id, c.conteudo)}
                      disabled={!!publicando}
                      className="text-xs text-green-400 hover:text-green-300"
                    >
                      {t('admin.pundit.publish')}
                    </button>
                  )}
                </div>
              </div>
              <p className="line-clamp-3 text-xs leading-relaxed text-zinc-400">{c.conteudo}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
