import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarClock, Crosshair, Medal, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Navbar } from '../components/Navbar'
import { ComentaristaCard } from '../components/ComentaristaCard'
import { StoriesViewer, type StoryData } from '../components/StoriesViewer'
import { StoryHallVergonha } from '../components/stories/StoryHallVergonha'
import { StoryZebraDia } from '../components/stories/StoryZebraDia'
import { StoryVidente } from '../components/stories/StoryVidente'
import { StorySubiuAfundou } from '../components/stories/StorySubiuAfundou'
import { StoryCovarde } from '../components/stories/StoryCovarde'
import { StoryTelepata } from '../components/stories/StoryTelepata'
import { useAuth } from '../contexts/AuthContext'
import { useJogos } from '../hooks/useJogos'
import { supabase } from '../lib/supabase'
import { agregarEstatisticas, type PalpiteResumo } from '../lib/pontuacao'
import { calcularPontos, formatarData } from '../lib/utils'

interface ComentarioIA { id: string; conteudo: string; publicado_em: string | null }

function MiniStory({ story, onClick }: { story: StoryData; onClick: () => void }) {
  const dados = story.dados ?? {}
  const props = { titulo: story.titulo, conteudo: story.conteudo_ia, dados }
  return (
    <button onClick={onClick} className="group relative overflow-hidden rounded-xl transition hover:scale-[1.03]">
      <div className="scale-[0.38] origin-top-left" style={{ width: 400, height: 400 }}>
        {story.template === 'hall_vergonha'      && <StoryHallVergonha {...props} />}
        {story.template === 'zebra_dia'          && <StoryZebraDia {...props} />}
        {story.template === 'vidente_chutometro' && <StoryVidente {...props} />}
        {story.template === 'subiu_afundou'      && <StorySubiuAfundou {...props} />}
        {story.template === 'palpite_covarde'    && <StoryCovarde {...props} />}
        {story.template === 'telepata_rodada'    && <StoryTelepata {...props} />}
      </div>
      <div style={{ height: 152, width: 152 }} className="pointer-events-none" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/60 to-transparent" />
      <span className="absolute bottom-1.5 left-1.5 right-1.5 truncate text-[10px] font-semibold text-white drop-shadow">
        {story.titulo}
      </span>
    </button>
  )
}

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
  const { t } = useTranslation()
  const { jogos } = useJogos()
  const [todosPalpites, setTodosPalpites] = useState<PalpiteResumo[]>([])
  const [agora, setAgora] = useState(() => Date.now())
  const [ultimoComentario, setUltimoComentario] = useState<ComentarioIA | null>(null)
  const [stories, setStories] = useState<StoryData[]>([])
  const [viewerIdx, setViewerIdx] = useState<number | null>(null)

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

  useEffect(() => {
    supabase
      .from('comentarios_ia')
      .select('id, conteudo, publicado_em')
      .eq('publicado', true)
      .order('publicado_em', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => { if (data) setUltimoComentario(data as ComentarioIA) })

    supabase
      .from('stories')
      .select('id, template, titulo, conteudo_ia, dados, publicado_em')
      .eq('publicado', true)
      .order('publicado_em', { ascending: false })
      .limit(3)
      .then(({ data }) => setStories((data as StoryData[]) ?? []))
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

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-4xl tracking-wide sm:text-5xl md:text-6xl">
            Olá,{' '}
            <span className="bg-gradient-to-r from-brasil-green to-brasil-yellow bg-clip-text text-transparent">
              {username}
            </span>
            !
          </h1>
          <p className="mt-3 text-lg text-zinc-400">
            {t('dashboard.subtitle')}
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
            <p className="text-xs tracking-wider text-zinc-500 uppercase">{t('dashboard.myPoints')}</p>
            <p className="mt-1 font-display text-4xl text-zinc-100">{stats.meusPontos}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {t('dashboard.inOf', { done: stats.palpitesFeitos, total: jogos.length || 72 })}
            </p>
            <Link
              to="/palpites"
              className="mt-3 inline-block text-xs font-semibold text-brasil-green hover:underline"
            >
              {t('dashboard.makePicks')}
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
            <p className="text-xs tracking-wider text-zinc-500 uppercase">{t('dashboard.myPosition')}</p>
            <p className="mt-1 font-display text-4xl text-zinc-100">
              {stats.posicao > 0 ? `${stats.posicao}º` : '—'}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {t('dashboard.outOf', { count: stats.participantes, s: stats.participantes === 1 ? '' : 's' })}
            </p>
            <Link
              to="/ranking"
              className="mt-3 inline-block text-xs font-semibold text-brasil-green hover:underline"
            >
              {t('dashboard.viewRanking')}
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
            <p className="text-xs tracking-wider text-zinc-500 uppercase">{t('dashboard.nextMatch')}</p>
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
              <p className="mt-2 text-sm text-zinc-500">{t('dashboard.noPending')}</p>
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
            <p className="text-xs tracking-wider text-zinc-500 uppercase">{t('dashboard.bestPick')}</p>
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
                {t('dashboard.noExact')}
              </p>
            )}
          </motion.div>
        </div>

        {/* Seu Zé — último comentário */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-wide">
              👴🏽 Seu Zé <span className="text-brasil-green">Comentou</span>
            </h2>
            <Link to="/comentarios" className="text-xs font-semibold text-brasil-green hover:underline">
              Ver todos →
            </Link>
          </div>
          {ultimoComentario ? (
            <ComentaristaCard
              conteudo={ultimoComentario.conteudo}
              publicado_em={ultimoComentario.publicado_em}
              compact
            />
          ) : (
            <div className="glass flex items-center gap-3 px-4 py-5">
              <span className="text-3xl opacity-40">🎙️</span>
              <p className="text-sm text-gray-500 dark:text-zinc-500">
                Seu Zé ainda não comentou nada. Quando o admin gerar um comentário,
                ele aparece aqui.
              </p>
            </div>
          )}
        </motion.section>

        {/* Stories do dia */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-10"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-wide">
              📱 Stories do <span className="text-brasil-yellow">Dia</span>
            </h2>
            <Link to="/stories" className="text-xs font-semibold text-brasil-yellow hover:underline">
              Ver todos →
            </Link>
          </div>
          {stories.length > 0 ? (
            <div className="flex gap-3">
              {stories.map((s, i) => (
                <MiniStory key={s.id} story={s} onClick={() => setViewerIdx(i)} />
              ))}
            </div>
          ) : (
            <div className="glass flex items-center gap-3 px-4 py-5">
              <span className="text-3xl opacity-40">📸</span>
              <p className="text-sm text-gray-500 dark:text-zinc-500">
                Nenhum story publicado ainda. O admin pode gerar stories
                cômicos em{' '}
                <Link to="/admin/stories" className="text-brasil-yellow hover:underline">
                  Admin → Stories
                </Link>
                .
              </p>
            </div>
          )}
        </motion.section>
      </main>

      <AnimatePresence>
        {viewerIdx !== null && stories.length > 0 && (
          <StoriesViewer
            stories={stories}
            initialIndex={viewerIdx}
            onClose={() => setViewerIdx(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
