import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const KICKOFF = new Date('2026-06-11T16:00:00-03:00').getTime()

type TimeLeft = {
  dias: number
  horas: number
  min: number
  seg: number
  done: boolean
}

function getTimeLeft(): TimeLeft {
  const diff = Math.max(0, KICKOFF - Date.now())
  return {
    dias: Math.floor(diff / 86_400_000),
    horas: Math.floor(diff / 3_600_000) % 24,
    min: Math.floor(diff / 60_000) % 60,
    seg: Math.floor(diff / 1_000) % 60,
    done: diff === 0,
  }
}

function FlipUnit({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, '0')

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="glass relative h-16 w-14 overflow-hidden sm:h-24 sm:w-20">
        {/* Vinco horizontal do flip clock */}
        <div className="absolute top-1/2 right-0 left-0 z-10 h-px bg-black/60" />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={display}
            initial={{ rotateX: -90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={{ rotateX: 90, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center font-display text-4xl text-brasil-yellow sm:text-6xl"
            style={{ transformOrigin: 'center center', backfaceVisibility: 'hidden' }}
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[0.65rem] font-semibold tracking-[0.2em] text-zinc-500 uppercase sm:text-xs">
        {label}
      </span>
    </div>
  )
}

export function Countdown() {
  const [time, setTime] = useState<TimeLeft>(getTimeLeft)

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [])

  if (time.done) {
    return (
      <motion.p
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="font-display text-4xl tracking-wide sm:text-5xl"
      >
        <span className="bg-gradient-to-r from-brasil-green to-brasil-yellow bg-clip-text text-transparent">
          A Copa começou!
        </span>{' '}
        ⚽
      </motion.p>
    )
  }

  return (
    <div className="flex items-start gap-2 sm:gap-4">
      <FlipUnit value={time.dias} label="Dias" />
      <span className="mt-4 font-display text-3xl text-zinc-600 sm:mt-7 sm:text-5xl">:</span>
      <FlipUnit value={time.horas} label="Horas" />
      <span className="mt-4 font-display text-3xl text-zinc-600 sm:mt-7 sm:text-5xl">:</span>
      <FlipUnit value={time.min} label="Min" />
      <span className="mt-4 font-display text-3xl text-zinc-600 sm:mt-7 sm:text-5xl">:</span>
      <FlipUnit value={time.seg} label="Seg" />
    </div>
  )
}
