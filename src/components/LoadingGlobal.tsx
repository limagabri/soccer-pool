import { motion } from 'framer-motion'
import { APP_CONFIG } from '../config/app'

export function LoadingGlobal() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-pitch">
      <motion.div
        className="relative flex h-16 w-16 items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute inset-0 rounded-full border-4 border-brasil-green/30" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brasil-green" />
        <span className="text-2xl">⚽</span>
      </motion.div>
      <p className="font-display text-lg tracking-widest text-brasil-green">{APP_CONFIG.name}</p>
    </div>
  )
}
