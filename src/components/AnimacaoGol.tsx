import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useGolRealtime } from '../hooks/useGolRealtime'
import { useJogos } from '../hooks/useJogos'

function tocarSomGol() {
  const ctx = new AudioContext()
  const notas = [261, 329, 392, 523, 659, 784]

  notas.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.frequency.value = freq
    osc.type = 'square'

    const start = ctx.currentTime + i * 0.08
    const end = start + 0.15

    gain.gain.setValueAtTime(0.3, start)
    gain.gain.exponentialRampToValueAtTime(0.001, end)

    osc.start(start)
    osc.stop(end)
  })
}

export function AnimacaoGol() {
  const { novoGol, limparGol } = useGolRealtime()
  const { jogos } = useJogos()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const jogo = novoGol ? jogos.find(j => j.id === novoGol.jogo_id) : null

  useEffect(() => {
    if (!novoGol) return

    confetti({
      particleCount: 160,
      spread: 100,
      origin: { y: 0.55 },
      colors: ['#00c853', '#ffd600', '#ffffff', '#1565C0', '#e53935'],
    })
    // Second burst offset
    setTimeout(() =>
      confetti({ particleCount: 80, spread: 60, origin: { x: 0.2, y: 0.6 } }), 250
    )
    setTimeout(() =>
      confetti({ particleCount: 80, spread: 60, origin: { x: 0.8, y: 0.6 } }), 400
    )

    tocarSomGol()

    timerRef.current = setTimeout(limparGol, 4000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novoGol?.id])

  return (
    <AnimatePresence>
      {novoGol && (
        <motion.div
          key="gol-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={limparGol}
        >
          <motion.div
            initial={{ scale: 0.4, y: 60 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
            onClick={e => e.stopPropagation()}
            className="relative mx-4 w-full max-w-sm overflow-hidden rounded-2xl border border-brasil-green/50 bg-zinc-900/98 p-8 text-center shadow-[0_0_60px_rgba(0,200,83,0.3)]"
          >
            <button
              onClick={limparGol}
              className="absolute right-3 top-3 rounded-full p-1.5 text-zinc-500 transition hover:text-zinc-200"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>

            <motion.div
              animate={{ rotate: [0, -20, 20, -12, 12, -5, 5, 0], scale: [1, 1.3, 1] }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-7xl"
            >
              ⚽
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-3 font-display text-6xl tracking-widest text-brasil-green"
            >
              GOL!
            </motion.h2>

            {novoGol.tipo === 'gol_contra' && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="mt-0.5 block text-sm font-semibold text-red-400"
              >
                Gol contra
              </motion.span>
            )}

            {novoGol.jogador && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-2 text-lg font-semibold text-zinc-100"
              >
                {novoGol.jogador}
                {novoGol.minuto ? (
                  <span className="ml-2 text-sm text-zinc-400">{novoGol.minuto}'</span>
                ) : null}
              </motion.p>
            )}

            {jogo && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45 }}
                className="mt-4"
              >
                <p className="font-display text-3xl text-brasil-yellow">
                  {jogo.emoji_casa} {jogo.gols_casa ?? 0} × {jogo.gols_fora ?? 0} {jogo.emoji_fora}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {jogo.time_casa} × {jogo.time_fora}
                </p>
              </motion.div>
            )}

            {/* Progress bar */}
            <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full bg-brasil-green"
                initial={{ scaleX: 1, originX: 0 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 4, ease: 'linear' }}
                style={{ transformOrigin: 'left' }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
