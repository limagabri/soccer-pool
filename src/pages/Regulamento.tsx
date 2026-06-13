import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft, Award, BarChart3, BookOpen, Shield, Target, Trophy } from 'lucide-react'
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
            <span className="text-brasil-green">Regulamento</span>
          </h1>
          <p className="mt-2 text-zinc-400">Tudo que você precisa saber para ganhar o bolão.</p>
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">

          {/* Seção 1 — Como funciona */}
          <motion.section variants={item} className="glass p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-brasil-green/15 p-2">
                <BookOpen className="h-5 w-5 text-brasil-green" />
              </div>
              <h2 className="font-display text-2xl tracking-wide">Como funciona</h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-zinc-400">
              <p>O {APP_FULL_NAME} é um bolão fechado, acessível apenas por convite. Cada participante dá seus palpites de placar para os jogos da Copa do Mundo antes de cada partida começar.</p>
              <p>Acompanhe a classificação em tempo real no <Link to="/ranking" className="text-brasil-green hover:underline">Ranking</Link> e veja quem está dominando.</p>
              <p>Palpites ficam bloqueados assim que o jogo inicia. Não é possível alterar um palpite já registrado.</p>
            </div>
          </motion.section>

          {/* Seção 2 — Pontuação dos palpites */}
          <motion.section variants={item} className="glass p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-brasil-yellow/15 p-2">
                <Target className="h-5 w-5 text-brasil-yellow" />
              </div>
              <h2 className="font-display text-2xl tracking-wide">Pontuação dos palpites</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-brasil-green/30 bg-brasil-green/10 p-4 text-center">
                <p className="text-2xl">🎯</p>
                <p className="mt-2 font-bold text-brasil-green text-xl">10 pontos</p>
                <p className="mt-1 text-sm text-zinc-400">Placar exato</p>
              </div>
              <div className="rounded-xl border border-brasil-yellow/30 bg-brasil-yellow/10 p-4 text-center">
                <p className="text-2xl">✅</p>
                <p className="mt-2 font-bold text-brasil-yellow text-xl">5 pontos</p>
                <p className="mt-1 text-sm text-zinc-400">Vencedor ou empate correto</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                <p className="text-2xl">❌</p>
                <p className="mt-2 font-bold text-zinc-500 text-xl">0 pontos</p>
                <p className="mt-1 text-sm text-zinc-500">Resultado errado</p>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-white/[0.04] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Exemplo</p>
              <p className="text-sm text-zinc-400">Jogo encerrado <strong className="text-zinc-200">Brasil 2×1 Argentina</strong>:</p>
              <div className="mt-2 space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-zinc-400">Você chutou <strong className="text-zinc-200">2×1</strong></span><span className="text-brasil-green font-bold">+10 pts</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">Você chutou <strong className="text-zinc-200">3×2</strong> (Brasil vence)</span><span className="text-brasil-yellow font-bold">+5 pts</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">Você chutou <strong className="text-zinc-200">0×1</strong> (Argentina vence)</span><span className="text-zinc-500">+0 pts</span></div>
              </div>
            </div>
          </motion.section>

          {/* Seção 3 — Escolhas especiais */}
          <motion.section variants={item} className="glass p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-brasil-yellow/15 p-2">
                <Award className="h-5 w-5 text-brasil-yellow" />
              </div>
              <h2 className="font-display text-2xl tracking-wide">Escolhas especiais <span className="text-sm text-zinc-500 font-sans font-normal">bônus</span></h2>
            </div>
            <p className="mb-4 text-sm text-zinc-400">Feitas no primeiro acesso. Não podem ser alteradas após confirmadas.</p>

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-2.5">Escolha</th>
                    <th className="px-4 py-2.5 text-right">Pontos</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { emoji: '🏆', label: 'Campeão correto', pts: 30 },
                    { emoji: '⚽', label: 'Artilheiro correto', pts: 20 },
                    { emoji: '🌟', label: 'Melhor jogador correto', pts: 15 },
                    { emoji: '🥈', label: 'Vice-campeão correto', pts: 15 },
                    { emoji: '🥉', label: '3º lugar correto', pts: 10 },
                    { emoji: '🛡️', label: 'Melhor defesa (menos gols sofridos)', pts: 10, auto: true },
                  ].map(({ emoji, label, pts, auto }) => (
                    <tr key={label} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-2.5 text-zinc-300">
                        <span className="mr-2">{emoji}</span>{label}
                        {auto && <span className="ml-2 text-xs text-zinc-600">(calculada automaticamente)</span>}
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
              <h2 className="font-display text-2xl tracking-wide">Classificação final</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-4 py-3">
                <Trophy className="h-5 w-5 text-brasil-yellow shrink-0" />
                <p className="text-sm text-zinc-300">
                  <strong>Total = Pontos de palpites + Pontos especiais</strong>
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.04] px-4 py-3">
                <p className="text-sm font-medium text-zinc-400 mb-2">Critérios de desempate (em ordem):</p>
                <ol className="space-y-1.5 text-sm text-zinc-500">
                  <li className="flex gap-2"><span className="text-zinc-600">1.</span> Mais acertos de placar exato</li>
                  <li className="flex gap-2"><span className="text-zinc-600">2.</span> Mais acertos de vencedor/empate</li>
                  <li className="flex gap-2"><span className="text-zinc-600">3.</span> Ordem alfabética do nome</li>
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
              <h2 className="font-display text-2xl tracking-wide">Regras gerais</h2>
            </div>
            <ul className="space-y-2 text-sm text-zinc-400">
              {[
                'Palpites são bloqueados automaticamente quando o jogo inicia.',
                'Não é possível alterar palpites após o início da partida.',
                'Escolhas especiais são feitas no primeiro acesso e não podem ser editadas.',
                'Após 27/06/2026 (fim da fase de grupos), as escolhas dos participantes são reveladas para todos.',
                'Os resultados finais e pontos especiais são calculados pelo administrador ao término da Copa.',
                'O administrador não participa do bolão.',
                'O bolão é fechado — acesso exclusivo por convite.',
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
        {APP_FULL_NAME} — feito com ⚽ e ☕
      </footer>
    </div>
  )
}
