import { Link } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { Trophy, Target, BarChart3, ArrowRight, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Logo } from '../components/Logo'
import { Particles } from '../components/Particles'
import { Countdown } from '../components/Countdown'
import { APP_CONFIG, APP_FULL_NAME } from '../config/app'

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
}

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const FEATURE_KEYS = ['predict', 'points', 'ranking'] as const
const FEATURE_ICONS = [Target, BarChart3, Trophy]

export function Landing() {
  const { t } = useTranslation()
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Brilhos de fundo verde/amarelo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-brasil-green/15 blur-3xl" />
        <div className="absolute -right-40 -bottom-40 h-[32rem] w-[32rem] rounded-full bg-brasil-yellow/10 blur-3xl" />
      </div>
      <Particles />

      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 md:px-12">
        <Logo />
        <nav className="flex items-center gap-3">
          <span className="hidden text-xs text-zinc-600 sm:block">{t('landing.inviteOnly')}</span>
          <Link
            to="/login"
            className="btn-gradient rounded-lg px-4 py-2 text-sm font-semibold text-black"
          >
            {t('nav.login')}
          </Link>
        </nav>
      </header>

      {/* Hero fullscreen */}
      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-center"
      >
        <motion.span
          variants={item}
          className="glass mb-8 px-4 py-1.5 text-sm font-medium text-brasil-yellow"
        >
          ⚽ {t('landing.tagline')}
        </motion.span>

        <motion.h1
          variants={item}
          className="font-display leading-[0.9] tracking-wide text-[clamp(4.5rem,15vw,8rem)] md:text-[clamp(8rem,13vw,12rem)]"
        >
          {APP_CONFIG.name}{' '}
          <span className="bg-gradient-to-r from-brasil-green via-brasil-green-light to-brasil-yellow bg-clip-text text-transparent">
            {APP_CONFIG.year}
          </span>
        </motion.h1>

        <motion.p
          variants={item}
          className="mt-4 max-w-xl text-lg text-zinc-400 md:text-xl"
        >
          {t('landing.subtitle')}
        </motion.p>

        <motion.div variants={item} className="mt-12">
          <Countdown />
        </motion.div>

        <motion.div
          variants={item}
          className="mt-12 flex flex-col items-center gap-4"
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/login"
              className="btn-gradient group flex items-center justify-center gap-2 rounded-xl px-10 py-4 text-lg font-bold text-black"
            >
              {t('landing.cta')}
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
            </Link>
          </motion.div>
          <p className="text-sm text-zinc-600">{t('landing.ctaDesc')}</p>
        </motion.div>

        <motion.div
          variants={item}
          className="absolute bottom-8"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="h-6 w-6 text-zinc-600" />
        </motion.div>
      </motion.section>

      {/* Como funciona */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center font-display text-5xl tracking-wide sm:text-6xl"
        >
          {t('landing.howItWorks')}
        </motion.h2>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {FEATURE_KEYS.map((key, i) => {
            const Icon = FEATURE_ICONS[i]
            return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              whileHover={{ y: -6 }}
              className="glass p-7 text-left transition hover:border-brasil-green/40 hover:shadow-[0_0_40px_rgba(0,200,83,0.12)]"
            >
              <div className="mb-4 inline-flex rounded-lg bg-brasil-green/10 p-3">
                <Icon className="h-7 w-7 text-brasil-yellow" />
              </div>
              <h3 className="font-display text-3xl tracking-wide">{t(`landing.features.${key}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{t(`landing.features.${key}.desc`)}</p>
            </motion.div>
            )
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo />
          <div className="flex items-center gap-4">
            <Link to="/regulamento" className="text-sm text-zinc-600 transition hover:text-zinc-400">
              Regulamento
            </Link>
            <span className="text-zinc-800">·</span>
            <p className="text-sm text-zinc-600">
              {APP_FULL_NAME} — {t('landing.footer')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
