import { motion } from 'framer-motion'

/* Brilhos verde/amarelo animados nas bordas da tela das páginas de auth */
export function AuthBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <motion.div
        className="absolute -top-48 -left-48 h-[28rem] w-[28rem] rounded-full bg-brasil-green/20 blur-3xl"
        animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-48 -bottom-48 h-[28rem] w-[28rem] rounded-full bg-brasil-yellow/15 blur-3xl"
        animate={{ x: [0, -60, 0], y: [0, -40, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.div
        className="absolute top-1/2 -right-32 h-72 w-72 -translate-y-1/2 rounded-full bg-brasil-green/10 blur-3xl"
        animate={{ y: [0, -80, 0], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />
    </div>
  )
}
