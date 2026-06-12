import { Link } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { Trophy, Target, BarChart3, ArrowRight, ChevronDown } from 'lucide-react'
import { Logo } from '../components/Logo'
import { Particles } from '../components/Particles'
import { Countdown } from '../components/Countdown'

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

const FEATURES = [
  {
    icon: Target,
    title: 'Palpite',
    desc: 'Dê seus palpites no placar de cada jogo da Copa antes do apito inicial.',
  },
  {
    icon: BarChart3,
    title: 'Pontos',
    desc: 'Acertou o placar exato? Pontuação máxima. Acertou o vencedor? Também soma.',
  },
  {
    icon: Trophy,
    title: 'Ranking',
    desc: 'Acompanhe a classificação em tempo real e prove quem entende de futebol.',
  },
]

export function Landing() {
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
          <Link
            to="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition hover:text-brasil-yellow"
          >
            Entrar
          </Link>
          <Link
            to="/cadastro"
            className="btn-gradient rounded-lg px-4 py-2 text-sm font-semibold text-black"
          >
            Criar conta
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
          ⚽ A maior competição do planeta
        </motion.span>

        <motion.h1
          variants={item}
          className="font-display leading-[0.9] tracking-wide text-[clamp(4.5rem,15vw,8rem)] md:text-[clamp(8rem,13vw,12rem)]"
        >
          BolãoCopa{' '}
          <span className="bg-gradient-to-r from-brasil-green via-brasil-green-light to-brasil-yellow bg-clip-text text-transparent">
            2026
          </span>
        </motion.h1>

        <motion.p
          variants={item}
          className="mt-4 max-w-xl text-lg text-zinc-400 md:text-xl"
        >
          Quem vai ser campeão? Faça seus palpites.
        </motion.p>

        <motion.div variants={item} className="mt-12">
          <Countdown />
        </motion.div>

        <motion.div
          variants={item}
          className="mt-12 flex w-full max-w-md flex-col gap-4 sm:flex-row sm:justify-center"
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/cadastro"
              className="btn-gradient group flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-lg font-bold text-black"
            >
              Criar conta
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/login"
              className="glass flex items-center justify-center px-8 py-4 text-lg font-semibold text-zinc-200 transition hover:border-brasil-yellow/50 hover:text-brasil-yellow"
            >
              Entrar
            </Link>
          </motion.div>
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
      <section className="relative z-10 mx-auto max-w-5xl px-6 py-24">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center font-display text-5xl tracking-wide sm:text-6xl"
        >
          Como <span className="text-brasil-green">funciona</span>
        </motion.h2>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
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
              <h3 className="font-display text-3xl tracking-wide">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo />
          <p className="text-sm text-zinc-600">
            BolãoCopa 2026 — feito com ⚽ e ☕
          </p>
        </div>
      </footer>
    </div>
  )
}
