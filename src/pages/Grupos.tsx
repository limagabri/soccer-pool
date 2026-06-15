import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Navbar } from '../components/Navbar'
import { useJogos } from '../hooks/useJogos'
import { GRUPOS, calcularTabela, getPlacar } from '../lib/classificacao'
import { formatarData } from '../lib/utils'
import type { Jogo } from '../types'

function PosicaoBadge({ posicao }: { posicao: number }) {
  const cor =
    posicao <= 2
      ? 'bg-brasil-green/20 text-brasil-green'
      : posicao === 3
        ? 'bg-brasil-yellow/20 text-brasil-yellow'
        : 'bg-white/5 text-zinc-500'
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${cor}`}
    >
      {posicao}
    </span>
  )
}

function LinhaJogo({ jogo }: { jogo: Jogo }) {
  const placar = getPlacar(jogo)
  return (
    <div className="flex items-center justify-between gap-2 border-b border-white/5 py-3 text-sm last:border-0">
      <div className="flex flex-1 items-center justify-end gap-2 text-right">
        <span className="hidden text-zinc-300 sm:inline">{jogo.time_casa}</span>
        <span className="text-xl">{jogo.emoji_casa}</span>
      </div>
      {placar ? (
        <span className="glass min-w-[4.5rem] px-2 py-1 text-center font-display text-lg tracking-widest">
          {placar.casa} x {placar.fora}
        </span>
      ) : (
        <span className="min-w-[6rem] text-center text-xs text-zinc-500 sm:min-w-[8rem]">
          {formatarData(jogo.data_jogo)}
        </span>
      )}
      <div className="flex flex-1 items-center gap-2">
        <span className="text-xl">{jogo.emoji_fora}</span>
        <span className="hidden text-zinc-300 sm:inline">{jogo.time_fora}</span>
      </div>
    </div>
  )
}

export function Grupos() {
  const { t } = useTranslation()
  const { jogos, loading, error } = useJogos()
  const [grupo, setGrupo] = useState('A')

  const jogosGrupo = useMemo(
    () =>
      jogos
        .filter((j) => j.grupo === grupo)
        .sort((a, b) => a.numero_jogo - b.numero_jogo),
    [jogos, grupo]
  )
  const tabela = useMemo(() => calcularTabela(jogosGrupo), [jogosGrupo])

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-5xl tracking-wide sm:text-6xl">
          {t('groups.title')} <span className="text-brasil-green">{t('groups.titleAccent')}</span>
        </h1>
        <p className="mt-2 text-zinc-400">{t('groups.subtitle')}</p>

        {/* Tabs de grupo */}
        <div className="mt-8 flex gap-1 overflow-x-auto border-b border-white/10 pb-px">
          {GRUPOS.map((g) => (
            <button
              key={g}
              onClick={() => setGrupo(g)}
              className={`relative px-4 py-2 font-display text-2xl transition ${
                grupo === g ? 'text-brasil-green' : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              {g}
              {grupo === g && (
                <motion.div
                  layoutId="tab-grupo"
                  className="absolute inset-x-2 -bottom-px h-0.5 bg-brasil-green"
                />
              )}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {t('groups.loadError')} {error}
          </p>
        )}

        {loading ? (
          <div className="mt-6 space-y-4">
            <div className="glass h-64 animate-pulse" />
            <div className="glass h-48 animate-pulse" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={grupo}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {/* Tabela de classificação */}
              <div className="glass mt-6 overflow-x-auto">
                <table className="w-full min-w-[34rem] text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs tracking-wider text-zinc-500 uppercase">
                      <th className="px-4 py-3">#</th>
                      <th className="py-3">{t('groups.team')}</th>
                      <th className="px-2 py-3 text-center">{t('groups.std.p')}</th>
                      <th className="px-2 py-3 text-center">{t('groups.std.w')}</th>
                      <th className="px-2 py-3 text-center">{t('groups.std.d')}</th>
                      <th className="px-2 py-3 text-center">{t('groups.std.l')}</th>
                      <th className="px-2 py-3 text-center">{t('groups.std.gf')}</th>
                      <th className="px-2 py-3 text-center">{t('groups.std.ga')}</th>
                      <th className="px-2 py-3 text-center">{t('groups.std.gd')}</th>
                      <th className="px-4 py-3 text-center">{t('groups.std.pts')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabela.map((linha, i) => (
                      <tr
                        key={linha.time}
                        className={`border-b border-white/5 last:border-0 ${
                          i < 2
                            ? 'bg-brasil-green/5'
                            : i === 2
                              ? 'bg-brasil-yellow/5'
                              : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <PosicaoBadge posicao={i + 1} />
                        </td>
                        <td className="py-3 font-medium">
                          <span className="mr-2 text-lg">{linha.emoji}</span>
                          {linha.time}
                        </td>
                        <td className="px-2 py-3 text-center text-zinc-400">{linha.j}</td>
                        <td className="px-2 py-3 text-center text-zinc-400">{linha.v}</td>
                        <td className="px-2 py-3 text-center text-zinc-400">{linha.e}</td>
                        <td className="px-2 py-3 text-center text-zinc-400">{linha.d}</td>
                        <td className="px-2 py-3 text-center text-zinc-400">{linha.gp}</td>
                        <td className="px-2 py-3 text-center text-zinc-400">{linha.gc}</td>
                        <td className="px-2 py-3 text-center text-zinc-400">
                          {linha.sg > 0 ? `+${linha.sg}` : linha.sg}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-brasil-yellow">
                          {linha.pts}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500">
                <span>
                  <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-brasil-green" />
                  {t('groups.qualifyDirect')}
                </span>
                <span>
                  <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-brasil-yellow" />
                  {t('groups.qualifyThird')}
                </span>
              </div>

              {/* Jogos do grupo */}
              <h2 className="mt-10 font-display text-3xl tracking-wide">
                {t('groups.matchesOf', { group: grupo })}
              </h2>
              <div className="glass mt-4 px-4 sm:px-6">
                {jogosGrupo.map((j) => (
                  <LinhaJogo key={j.id} jogo={j} />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  )
}
