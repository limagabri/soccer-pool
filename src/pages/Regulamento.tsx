import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft, Award, BarChart3, BookOpen, Shield, Target, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Navbar } from '../components/Navbar'
import { APP_FULL_NAME } from '../config/app'

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

export function Regulamento() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* Header */}
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-zinc-300">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <div className="mb-10">
          <h1 className="font-display text-5xl tracking-wide sm:text-6xl">
            <span className="text-brasil-green">{t('regulamento.titleAccent')}</span>
          </h1>
          <p className="mt-2 text-zinc-400">{t('regulamento.subtitle')}</p>
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">

          {/* Seção 1 — Como funciona */}
          <motion.section variants={item} className="glass p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-brasil-green/15 p-2">
                <BookOpen className="h-5 w-5 text-brasil-green" />
              </div>
              <h2 className="font-display text-2xl tracking-wide">{t('regulamento.s1.title')}</h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-zinc-400">
              <p>{t('regulamento.s1.p1', { name: APP_FULL_NAME })}</p>
              <p>{t('regulamento.s1.p2pre')} <Link to="/ranking" className="text-brasil-green hover:underline">{t('regulamento.s1.p2link')}</Link> {t('regulamento.s1.p2post')}</p>
              <p>{t('regulamento.s1.p3')}</p>
            </div>
          </motion.section>

          {/* Seção 2 — Pontuação dos palpites */}
          <motion.section variants={item} className="glass p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-brasil-yellow/15 p-2">
                <Target className="h-5 w-5 text-brasil-yellow" />
              </div>
              <h2 className="font-display text-2xl tracking-wide">{t('regulamento.s2.title')}</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-brasil-green/30 bg-brasil-green/10 p-4 text-center">
                <p className="text-2xl">🎯</p>
                <p className="mt-2 font-bold text-brasil-green text-xl">10 {t('regulamento.points')}</p>
                <p className="mt-1 text-sm text-zinc-400">{t('regulamento.s2.exact')}</p>
              </div>
              <div className="rounded-xl border border-brasil-yellow/30 bg-brasil-yellow/10 p-4 text-center">
                <p className="text-2xl">✅</p>
                <p className="mt-2 font-bold text-brasil-yellow text-xl">5 {t('regulamento.points')}</p>
                <p className="mt-1 text-sm text-zinc-400">{t('regulamento.s2.winner')}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-2xl">❌</p>
                <p className="mt-2 font-bold text-zinc-500 text-xl">0 {t('regulamento.points')}</p>
                <p className="mt-1 text-sm text-zinc-500">{t('regulamento.s2.wrong')}</p>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-white/[0.04] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">{t('regulamento.s2.example')}</p>
              <p className="text-sm text-zinc-400">{t('regulamento.s2.exampleIntro')} <strong className="text-zinc-200">Brasil 2×1 Argentina</strong>:</p>
              <div className="mt-2 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-zinc-400">{t('regulamento.s2.youGuessed')} <strong className="text-zinc-200">2×1</strong></span><span className="text-brasil-green font-bold">+10 pts</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">{t('regulamento.s2.youGuessed')} <strong className="text-zinc-200">3×2</strong> {t('regulamento.s2.homeWins')}</span><span className="text-brasil-yellow font-bold">+5 pts</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">{t('regulamento.s2.youGuessed')} <strong className="text-zinc-200">0×1</strong> {t('regulamento.s2.awayWins')}</span><span className="text-zinc-500">+0 pts</span></div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-brasil-green/20 bg-brasil-green/5 p-4">
              <p className="mb-1 text-sm font-semibold text-brasil-green">{t('regulamento.s2.knockout.title')}</p>
              <p className="text-sm text-zinc-400">{t('regulamento.s2.knockout.body')}</p>
            </div>
          </motion.section>

          {/* Seção 3 — Escolhas especiais */}
          <motion.section variants={item} className="glass p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-brasil-yellow/15 p-2">
                <Award className="h-5 w-5 text-brasil-yellow" />
              </div>
              <h2 className="font-display text-2xl tracking-wide">{t('regulamento.s3.title')} <span className="text-sm text-zinc-500 font-sans font-normal">{t('regulamento.s3.bonus')}</span></h2>
            </div>
            <p className="mb-4 text-sm text-zinc-400">{t('regulamento.s3.intro')}</p>

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-2.5">{t('regulamento.s3.colChoice')}</th>
                    <th className="px-4 py-2.5 text-right">{t('regulamento.s3.colPoints')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { emoji: '🏆', label: t('regulamento.s3.champion'), pts: 30 },
                    { emoji: '⚽', label: t('regulamento.s3.topScorer'), pts: 20 },
                    { emoji: '🌟', label: t('regulamento.s3.bestPlayer'), pts: 15 },
                    { emoji: '🥈', label: t('regulamento.s3.runnerUp'), pts: 15 },
                    { emoji: '🥉', label: t('regulamento.s3.third'), pts: 10 },
                    { emoji: '🛡️', label: t('regulamento.s3.bestDefense'), pts: 10, auto: true },
                  ].map(({ emoji, label, pts, auto }) => (
                    <tr key={label} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-2.5 text-zinc-300">
                        <span className="mr-2">{emoji}</span>{label}
                        {auto && <span className="ml-2 text-xs text-zinc-600">{t('regulamento.s3.auto')}</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-brasil-yellow">+{pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>

          {/* Seção 4 — Classificação final */}
          <motion.section variants={item} className="glass p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-brasil-green/15 p-2">
                <BarChart3 className="h-5 w-5 text-brasil-green" />
              </div>
              <h2 className="font-display text-2xl tracking-wide">{t('regulamento.s4.title')}</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-4 py-3">
                <Trophy className="h-5 w-5 text-brasil-yellow shrink-0" />
                <p className="text-sm text-zinc-300">
                  <strong>{t('regulamento.s4.total')}</strong>
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.04] px-4 py-3">
                <p className="text-sm font-medium text-zinc-400 mb-2">{t('regulamento.s4.tiebreak')}</p>
                <ol className="space-y-1.5 text-sm text-zinc-500">
                  <li className="flex gap-2"><span className="text-zinc-600">1.</span> {t('regulamento.s4.tb1')}</li>
                  <li className="flex gap-2"><span className="text-zinc-600">2.</span> {t('regulamento.s4.tb2')}</li>
                  <li className="flex gap-2"><span className="text-zinc-600">3.</span> {t('regulamento.s4.tb3')}</li>
                </ol>
              </div>
            </div>
          </motion.section>

          {/* Seção 5 — Regras gerais */}
          <motion.section variants={item} className="glass p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-zinc-700/50 p-2">
                <Shield className="h-5 w-5 text-zinc-400" />
              </div>
              <h2 className="font-display text-2xl tracking-wide">{t('regulamento.s5.title')}</h2>
            </div>
            <ul className="space-y-2 text-sm text-zinc-400">
              {[
                t('regulamento.s5.r1'),
                t('regulamento.s5.r2'),
                t('regulamento.s5.r3'),
                t('regulamento.s5.r4'),
                t('regulamento.s5.r5'),
                t('regulamento.s5.r6'),
                t('regulamento.s5.r7'),
              ].map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="mt-0.5 text-brasil-green shrink-0">•</span>
                  {r}
                </li>
              ))}
            </ul>
          </motion.section>

        </motion.div>
      </main>

      <footer className="border-t border-white/5 px-6 py-6 text-center text-sm text-zinc-600">
        {APP_FULL_NAME} — {t('landing.footer')}
      </footer>
    </div>
  )
}
