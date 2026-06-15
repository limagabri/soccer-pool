import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.span
          className="block text-[96px] leading-none"
          animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          ⚽
        </motion.span>

        <h1 className="mt-6 font-display text-7xl tracking-wide text-brasil-yellow sm:text-8xl">
          404
        </h1>
        <p className="mt-3 text-xl font-semibold text-gray-800 dark:text-zinc-200">
          {t('notFound.headline')}
        </p>
        <p className="mt-2 text-gray-500 dark:text-zinc-500">
          {t('notFound.subtitle')}
        </p>

        <Link
          to="/"
          className="btn-gradient mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-black"
        >
          <Home className="h-4 w-4" />
          {t('notFound.back')}
        </Link>
      </motion.div>
    </div>
  )
}
