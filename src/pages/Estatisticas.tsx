import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Shield, Star, Trophy } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { useAuth } from '../contexts/AuthContext'
import { useJogos } from '../hooks/useJogos'
import { supabase } from '../lib/supabase'
import type { Jogo } from '../types'

const FIM_FASE_GRUPOS = new Date('2026-06-27T00:00:00-03:00')
const MEDALHAS = ['🥇', '🥈', '🥉']

interface EventoJogo {
  tipo: 'gol' | 'gol_contra' | 'assistencia'
  jogador: string
  selecao: string
  minuto: number | null
}

interface Artilheiro {
  jogador: string
  selecao: string
  gols: number
  assistencias: number
}

interface StatSelecao {
  nome: string
  jogos: number
  gols_marcados: number
  gols_sofridos: number
  saldo: number
}

interface EscolhaParticipante {
  user_id: string
  username: string
  campeao: string
  vice_campeao: string
  terceiro: string
  artilheiro: string
  melhor_jogador: string
}

interface ResultadoEspecial {
  campeao: string | null
  vice_campeao: string | null
  terceiro: string | null
  artilheiro: string | null
  melhor_jogador: string | null
  finalizado: boolean
}

interface MinhaEscolha {
  campeao: string
  vice_campeao: string
  terceiro: string
  artilheiro: string
  melhor_jogador: string
}

type Secao = 'artilharia' | 'selecoes' | 'escolhas' | 'minhas'

function iconeStatus(minha: string, resultado: string | null, finalizado: boolean) {
  if (!finalizado) return '⏳'
  if (!resultado) return '⏳'
  return minha.toLowerCase().trim() === resultado.toLowerCase().trim() ? '✅' : '❌'
}

export function Estatisticas() {
  const { user } = useAuth()
  const { jogos } = useJogos()
  const [secao, setSecao] = useState<Secao>('artilharia')

  const [eventos, setEventos] = useState<EventoJogo[]>([])
  const [escolhas, setEscolhas] = useState<EscolhaParticipante[]>([])
  const [resultado, setResultado] = useState<ResultadoEspecial | null>(null)
  const [minhaEscolha, setMinhaEscolha] = useState<MinhaEscolha | null>(null)
  const [loading, setLoading] = useState(true)

  const revelarTudo = useMemo(() => new Date() >= FIM_FASE_GRUPOS, [])

  useEffect(() => {
    async function carregar() {
      const [r1, r2, r3] = await Promise.all([
        supabase.from('eventos_jogo').select('tipo, jogador, selecao, minuto'),
        supabase
          .from('escolhas_especiais')
          .select('user_id, campeao, vice_campeao, terceiro, artilheiro, melhor_jogador, profiles(username, is_admin)'),
        supabase
          .from('resultados_especiais')
          .select('campeao, vice_campeao, terceiro, artilheiro, melhor_jogador, finalizado')
          .limit(1)
          .maybeSingle(),
      ])

      setEventos((r1.data as EventoJogo[]) ?? [])

      if (r2.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setEscolhas((r2.data as any[])
          .filter((r) => !(r.profiles as { is_admin?: boolean } | null)?.is_admin)
          .map((r) => ({
            user_id: r.user_id as string,
            username: (r.profiles as { username: string } | null)?.username ?? 'Anônimo',
            campeao: r.campeao as string,
            vice_campeao: r.vice_campeao as string,
            terceiro: r.terceiro as string,
            artilheiro: r.artilheiro as string,
            melhor_jogador: r.melhor_jogador as string,
          })))
      }

      if (r3.data) setResultado(r3.data as ResultadoEspecial)

      if (user) {
        const { data: r4 } = await supabase
          .from('escolhas_especiais')
          .select('campeao, vice_campeao, terceiro, artilheiro, melhor_jogador')
          .eq('user_id', user.id)
          .maybeSingle()
        if (r4) setMinhaEscolha(r4 as MinhaEscolha)
      }

      setLoading(false)
    }
    carregar()
  }, [user])

  // ─── artilharia ─────────────────────────────────────────────────────────────
  const artilheiros = useMemo((): Artilheiro[] => {
    const map: Record<string, Artilheiro> = {}
    for (const e of eventos) {
      if (e.tipo === 'gol') {
        if (!map[e.jogador]) map[e.jogador] = { jogador: e.jogador, selecao: e.selecao, gols: 0, assistencias: 0 }
        map[e.jogador].gols++
      } else if (e.tipo === 'assistencia') {
        if (!map[e.jogador]) map[e.jogador] = { jogador: e.jogador, selecao: e.selecao, gols: 0, assistencias: 0 }
        map[e.jogador].assistencias++
      }
    }
    return Object.values(map).sort((a, b) => b.gols - a.gols || b.assistencias - a.assistencias)
  }, [eventos])

  // ─── stats por seleção ──────────────────────────────────────────────────────
  const statsSelecao = useMemo((): StatSelecao[] => {
    const map: Record<string, StatSelecao> = {}
    const enc = jogos.filter((j: Jogo) => j.encerrado && j.gols_casa != null)
    for (const j of enc) {
      const gc = j.gols_casa!
      const gf = j.gols_fora!
      if (!map[j.time_casa]) map[j.time_casa] = { nome: j.time_casa, jogos: 0, gols_marcados: 0, gols_sofridos: 0, saldo: 0 }
      if (!map[j.time_fora]) map[j.time_fora] = { nome: j.time_fora, jogos: 0, gols_marcados: 0, gols_sofridos: 0, saldo: 0 }
      map[j.time_casa].jogos++
      map[j.time_fora].jogos++
      map[j.time_casa].gols_marcados += gc
      map[j.time_casa].gols_sofridos += gf
      map[j.time_fora].gols_marcados += gf
      map[j.time_fora].gols_sofridos += gc
    }
    return Object.values(map)
      .map((s) => ({ ...s, saldo: s.gols_marcados - s.gols_sofridos }))
      .sort((a, b) => b.gols_marcados - a.gols_marcados)
  }, [jogos])

  const melhorDefesa = useMemo(() => {
    if (!statsSelecao.length) return null
    return [...statsSelecao].sort((a, b) => a.gols_sofridos - b.gols_sofridos)[0]
  }, [statsSelecao])

  const SECOES: { id: Secao; label: string }[] = [
    { id: 'artilharia', label: '⚽ Artilharia' },
    { id: 'selecoes', label: '🏳️ Por seleção' },
    { id: 'escolhas', label: '🔍 Escolhas' },
    ...(user ? [{ id: 'minhas' as Secao, label: '🌟 Minhas escolhas' }] : []),
  ]

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-5xl tracking-wide sm:text-6xl">
          <span className="text-brasil-yellow">Estatísticas</span>
        </h1>
        <p className="mt-2 text-zinc-400">Artilharia, defesas e escolhas especiais.</p>

        {/* Abas */}
        <div className="mt-6 flex flex-wrap gap-2">
          {SECOES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSecao(s.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                secao === s.id
                  ? 'bg-brasil-green/20 text-brasil-green ring-1 ring-brasil-green/40'
                  : 'bg-white/5 text-zinc-400 hover:text-zinc-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-8 space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="glass h-14 animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div key={secao} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {/* ── ARTILHARIA ─────────────────────────────────────────── */}
            {secao === 'artilharia' && (
              <div className="mt-8">
                {artilheiros.length === 0 ? (
                  <p className="glass p-10 text-center text-zinc-500">Nenhum evento registrado ainda.</p>
                ) : (
                  <div className="glass overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-zinc-500">
                          <th className="px-4 py-3">#</th>
                          <th className="py-3">Jogador</th>
                          <th className="px-3 py-3 text-center">Seleção</th>
                          <th className="px-3 py-3 text-center">⚽ Gols</th>
                          <th className="px-3 py-3 text-center">🎯 Assist.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {artilheiros.map((a, i) => (
                          <motion.tr
                            key={a.jogador}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: Math.min(i * 0.04, 0.6) }}
                            className="border-b border-white/5 last:border-0"
                          >
                            <td className="px-4 py-3 text-lg">
                              {MEDALHAS[i] ?? <span className="text-sm font-bold text-zinc-500">{i + 1}º</span>}
                            </td>
                            <td className="py-3 font-medium text-zinc-200">{a.jogador}</td>
                            <td className="px-3 py-3 text-center text-zinc-400">{a.selecao}</td>
                            <td className="px-3 py-3 text-center font-display text-xl text-brasil-yellow">{a.gols}</td>
                            <td className="px-3 py-3 text-center text-zinc-400">{a.assistencias}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── POR SELEÇÃO ───────────────────────────────────────── */}
            {secao === 'selecoes' && (
              <div className="mt-8">
                {melhorDefesa && (
                  <div className="glass mb-4 flex items-center gap-3 p-4">
                    <Shield className="h-5 w-5 text-brasil-green" />
                    <span className="text-sm text-zinc-400">
                      Melhor defesa até agora: <span className="font-semibold text-zinc-100">{melhorDefesa.nome}</span>
                      <span className="ml-2 text-zinc-500">({melhorDefesa.gols_sofridos} gols sofridos)</span>
                    </span>
                  </div>
                )}
                {statsSelecao.length === 0 ? (
                  <p className="glass p-10 text-center text-zinc-500">Nenhum jogo encerrado ainda.</p>
                ) : (
                  <div className="glass overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-zinc-500">
                          <th className="px-4 py-3">Seleção</th>
                          <th className="px-3 py-3 text-center">JG</th>
                          <th className="px-3 py-3 text-center">GM</th>
                          <th className="px-3 py-3 text-center">GS</th>
                          <th className="px-3 py-3 text-center">SG</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statsSelecao.map((s, i) => {
                          const eMelhorDefesa = s.nome === melhorDefesa?.nome
                          return (
                            <motion.tr
                              key={s.nome}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: Math.min(i * 0.03, 0.5) }}
                              className={`border-b border-white/5 last:border-0 ${eMelhorDefesa ? 'bg-brasil-green/5' : ''}`}
                            >
                              <td className="px-4 py-2.5 font-medium text-zinc-200">
                                {eMelhorDefesa && <Shield className="mr-1.5 inline h-3.5 w-3.5 text-brasil-green" />}
                                {s.nome}
                              </td>
                              <td className="px-3 py-2.5 text-center text-zinc-400">{s.jogos}</td>
                              <td className="px-3 py-2.5 text-center text-zinc-300">{s.gols_marcados}</td>
                              <td className={`px-3 py-2.5 text-center ${eMelhorDefesa ? 'font-bold text-brasil-green' : 'text-zinc-400'}`}>
                                {s.gols_sofridos}
                              </td>
                              <td className={`px-3 py-2.5 text-center ${s.saldo > 0 ? 'text-green-400' : s.saldo < 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                                {s.saldo > 0 ? `+${s.saldo}` : s.saldo}
                              </td>
                            </motion.tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="mt-2 text-xs text-zinc-600">JG = jogos · GM = gols marcados · GS = gols sofridos · SG = saldo</p>
              </div>
            )}

            {/* ── ESCOLHAS DOS PARTICIPANTES ────────────────────────── */}
            {secao === 'escolhas' && (
              <div className="mt-8">
                {!revelarTudo && (
                  <div className="glass mb-4 flex items-center gap-3 p-4">
                    <Lock className="h-4 w-4 text-brasil-yellow" />
                    <span className="text-sm text-zinc-400">
                      Escolhas completamente reveladas após 27/06/2026 (fim da fase de grupos). Por enquanto, apenas o campeão escolhido é visível.
                    </span>
                  </div>
                )}
                {escolhas.length === 0 ? (
                  <p className="glass p-10 text-center text-zinc-500">Nenhuma escolha registrada ainda.</p>
                ) : (
                  <div className="glass overflow-x-auto">
                    <table className="w-full min-w-[48rem] text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-zinc-500">
                          <th className="px-4 py-3">Participante</th>
                          <th className="px-3 py-3">🏆 Campeão</th>
                          <th className="px-3 py-3">🥈 Vice</th>
                          <th className="px-3 py-3">🥉 3º</th>
                          <th className="px-3 py-3">⚽ Artilheiro</th>
                          <th className="px-3 py-3">🌟 Melhor jogador</th>
                        </tr>
                      </thead>
                      <tbody>
                        {escolhas.map((e, i) => {
                          const sou = user?.id === e.user_id
                          const fin = resultado?.finalizado ?? false
                          return (
                            <motion.tr
                              key={e.user_id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: Math.min(i * 0.04, 0.6) }}
                              className={`border-b border-white/5 last:border-0 ${sou ? 'bg-brasil-green/10' : ''}`}
                            >
                              <td className="px-4 py-3 font-medium text-zinc-200">
                                {e.username}
                                {sou && <span className="ml-2 text-xs text-brasil-green">você</span>}
                              </td>
                              <td className="px-3 py-3">
                                {fin && <span className="mr-1">{iconeStatus(e.campeao, resultado?.campeao ?? null, fin)}</span>}
                                {e.campeao || '—'}
                              </td>
                              {(['vice_campeao', 'terceiro', 'artilheiro', 'melhor_jogador'] as const).map((campo) => (
                                <td key={campo} className="px-3 py-3 text-zinc-300">
                                  {revelarTudo ? (
                                    <>
                                      {fin && <span className="mr-1">{iconeStatus(e[campo], resultado?.[campo] ?? null, fin)}</span>}
                                      {e[campo] || '—'}
                                    </>
                                  ) : (
                                    <span className="text-zinc-600"><Lock className="inline h-3.5 w-3.5" /></span>
                                  )}
                                </td>
                              ))}
                            </motion.tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── MINHAS ESCOLHAS ───────────────────────────────────── */}
            {secao === 'minhas' && user && (
              <div className="mt-8">
                {!minhaEscolha ? (
                  <p className="glass p-10 text-center text-zinc-500">Você ainda não fez suas escolhas especiais.</p>
                ) : (
                  <div className="glass p-6">
                    <h2 className="mb-4 font-semibold text-zinc-200">Suas apostas especiais</h2>
                    <div className="space-y-3">
                      {[
                        { campo: 'campeao', label: '🏆 Campeão', pts: 30 },
                        { campo: 'vice_campeao', label: '🥈 Vice-campeão', pts: 15 },
                        { campo: 'terceiro', label: '🥉 3º lugar', pts: 10 },
                        { campo: 'artilheiro', label: '⚽ Artilheiro', pts: 20 },
                        { campo: 'melhor_jogador', label: '🌟 Melhor jogador', pts: 15 },
                      ].map(({ campo, label, pts }) => {
                        const minha = minhaEscolha[campo as keyof MinhaEscolha]
                        const fin = resultado?.finalizado ?? false
                        const res = resultado?.[campo as keyof ResultadoEspecial] as string | null ?? null
                        const status = iconeStatus(minha, res, fin)
                        const acertou = fin && status === '✅'
                        return (
                          <div key={campo} className={`flex items-center justify-between rounded-xl px-4 py-3 ${acertou ? 'bg-brasil-green/10 ring-1 ring-brasil-green/30' : 'bg-white/[0.03]'}`}>
                            <div>
                              <p className="text-xs text-zinc-500">{label}</p>
                              <p className="font-medium text-zinc-200">{minha || '—'}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              {fin && (
                                <span className="text-sm">{status}</span>
                              )}
                              {acertou && (
                                <span className="font-display text-xl text-brasil-yellow">+{pts}</span>
                              )}
                              {!fin && (
                                <span className="flex items-center gap-1 text-xs text-zinc-600">
                                  <Star className="h-3 w-3" />
                                  {pts} pts
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {resultado?.finalizado && (
                      <div className="mt-4 rounded-xl bg-brasil-yellow/10 px-4 py-3 text-center">
                        <p className="text-xs text-zinc-400">Pontos especiais ganhos</p>
                        <p className="font-display text-4xl text-brasil-yellow">
                          {[
                            { campo: 'campeao', pts: 30 }, { campo: 'vice_campeao', pts: 15 },
                            { campo: 'terceiro', pts: 10 }, { campo: 'artilheiro', pts: 20 },
                            { campo: 'melhor_jogador', pts: 15 },
                          ].reduce((acc, { campo, pts }) => {
                            const minha = minhaEscolha[campo as keyof MinhaEscolha]
                            const res = resultado?.[campo as keyof ResultadoEspecial] as string | null
                            return acc + (minha && res && minha.toLowerCase().trim() === res.toLowerCase().trim() ? pts : 0)
                          }, 0)}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">de 90 possíveis</p>
                      </div>
                    )}
                    {!resultado?.finalizado && (
                      <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/5 px-4 py-3">
                        <Trophy className="h-4 w-4 text-zinc-500" />
                        <p className="text-sm text-zinc-500">Resultados revelados após o término da Copa</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  )
}
