import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, Share, Plus, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Window {
    __pwaInstallPrompt: BeforeInstallPromptEvent | null
  }
}

const STORAGE_KEY = 'pwa-install-dismissed'

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari exposes standalone on navigator, not via media query
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIOS(): boolean {
  const ua = window.navigator.userAgent
  const iOSDevice = /iphone|ipad|ipod/i.test(ua)
  // iPadOS 13+ masquerades as Mac; detect touch + Mac as fallback
  const iPadOS = /macintosh/i.test(ua) && navigator.maxTouchPoints > 1
  return iOSDevice || iPadOS
}

export function InstalarPWA() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visivel, setVisivel] = useState(false)
  const [modoIOS, setModoIOS] = useState(false)
  const [modoManual, setModoManual] = useState(false)

  useEffect(() => {
    // Já instalado (rodando como app) → não mostra nada
    if (isStandalone()) return
    // Usuário já dispensou o banner antes
    if (localStorage.getItem(STORAGE_KEY)) return

    // iOS/Safari nunca dispara `beforeinstallprompt`. Mostramos instruções
    // manuais de "Adicionar à Tela de Início".
    if (isIOS()) {
      setModoIOS(true)
      setVisivel(true)
      return
    }

    // Android/desktop: o evento pode ter sido capturado pelo index.html antes
    // do React montar. Verificamos imediatamente e também escutamos futuros.
    const mostrar = () => {
      const capturado = window.__pwaInstallPrompt
      if (capturado) {
        setPrompt(capturado)
        setVisivel(true)
      }
    }
    mostrar()
    window.addEventListener('pwa-install-available', mostrar)

    const aoInstalar = () => setVisivel(false)
    window.addEventListener('pwa-installed', aoInstalar)

    return () => {
      window.removeEventListener('pwa-install-available', mostrar)
      window.removeEventListener('pwa-installed', aoInstalar)
    }
  }, [])

  async function instalar() {
    // Usa o evento do state ou o capturado cedo no index.html.
    const p = prompt ?? window.__pwaInstallPrompt
    if (!p) {
      // Chrome não disponibilizou o prompt nativo (ou já foi usado): em vez de
      // não fazer nada, mostramos como instalar pelo menu do navegador.
      setModoManual(true)
      return
    }
    try {
      await p.prompt()
      const choice = await p.userChoice
      if (choice?.outcome === 'accepted') localStorage.setItem(STORAGE_KEY, '1')
      window.__pwaInstallPrompt = null
      setPrompt(null)
      setVisivel(false)
    } catch {
      // prompt() falhou (evento expirado, etc.) → instruções manuais.
      setModoManual(true)
    }
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
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm"
        >
          <div className="glass px-4 py-3 shadow-lg">
            {(modoIOS || modoManual) ? (
              <div className="flex items-start gap-3">
                <span className="text-xl">📱</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">
                    Instale o BolãoCopa 2026 no seu celular
                  </p>
                  {modoIOS ? (
                    <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-gray-600 dark:text-zinc-400">
                      Toque em
                      <Share className="inline h-3.5 w-3.5 text-blue-500" />
                      <span className="font-semibold">Compartilhar</span>
                      e depois
                      <Plus className="inline h-3.5 w-3.5" />
                      <span className="font-semibold">Adicionar à Tela de Início</span>
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-600 dark:text-zinc-400">
                      Abra o menu <span className="font-semibold">⋮</span> do Chrome e toque em{' '}
                      <span className="font-semibold">Instalar app</span> (ou{' '}
                      <span className="font-semibold">Adicionar à tela inicial</span>).
                    </p>
                  )}
                </div>
                <button
                  onClick={fechar}
                  className="rounded-lg p-1 text-gray-400 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xl">📱</span>
                <p className="flex-1 text-sm font-medium text-gray-800 dark:text-zinc-200">
                  Instale o BolãoCopa 2026 no seu celular
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
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
