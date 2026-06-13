import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const STORAGE_KEY = 'pwa-install-dismissed'

export function InstalarPWA() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
      setVisivel(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function instalar() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') localStorage.setItem(STORAGE_KEY, '1')
    setVisivel(false)
  }

  function fechar() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisivel(false)
  }

  return (
    <AnimatePresence>
      {visivel && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2"
        >
          <div className="glass flex items-center gap-3 px-4 py-3 shadow-lg">
            <span className="text-xl">📱</span>
            <p className="flex-1 text-sm font-medium text-gray-800 dark:text-zinc-200">
              Instale o BolãoCopa no seu celular
            </p>
            <button
              onClick={instalar}
              className="btn-gradient flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-black"
            >
              <Download className="h-3.5 w-3.5" />
              Instalar
            </button>
            <button
              onClick={fechar}
              className="rounded-lg p-1 text-gray-400 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
