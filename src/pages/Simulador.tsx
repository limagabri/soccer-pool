import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dices, Lock, RotateCcw, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Navbar } from '../components/Navbar'
import { useJogos } from '../hooks/useJogos'
import {
  GRUPOS,
  calcularTodasTabelas,
  gruposCompletos,
  melhoresTerceiros,
  type Placares,
} from '../lib/classificacao'
import {
  NOMES_RODADAS,
  chaveResultado,
  montarChaveamento,
  probVitoria,
  simularPlacar,
  vencedorMataMata,
  type JogoMataMata,
  type ResultadosMataMata,
} from '../lib/simulacao'
import type { Jogo } from '../types'

function InputGol({
  valor,
  onChange,
  disabled,
}: {
  valor: number | null
  onChange: (v: number | null) => void
  disabled?: boolean
}) {
  return (
    <input
      type="number"
      min={0}
      max={20}
      disabled={disabled}
      value={valor ?? ''}
      onChange={(e) => {
        const v = e.target.value
        onChange(v === '' ? null : Math.max(0, Number.parseInt(v, 10) || 0))
      }}
      className="h-9 w-11 rounded-lg border border-white/10 bg-white/[0.05] text-center font-bold outline-none transition focus:border-brasil-green disabled:opacity-50"
    />
  )
}

function CardMataMata({
  jogo,
  resultados,
  onChange,
}: {
  jogo: JogoMataMata
  resultados: ResultadosMataMata
  onChange: (chave: string, r: { gols_casa: number | null; gols_fora: number | null; penaltis?: 'casa' | 'fora' }) => void
}) {
  const chave = chaveResultado(jogo)
  const r = resultados[chave]
  const definido = !!jogo.casa && !!jogo.fora
  const empate =
    r != null && r.gols_casa != null && r.gols_fora != null && r.gols_casa === r.gols_fora
  const vencedor = vencedorMataMata(jogo, resultados)

  function linha(lado: 'casa' | 'fora') {
    const time = lado === 'casa' ? jogo.casa : jogo.fora
    const origem = lado === 'casa' ? jogo.origemCasa : jogo.origemFora
    const gols = lado === 'casa' ? (r?.gols_casa ?? null) : (r?.gols_fora ?? null)
    const venceu = vencedor != null && time != null && vencedor.nome === time.nome

    return (
      <div className="flex items-center justify-between gap-2">
        {time ? (
          <span
            className={`flex items-center gap-2 truncate text-sm ${
              venceu ? 'font-bold text-brasil-green' : ''
            }`}
          >
            <span className="text-lg">{time.emoji}</span>
            <span className="truncate">{time.nome}</span>
            {venceu && empate && <span className="text-[0.6rem]">(pên.)</span>}
          </span>
        ) : (
          <span className="text-xs text-zinc-600 italic">{origem}</span>
        )}
        <InputGol
          valor={gols}
          disabled={!definido}
          onChange={(v) =>
            onChange(chave, {
              gols_casa: lado === 'casa' ? v : (r?.gols_casa ?? null),
              gols_fora: lado === 'fora' ? v : (r?.gols_fora ?? null),
            })
          }
        />
      </div>
    )
  }

  return (
    <div className="glass space-y-2 p-3">
      <p className="text-[0.65rem] tracking-wider text-zinc-500 uppercase">{jogo.rotulo}</p>
      {linha('casa')}
      {linha('fora')}
      {empate && definido && (
        <div className="flex items-center gap-1.5 pt-1 text-xs">
          <span className="text-zinc-500">Pênaltis:</span>
          {(['casa', 'fora'] as const).map((lado) => {
            const time = lado === 'casa' ? jogo.casa! : jogo.fora!
            const ativo = r?.penaltis === lado
            return (
              <button
                key={lado}
                onClick={() => onChange(chave, { ...r!, penaltis: lado })}
                className={`rounded-md px-2 py-1 transition ${
                  ativo
                    ? 'bg-brasil-green/20 font-semibold text-brasil-green'
                    : 'bg-white/5 text-zinc-400 hover:text-zinc-100'
                }`}
              >
                {time.emoji} {time.nome}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Simulador() {
  const { t } = useTranslation()
  const { jogos, loading, error } = useJogos()
  const [placares, setPlacares] = useState<Placares>({})
  const [ko, setKo] = useState<ResultadosMataMata>({})
  const [grupoAtivo, setGrupoAtivo] = useState('A')

  // Seed placares with real results from finished games on first load
  useEffect(() => {
    if (!jogos.length) return
    setPlacares(prev => {
      const next: Placares = { ...prev }
      let changed = false
      for (const j of jogos) {
        if (j.encerrado && j.gols_casa != null && j.gols_fora != null && !(j.id in next)) {
          next[j.id] = { gols_casa: j.gols_casa, gols_fora: j.gols_fora }
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [jogos])

  const tabelas = useMemo(() => calcularTodasTabelas(jogos, placares), [jogos, placares])
  const completos = useMemo(() => gruposCompletos(jogos, placares), [jogos, placares])
  const tudoCompleto = jogos.length > 0 && GRUPOS.every((g) => completos[g])
  const terceiros = useMemo(
    () => (tudoCompleto ? melhoresTerceiros(tabelas) : null),
    [tudoCompleto, tabelas]
  )
  const rodadas = useMemo(
    () => montarChaveamento(tabelas, completos, terceiros, ko),
    [tabelas, completos, terceiros, ko]
  )

  const jogosGrupoAtivo = useMemo(
    () =>
      jogos
        .filter((j) => j.grupo === grupoAtivo)
        .sort((a, b) => a.numero_jogo - b.numero_jogo),
    [jogos, grupoAtivo]
  )

  const campeao = rodadas.length > 0 ? vencedorMataMata(rodadas[5][0], ko) : null

  function setGol(jogo: Jogo, lado: 'gols_casa' | 'gols_fora', v: number | null) {
    setPlacares((prev) => ({
      ...prev,
      [jogo.id]: {
        gols_casa: lado === 'gols_casa' ? v : (prev[jogo.id]?.gols_casa ?? null),
        gols_fora: lado === 'gols_fora' ? v : (prev[jogo.id]?.gols_fora ?? null),
      },
    }))
  }

  function setResultadoKo(
    chave: string,
    r: { gols_casa: number | null; gols_fora: number | null; penaltis?: 'casa' | 'fora' }
  ) {
    setKo((prev) => ({ ...prev, [chave]: r }))
  }

  function simularTudo() {
    // 1. Completa os placares da fase de grupos (mantém o que o usuário já preencheu)
    const novosPlacares: Placares = { ...placares }
    for (const j of jogos) {
      if (j.encerrado) continue
      const atual = novosPlacares[j.id]
      if (atual && atual.gols_casa != null && atual.gols_fora != null) continue
      novosPlacares[j.id] = simularPlacar(j.time_casa, j.time_fora)
    }

    // 2. Classificados com os novos placares
    const tabelasSim = calcularTodasTabelas(jogos, novosPlacares)
    const completosSim = gruposCompletos(jogos, novosPlacares)
    const terceirosSim = melhoresTerceiros(tabelasSim)

    // 3. Mata-mata rodada a rodada (cada rodada depende dos vencedores da anterior)
    const koNovo: ResultadosMataMata = { ...ko }
    for (let r = 0; r < NOMES_RODADAS.length; r++) {
      const todas = montarChaveamento(tabelasSim, completosSim, terceirosSim, koNovo)
      for (const j of todas[r]) {
        if (!j.casa || !j.fora) continue
        const chave = chaveResultado(j)
        const existente = koNovo[chave]
        const decidido =
          existente &&
          existente.gols_casa != null &&
          existente.gols_fora != null &&
          (existente.gols_casa !== existente.gols_fora || existente.penaltis)
        if (decidido) continue
        const placar = simularPlacar(j.casa.nome, j.fora.nome)
        koNovo[chave] =
          placar.gols_casa === placar.gols_fora
            ? {
                ...placar,
                penaltis:
                  Math.random() < probVitoria(j.casa.nome, j.fora.nome) ? 'casa' : 'fora',
              }
            : placar
      }
    }

    setPlacares(novosPlacares)
    setKo(koNovo)
  }

  function resetar() {
    // Keep real results for finished games; only clear simulated ones
    const encerrados: Placares = {}
    for (const j of jogos) {
      if (j.encerrado && j.gols_casa != null && j.gols_fora != null) {
        encerrados[j.id] = { gols_casa: j.gols_casa, gols_fora: j.gols_fora }
      }
    }
    setPlacares(encerrados)
    setKo({})
  }

  const tabelaAtiva = tabelas[grupoAtivo] ?? []

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl tracking-wide sm:text-5xl md:text-6xl">
              {t('simulator.title')} <span className="text-brasil-green">{t('simulator.titleAccent')}</span>
            </h1>
            <p className="mt-2 text-zinc-400">
              {t('simulator.subtitle')}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={simularTudo}
              disabled={loading}
              className="btn-gradient flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-black disabled:opacity-60"
            >
              <Dices className="h-4 w-4" />
              Simular aleatoriamente
            </button>
            <button
              onClick={resetar}
              className="glass flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-brasil-yellow/50 hover:text-brasil-yellow"
            >
              <RotateCcw className="h-4 w-4" />
              Resetar
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            Erro ao carregar jogos: {error}
          </p>
        )}

        {loading ? (
          <div className="mt-8 space-y-4">
            <div className="glass h-72 animate-pulse" />
            <div className="glass h-72 animate-pulse" />
          </div>
        ) : (
          <>
            {/* ── Seção 1: Fase de grupos ───────────────────────── */}
            <section className="mt-12">
              <h2 className="font-display text-3xl tracking-wide sm:text-4xl">
                1 · Fase de <span className="text-brasil-green">Grupos</span>
              </h2>

              <div className="mt-4 flex gap-1 overflow-x-auto border-b border-white/10 pb-px">
                {GRUPOS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGrupoAtivo(g)}
                    className={`relative px-3.5 py-2 font-display text-xl transition ${
                      grupoAtivo === g
                        ? 'text-brasil-green'
                        : completos[g]
                          ? 'text-brasil-yellow/70 hover:text-brasil-yellow'
                          : 'text-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    {g}
                    {grupoAtivo === g && (
                      <motion.div
                        layoutId="tab-simulador"
                        className="absolute inset-x-2 -bottom-px h-0.5 bg-brasil-green"
                      />
                    )}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={grupoAtivo}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="mt-6 grid gap-6 lg:grid-cols-2"
                >
                  {/* Jogos editáveis */}
                  <div className="space-y-3">
                    {jogosGrupoAtivo.map((j) => {
                      const sim = placares[j.id]
                      return (
                        <div
                          key={j.id}
                          className="glass flex items-center justify-between gap-2 px-4 py-3"
                        >
                          <span className="flex flex-1 items-center justify-end gap-2 text-right text-sm">
                            <span className="hidden sm:inline">{j.time_casa}</span>
                            <span className="text-xl">{j.emoji_casa}</span>
                          </span>
                          {j.encerrado ? (
                            <span className="flex items-center gap-2 px-2 font-display text-xl tracking-widest text-brasil-yellow">
                              {j.gols_casa} x {j.gols_fora}
                              <Lock className="h-3.5 w-3.5 text-zinc-600" />
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <InputGol
                                valor={sim?.gols_casa ?? null}
                                onChange={(v) => setGol(j, 'gols_casa', v)}
                              />
                              <span className="text-zinc-600">x</span>
                              <InputGol
                                valor={sim?.gols_fora ?? null}
                                onChange={(v) => setGol(j, 'gols_fora', v)}
                              />
                            </span>
                          )}
                          <span className="flex flex-1 items-center gap-2 text-sm">
                            <span className="text-xl">{j.emoji_fora}</span>
                            <span className="hidden sm:inline">{j.time_fora}</span>
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Tabela ao vivo */}
                  <div className="glass h-fit overflow-x-auto">
                    <table className="w-full min-w-[22rem] text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-left text-xs tracking-wider text-zinc-500 uppercase">
                          <th className="px-3 py-2.5">#</th>
                          <th className="py-2.5">Seleção</th>
                          <th className="px-1.5 py-2.5 text-center">J</th>
                          <th className="px-1.5 py-2.5 text-center">SG</th>
                          <th className="px-3 py-2.5 text-center">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tabelaAtiva.map((l, i) => (
                          <tr
                            key={l.time}
                            className={`border-b border-white/5 last:border-0 ${
                              i < 2 ? 'bg-brasil-green/5' : i === 2 ? 'bg-brasil-yellow/5' : ''
                            }`}
                          >
                            <td
                              className={`px-3 py-2.5 font-bold ${
                                i < 2
                                  ? 'text-brasil-green'
                                  : i === 2
                                    ? 'text-brasil-yellow'
                                    : 'text-zinc-600'
                              }`}
                            >
                              {i + 1}
                            </td>
                            <td className="py-2.5">
                              <span className="mr-2">{l.emoji}</span>
                              {l.time}
                            </td>
                            <td className="px-1.5 py-2.5 text-center text-zinc-400">{l.j}</td>
                            <td className="px-1.5 py-2.5 text-center text-zinc-400">
                              {l.sg > 0 ? `+${l.sg}` : l.sg}
                            </td>
                            <td className="px-3 py-2.5 text-center font-bold text-brasil-yellow">
                              {l.pts}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </AnimatePresence>
            </section>

            {/* ── Melhores terceiros ────────────────────────────── */}
            <section className="mt-14">
              <h2 className="font-display text-3xl tracking-wide sm:text-4xl">
                2 · Melhores <span className="text-brasil-yellow">Terceiros</span>
              </h2>
              {terceiros ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {terceiros.map((t, i) => (
                    <div key={t.time} className="glass flex items-center gap-2 px-3 py-2.5 text-sm">
                      <span className="font-bold text-brasil-yellow">{i + 1}º</span>
                      <span className="text-lg">{t.emoji}</span>
                      <span className="truncate">{t.time}</span>
                      <span className="ml-auto text-xs text-zinc-500">{t.pts} pts</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="glass mt-4 p-6 text-sm text-zinc-500">
                  Preencha os placares de todos os grupos para calcular os 8 melhores terceiros
                  e liberar o chaveamento — ou use o botão{' '}
                  <strong className="text-zinc-300">Simular aleatoriamente</strong>.
                </p>
              )}
            </section>

            {/* ── Seção 3: Mata-mata ────────────────────────────── */}
            <section className="mt-14">
              <h2 className="font-display text-3xl tracking-wide sm:text-4xl">
                3 · <span className="text-brasil-green">Mata-mata</span>
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Empatou? Escolha quem avança nos pênaltis. Arraste para o lado para ver todas as fases.
              </p>

              <div className="mt-6 flex gap-5 overflow-x-auto pb-4">
                {rodadas.map((rodada, ri) => (
                  <div key={ri} className="flex w-60 shrink-0 flex-col">
                    <h3 className="mb-3 text-center font-display text-xl tracking-wide text-zinc-300">
                      {NOMES_RODADAS[ri]}
                    </h3>
                    <div className="flex flex-1 flex-col justify-around gap-3">
                      {rodada.map((j) => (
                        <CardMataMata
                          key={j.id}
                          jogo={j}
                          resultados={ko}
                          onChange={setResultadoKo}
                        />
                      ))}
                      {ri === rodadas.length - 1 && (
                        <div
                          className={`glass mt-4 flex flex-col items-center gap-2 border-brasil-yellow/30 p-6 text-center ${
                            campeao ? 'bg-brasil-yellow/5' : ''
                          }`}
                        >
                          <Trophy className="h-10 w-10 text-brasil-yellow" />
                          {campeao ? (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                            >
                              <p className="text-xs tracking-widest text-zinc-400 uppercase">
                                Campeão do mundo
                              </p>
                              <p className="mt-1 font-display text-3xl text-brasil-yellow">
                                {campeao.emoji} {campeao.nome}
                              </p>
                            </motion.div>
                          ) : (
                            <p className="text-xs text-zinc-500">
                              Simule a final para conhecer o campeão
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
