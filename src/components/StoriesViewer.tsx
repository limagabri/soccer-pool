import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Download, Share2, X } from 'lucide-react'
import html2canvas from 'html2canvas'
import { StoryHallVergonha } from './stories/StoryHallVergonha'
import { StoryZebraDia } from './stories/StoryZebraDia'
import { StoryVidente } from './stories/StoryVidente'
import { StorySubiuAfundou } from './stories/StorySubiuAfundou'
import { StoryCovarde } from './stories/StoryCovarde'
import { StoryTelepata } from './stories/StoryTelepata'

export interface StoryData {
  id: string
  template: string
  titulo: string
  conteudo_ia: string
  dados: Record<string, unknown> | null
  publicado_em: string | null
}

interface Props {
  stories: StoryData[]
  initialIndex?: number
  onClose: () => void
}

function StoryCard({ story }: { story: StoryData }) {
  const dados = story.dados ?? {}
  const props = { titulo: story.titulo, conteudo: story.conteudo_ia, dados }
  switch (story.template) {
    case 'hall_vergonha':      return <StoryHallVergonha {...props} />
    case 'zebra_dia':          return <StoryZebraDia {...props} />
    case 'vidente_chutometro': return <StoryVidente {...props} />
    case 'subiu_afundou':      return <StorySubiuAfundou {...props} />
    case 'palpite_covarde':    return <StoryCovarde {...props} />
    case 'telepata_rodada':    return <StoryTelepata {...props} />
    default:
      return (
        <div className="flex h-[400px] w-[400px] items-center justify-center rounded-2xl bg-zinc-800 p-6 text-center">
          <div>
            <p className="text-2xl font-bold text-zinc-100">{story.titulo}</p>
            <p className="mt-3 text-sm text-zinc-400">{story.conteudo_ia}</p>
          </div>
        </div>
      )
  }
}

export function StoriesViewer({ stories, initialIndex = 0, onClose }: Props) {
  const [idx, setIdx] = useState(initialIndex)
  const cardRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const [progressKey, setProgressKey] = useState(0)
  const [paused, setPaused] = useState(false)

  const story = stories[idx]

  const next = useCallback(() => {
    setPaused(false)
    if (idx < stories.length - 1) {
      setIdx(i => i + 1)
      setProgressKey(k => k + 1)
    } else {
      onClose()
    }
  }, [idx, stories.length, onClose])

  const prev = useCallback(() => {
    setPaused(false)
    if (idx > 0) {
      setIdx(i => i - 1)
      setProgressKey(k => k + 1)
    }
  }, [idx])

  // Keyboard navigation
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'Escape')     onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [next, prev, onClose])

  async function baixar() {
    if (!cardRef.current) return
    const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 2 })
    const link = document.createElement('a')
    link.download = `story-${story.template}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  function compartilharWhatsApp() {
    const text = encodeURIComponent(`${story.titulo}\n\n${story.conteudo_ia}\n\nBolãoCopa 2026 ⚽`)
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener')
  }

  if (!story) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="relative w-full max-w-sm px-4" onClick={e => e.stopPropagation()}>
        {/* Progress bars — CSS animation para permitir pausar (segurar) */}
        <div className="mb-3 flex gap-1">
          {stories.map((_, i) => (
            <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/20">
              {i < idx ? (
                <div className="h-full w-full bg-white" />
              ) : i === idx ? (
                <div
                  key={`active-${idx}-${progressKey}`}
                  className="h-full bg-white"
                  style={{
                    animation: 'storyProgress 8s linear forwards',
                    animationPlayState: paused ? 'paused' : 'running',
                  }}
                  onAnimationEnd={next}
                />
              ) : null}
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">👴🏽</span>
            <div>
              <p className="text-xs font-bold text-white">Seu Zé</p>
              {story.publicado_em && (
                <p className="text-[10px] text-zinc-400">
                  {new Date(story.publicado_em).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={compartilharWhatsApp}
              className="rounded-full p-1.5 text-zinc-300 transition hover:bg-white/10 hover:text-white"
              title="Compartilhar no WhatsApp">
              <Share2 className="h-4 w-4" />
            </button>
            <button onClick={baixar}
              className="rounded-full p-1.5 text-zinc-300 transition hover:bg-white/10 hover:text-white"
              title="Baixar como PNG">
              <Download className="h-4 w-4" />
            </button>
            <button onClick={onClose}
              className="rounded-full p-1.5 text-zinc-300 transition hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={story.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.25 }}
            ref={cardRef}
            className="mx-auto w-fit cursor-pointer select-none"
            onPointerDown={() => setPaused(true)}
            onPointerUp={() => setPaused(false)}
            onPointerLeave={() => setPaused(false)}
            onPointerCancel={() => setPaused(false)}
            onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
            onTouchEnd={e => {
              const dx = e.changedTouches[0].clientX - touchStartX.current
              if (dx > 50) prev()
              else if (dx < -50) next()
            }}
          >
            <StoryCard story={story} />
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={prev}
            disabled={idx === 0}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex flex-col items-center leading-tight">
            <span className="text-xs text-zinc-400">{idx + 1} / {stories.length}</span>
            <span className="text-[10px] text-zinc-600">segure para pausar</span>
          </div>
          <button
            onClick={next}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
