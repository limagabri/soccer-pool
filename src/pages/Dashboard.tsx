import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarClock, Crosshair, Medal, Star } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { useAuth } from '../contexts/AuthContext'
import { useJogos } from '../hooks/useJogos'
import { supabase } from '../lib/supabase'
import { agregarEstatisticas, type PalpiteResumo } from '../lib/pontuacao'
import { calcularPontos, formatarData } from '../lib/utils'

function formatarRestante(ms: number): string {
  if (ms <= 0) return 'Em andamento'
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor(s / 3600) % 24
  const m = Math.floor(s / 60) % 60
  const seg = s % 60
  if (d > 0) return `${d}d ${h}h ${m}min`
  if (h > 0) return `${h}h ${m}min ${seg}s`
  return `${m}min ${seg}s`
}

export function Dashboard() {
  const { profile, user } = useAuth()
  const { jogos } = useJogos()
  const [todosPalpites, setTodosPalpites] = useState<PalpiteResumo[]>([])
  const [agora, setAgora] = useState(() => Date.now())

  const username =
    profile?.username ??
    (user?.user_metadata?.username as string | undefined) ??
    user?.email?.split('@')[0] ??
    'torcedor'

  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    supabase
      .from('palpites')
      .select('user_id, jogo_id, gols_casa, gols_fora')
      .then(({ data }) => setTodosPalpites((data as PalpiteResumo[]) ?? []))
  }, [])

  const stats = useMemo(() => {
    const porUsuario = agregarEstatisticas(todosPalpites, jogos)
    if (user && !porUsuario.has(user.id))
      porUsuario.set(user.id, {
        user_id: user.id,
        pontos: 0,
        palpites: 0,
        exatos: 0,
        vencedor: 0,
      })

    const ranking = [...porUsuario.values()].sort(
      (a, b) => b.pontos - a.pontos || b.exatos - a.exatos
    )
    const posicao = user
      ? ranking.findIndex((s) => s.user_id === user.id) + 1
      : 0
    const minhas = user ? porUsuario.get(user.id)! : null

    return {
      meusPontos: minhas?.pontos ?? 0,
      palpitesFeitos: minhas?.palpites ?? 0,
      posicao,
      participantes: ranking.length,
    }
  }, [jogos, todosPalpites, user])

  // Último acerto de placar exato (10 pts) do usuário
  const melhorPalpite = useMemo(() => {
    if (!user) return null
    const jogosPorId = new Map(jogos.map((j) => [j.id, j]))
    return (
      todosPalpites
        .filter((p) => {
          if (p.user_id !== user.id) return false
          const j = jogosPorId.get(p.jogo_id)
          if (!j?.encerrado || j.gols_casa == null || j.gols_fora == null)
            return false
          return calcularPontos(p.gols_casa, p.gols_fora, j.gols_casa, j.gols_fora) === 10
        })
        .map((p) => ({ palpite: p, jogo: jogosPorId.get(p.jogo_id)! }))
        .sort(
          (a, b) =>
            new Date(b.jogo.data_jogo).getTime() -
            new Date(a.jogo.data_jogo).getTime()
        )[0] ?? null
    )
  }, [todosPalpites, jogos, user])

  const proximoJogo = useMemo(() => {
    return (
      jogos
        .filter((j) => !j.encerrado)
        .sort(
          (a, b) =>
            new Date(a.data_jogo).getTime() - new Date(b.data_jogo).getTime()
        )[0] ?? null
    )
  }, [jogos])

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-brasil-green/10 blur-3xl" />
        <div className="absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-brasil-yellow/[0.07] blur-3xl" />
      </div>

      <Navbar />

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-5xl tracking-wide md:text-6xl">
            Olá,{' '}
            <span className="bg-gradient-to-r from-brasil-green to-brasil-yellow bg-clip-text text-transparent">
              {username}
            </span>
            !
          </h1>
          <p className="mt-3 text-lg text-zinc-400">
            A Copa está rolando. Confira seus números e não perca o próximo jogo. ⚽
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Meus Pontos */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass p-5"
          >
            <div className="mb-3 inline-flex rounded-lg bg-brasil-green/10 p-2.5">
              <Star className="h-5 w-5 text-brasil-yellow" />
            </div>
            <p className="text-xs tracking-wider text-zinc-500 uppercase">Meus Pontos</p>
            <p className="mt-1 font-display text-4xl text-zinc-100">{stats.meusPontos}</p>
            <p className="mt-1 text-xs text-zinc-500">
              em {stats.palpitesFeitos}/{jogos.length || 72} palpites
            </p>
            <Link
              to="/palpites"
              className="mt-3 inline-block text-xs font-semibold text-brasil-green hover:underline"
            >
              Fazer palpites →
            </Link>
          </motion.div>

          {/* Minha Posição */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="glass p-5"
          >
            <div className="mb-3 inline-flex rounded-lg bg-brasil-green/10 p-2.5">
              <Medal className="h-5 w-5 text-brasil-yellow" />
            </div>
            <p className="text-xs tracking-wider text-zinc-500 uppercase">Minha Posição</p>
            <p className="mt-1 font-display text-4xl text-zinc-100">
              {stats.posicao > 0 ? `${stats.posicao}º` : '—'}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              de {stats.participantes} participante{stats.participantes === 1 ? '' : 's'}
            </p>
            <Link
              to="/ranking"
              className="mt-3 inline-block text-xs font-semibold text-brasil-green hover:underline"
            >
              Ver ranking →
            </Link>
          </motion.div>

          {/* Próximo Jogo */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.26 }}
            className="glass p-5"
          >
            <div className="mb-3 inline-flex rounded-lg bg-brasil-green/10 p-2.5">
              <CalendarClock className="h-5 w-5 text-brasil-yellow" />
            </div>
            <p className="text-xs tracking-wider text-zinc-500 uppercase">Próximo Jogo</p>
            {proximoJogo ? (
              <>
                <p className="mt-1 text-sm font-semibold">
                  {proximoJogo.emoji_casa} {proximoJogo.time_casa}
                  <span className="mx-1.5 text-zinc-600">x</span>
                  {proximoJogo.emoji_fora} {proximoJogo.time_fora}
                </p>
                <p className="mt-1 font-display text-3xl text-brasil-green">
                  {formatarRestante(
                    new Date(proximoJogo.data_jogo).getTime() - agora
                  )}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {formatarData(proximoJogo.data_jogo)}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-zinc-500">Nenhum jogo pendente.</p>
            )}
          </motion.div>

          {/* Melhor Palpite */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.34 }}
            className="glass p-5"
          >
            <div className="mb-3 inline-flex rounded-lg bg-brasil-green/10 p-2.5">
              <Crosshair className="h-5 w-5 text-brasil-yellow" />
            </div>
            <p className="text-xs tracking-wider text-zinc-500 uppercase">Melhor Palpite</p>
            {melhorPalpite ? (
              <>
                <p className="mt-1 font-display text-3xl text-brasil-green">
                  {melhorPalpite.jogo.emoji_casa} {melhorPalpite.palpite.gols_casa} x{' '}
                  {melhorPalpite.palpite.gols_fora} {melhorPalpite.jogo.emoji_fora}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {melhorPalpite.jogo.time_casa} x {melhorPalpite.jogo.time_fora} · placar
                  exato, +10 pts 🎯
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-zinc-500">
                Nenhum placar exato ainda. Vai que o próximo sai!
              </p>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
