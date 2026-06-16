import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Navbar } from '../components/Navbar'
import { StoriesViewer, type StoryData } from '../components/StoriesViewer'
import { StoryHallVergonha } from '../components/stories/StoryHallVergonha'
import { StoryZebraDia } from '../components/stories/StoryZebraDia'
import { StoryVidente } from '../components/stories/StoryVidente'
import { StorySubiuAfundou } from '../components/stories/StorySubiuAfundou'
import { StoryCovarde } from '../components/stories/StoryCovarde'
import { StoryTelepata } from '../components/stories/StoryTelepata'
import { supabase } from '../lib/supabase'

function MiniCard({ story, onClick }: { story: StoryData; onClick: () => void }) {
  const dados = story.dados ?? {}
  const props = { titulo: story.titulo, conteudo: story.conteudo_ia, dados }

  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl transition hover:scale-[1.02] hover:shadow-xl"
      aria-label={`Abrir story: ${story.titulo}`}
    >
      <div className="scale-[0.42] origin-top-left" style={{ width: 400, height: 540 }}>
        {story.template === 'hall_vergonha'      && <StoryHallVergonha {...props} />}
        {story.template === 'zebra_dia'          && <StoryZebraDia {...props} />}
        {story.template === 'vidente_chutometro' && <StoryVidente {...props} />}
        {story.template === 'subiu_afundou'      && <StorySubiuAfundou {...props} />}
        {story.template === 'palpite_covarde'    && <StoryCovarde {...props} />}
        {story.template === 'telepata_rodada'    && <StoryTelepata {...props} />}
      </div>
      <div style={{ height: 227, width: 168 }} className="pointer-events-none" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />
      <span className="absolute bottom-2 left-2 right-2 truncate text-xs font-semibold text-white drop-shadow">
        {story.titulo}
      </span>
    </button>
  )
}

export function Stories() {
  const { t } = useTranslation()
  const [stories, setStories] = useState<StoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [viewerIdx, setViewerIdx] = useState<number | null>(null)

  useEffect(() => {
    // Stories expiram 24h após a publicação, igual ao Instagram.
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    supabase
      .from('stories')
      .select('id, template, titulo, conteudo_ia, dados, publicado_em')
      .eq('publicado', true)
      .gte('publicado_em', cutoff)
      .order('publicado_em', { ascending: false })
      .then(({ data }) => {
        setStories((data as StoryData[]) ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-4xl tracking-wide sm:text-5xl">
          {t('storiesPage.title')} <span className="text-brasil-yellow">{t('storiesPage.titleAccent')}</span>
        </h1>
        <p className="mt-3 text-zinc-400">{t('storiesPage.subtitle')}</p>

        <div className="mt-10">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-7 w-7 animate-spin text-zinc-600" />
            </div>
          ) : stories.length === 0 ? (
            <div className="glass p-10 text-center text-zinc-500">
              {t('storiesPage.empty')}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {stories.map((s, i) => (
                <MiniCard key={s.id} story={s} onClick={() => setViewerIdx(i)} />
              ))}
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {viewerIdx !== null && (
          <StoriesViewer
            stories={stories}
            initialIndex={viewerIdx}
            onClose={() => setViewerIdx(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
