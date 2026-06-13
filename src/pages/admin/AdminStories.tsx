import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Loader2, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { StoriesViewer, type StoryData } from '../../components/StoriesViewer'
import { StoryHallVergonha } from '../../components/stories/StoryHallVergonha'
import { StoryZebraDia } from '../../components/stories/StoryZebraDia'
import { StoryVidente } from '../../components/stories/StoryVidente'
import { StorySubiuAfundou } from '../../components/stories/StorySubiuAfundou'
import { StoryCovarde } from '../../components/stories/StoryCovarde'
import { StoryTelepata } from '../../components/stories/StoryTelepata'

const TEMPLATES = [
  { value: 'hall_vergonha',      label: 'Hall da Vergonha',       icon: '🏆', desc: 'Pior palpite do dia' },
  { value: 'zebra_dia',          label: 'Zebra do Dia',            icon: '🦓', desc: 'Quem acertou o resultado mais improvável' },
  { value: 'vidente_chutometro', label: 'Vidente ou Chutômetro?',  icon: '🔮', desc: 'Comparação de acertos vs erros' },
  { value: 'subiu_afundou',      label: 'Subiu / Afundou',         icon: '📈', desc: 'Maiores variações no ranking' },
  { value: 'palpite_covarde',    label: 'Palpite Covarde',         icon: '🐔', desc: 'Quem chutou mais 0x0 e 1x0' },
  { value: 'telepata_rodada',    label: 'Telepata da Rodada',      icon: '🧠', desc: 'Mais acertos de placar exato' },
]

function PreviewCard({ story }: { story: StoryData }) {
  const dados = story.dados ?? {}
  const props = { titulo: story.titulo, conteudo: story.conteudo_ia, dados }
  switch (story.template) {
    case 'hall_vergonha':      return <StoryHallVergonha {...props} />
    case 'zebra_dia':          return <StoryZebraDia {...props} />
    case 'vidente_chutometro': return <StoryVidente {...props} />
    case 'subiu_afundou':      return <StorySubiuAfundou {...props} />
    case 'palpite_covarde':    return <StoryCovarde {...props} />
    case 'telepata_rodada':    return <StoryTelepata {...props} />
    default: return null
  }
}

export function AdminStories() {
  const [stories, setStories] = useState<StoryData[]>([])
  const [gerando, setGerando] = useState<string | null>(null)
  const [preview, setPreview] = useState<StoryData | null>(null)
  const [editando, setEditando] = useState('')
  const [viewerIdx, setViewerIdx] = useState<number | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data } = await supabase
      .from('stories')
      .select('id, template, titulo, conteudo_ia, dados, publicado, publicado_em, criado_em')
      .order('criado_em', { ascending: false })
    setStories((data as (StoryData & { publicado: boolean; criado_em: string })[]) ?? [])
  }

  async function gerar(template: string) {
    setGerando(template)
    setErro('')
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gerar-story`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? ''}`,
      },
      body: JSON.stringify({ template }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setErro(err.error ?? 'Erro ao gerar story.')
      setGerando(null)
      return
    }
    const data = await res.json()
    const novo: StoryData = {
      id: data.id,
      template,
      titulo: data.titulo,
      conteudo_ia: data.conteudo_ia,
      dados: data.dados,
      publicado_em: null,
    }
    setPreview(novo)
    setEditando(data.conteudo_ia)
    carregar()
    setGerando(null)
  }

  async function publicar(id: string, conteudo: string) {
    await supabase
      .from('stories')
      .update({ conteudo_ia: conteudo, publicado: true, publicado_em: new Date().toISOString() })
      .eq('id', id)
    carregar()
    setPreview(null)
  }

  async function despublicar(id: string) {
    await supabase.from('stories').update({ publicado: false, publicado_em: null }).eq('id', id)
    carregar()
  }

  const publishedStories = stories.filter(s => (s as StoryData & { publicado: boolean }).publicado)

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-zinc-100">Stories Cômicos</h1>

      {erro && <p className="rounded-lg border border-red-700/40 bg-red-900/20 px-4 py-2 text-sm text-red-400">{erro}</p>}

      {/* Template buttons */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {TEMPLATES.map(t => (
          <button
            key={t.value}
            onClick={() => gerar(t.value)}
            disabled={gerando === t.value}
            className="flex flex-col gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-left transition hover:border-green-700/60 hover:bg-zinc-800 disabled:opacity-60"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{t.icon}</span>
              {gerando === t.value && <Loader2 className="h-4 w-4 animate-spin text-green-500" />}
              {gerando !== t.value && <RefreshCw className="h-3.5 w-3.5 text-zinc-600" />}
            </div>
            <p className="text-sm font-semibold text-zinc-200">{t.label}</p>
            <p className="text-xs text-zinc-500">{t.desc}</p>
          </button>
        ))}
      </div>

      {/* Preview */}
      {preview && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300">Preview — {preview.titulo}</h2>
          <div className="flex justify-center">
            <div className="scale-75 origin-top">
              <PreviewCard story={{ ...preview, conteudo_ia: editando }} />
            </div>
          </div>
          <textarea
            value={editando}
            onChange={e => setEditando(e.target.value)}
            rows={4}
            className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-green-600"
          />
          <div className="flex gap-3">
            <button
              onClick={() => publicar(preview.id, editando)}
              className="rounded-lg bg-brasil-green/80 px-4 py-2 text-sm font-semibold text-black hover:bg-brasil-green"
            >
              Publicar
            </button>
            <button onClick={() => gerar(preview.template)} disabled={!!gerando} className="text-sm text-zinc-400 hover:text-zinc-200">
              Regenerar
            </button>
            <button onClick={() => setPreview(null)} className="text-sm text-zinc-600 hover:text-zinc-400">
              Descartar
            </button>
          </div>
        </div>
      )}

      {/* Published */}
      {publishedStories.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">Publicados</h2>
            <button onClick={() => setViewerIdx(0)} className="text-xs text-brasil-green hover:underline">
              Ver como stories →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {publishedStories.map(s => {
              const tpl = TEMPLATES.find(t => t.value === s.template)
              return (
                <div key={s.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{tpl?.icon} {tpl?.label ?? s.template}</span>
                    <button onClick={() => despublicar(s.id)} className="text-[10px] text-red-500 hover:text-red-400">
                      Despublicar
                    </button>
                  </div>
                  <p className="line-clamp-3 text-xs text-zinc-500">{s.conteudo_ia}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {viewerIdx !== null && publishedStories.length > 0 && (
          <StoriesViewer
            stories={publishedStories}
            initialIndex={viewerIdx}
            onClose={() => setViewerIdx(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
