import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Loader2, Target, Trophy, Users, Zap } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface MetricsData {
  totalParticipantes: number
  totalPalpites: number
  totalJogos: number
  totalAcertosExatos: number
  lider: string
  liderPontos: number
  proximoJogo: string | null
}

interface Palpite { user_id: string; jogo_id: string; pontos: number; gols_casa: number; gols_fora: number }
interface Profile { id: string; username: string }
interface Jogo { id: string; rodada: number; encerrado: boolean; data_jogo: string; time_casa: string; time_fora: string }

function MetricCard({ icon, label, value, sub, color = 'text-brasil-green' }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="mb-3 inline-flex rounded-lg bg-green-900/20 p-2.5 text-brasil-green">{icon}</div>
      <p className="text-xs tracking-wider text-zinc-500 uppercase">{label}</p>
      <p className={`mt-1 font-display text-4xl ${color}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
    </div>
  )
}

export function AdminDashboard() {
  const [palpites, setPalpites]   = useState<Palpite[]>([])
  const [profiles, setProfiles]   = useState<Profile[]>([])
  const [jogos, setJogos]         = useState<Jogo[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('palpites').select('user_id, jogo_id, pontos, gols_casa, gols_fora'),
      supabase.from('profiles').select('id, username'),
      supabase.from('jogos').select('id, rodada, encerrado, data_jogo, time_casa, time_fora').order('data_jogo'),
    ]).then(([p, pr, j]) => {
      setPalpites((p.data as Palpite[]) ?? [])
      setProfiles((pr.data as Profile[]) ?? [])
      setJogos((j.data as Jogo[]) ?? [])
      setLoading(false)
    })
  }, [])

  const nomeMap = useMemo(
    () => Object.fromEntries(profiles.map(p => [p.id, p.username ?? 'Anônimo'])),
    [profiles]
  )

  const metrics: MetricsData = useMemo(() => {
    const pontosPorUser: Record<string, number> = {}
    let acertosExatos = 0
    for (const p of palpites) {
      pontosPorUser[p.user_id] = (pontosPorUser[p.user_id] ?? 0) + (p.pontos ?? 0)
      if (p.pontos === 10) acertosExatos++
    }
    const [liderUid, liderPts] = Object.entries(pontosPorUser).sort((a, b) => b[1] - a[1])[0] ?? ['', 0]
    const proxJogo = jogos.find(j => !j.encerrado)

    return {
      totalParticipantes: profiles.length,
      totalPalpites: palpites.length,
      totalJogos: jogos.filter(j => j.encerrado).length,
      totalAcertosExatos: acertosExatos,
      lider: nomeMap[liderUid] ?? '—',
      liderPontos: liderPts,
      proximoJogo: proxJogo
        ? `${proxJogo.time_casa} × ${proxJogo.time_fora}`
        : 'Copa encerrada',
    }
  }, [palpites, profiles, jogos, nomeMap])

  // Chart 1: palpites por rodada
  const palpitesPorRodada = useMemo(() => {
    const jogoRodada = Object.fromEntries(jogos.map(j => [j.id, j.rodada]))
    const mapa: Record<number, Set<string>> = {}
    for (const p of palpites) {
      const r = jogoRodada[p.jogo_id]
      if (!r) continue
      if (!mapa[r]) mapa[r] = new Set()
      mapa[r].add(p.user_id)
    }
    return Object.entries(mapa)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([r, set]) => ({ rodada: `R${r}`, usuarios: set.size }))
  }, [palpites, jogos])

  // Chart 2: distribuição de pontos
  const distribuicaoPontos = useMemo(() => {
    const pontosPorUser: Record<string, number> = {}
    for (const p of palpites)
      pontosPorUser[p.user_id] = (pontosPorUser[p.user_id] ?? 0) + (p.pontos ?? 0)
    const buckets: Record<string, number> = { '0-19': 0, '20-49': 0, '50-99': 0, '100-149': 0, '150+': 0 }
    for (const pts of Object.values(pontosPorUser)) {
      if (pts < 20) buckets['0-19']++
      else if (pts < 50) buckets['20-49']++
      else if (pts < 100) buckets['50-99']++
      else if (pts < 150) buckets['100-149']++
      else buckets['150+']++
    }
    return Object.entries(buckets).map(([range, count]) => ({ range, count }))
  }, [palpites])

  // Engagement table
  const engajamento = useMemo(() => {
    const pontosPorUser: Record<string, number> = {}
    const palpitesPorUser: Record<string, number> = {}
    for (const p of palpites) {
      pontosPorUser[p.user_id] = (pontosPorUser[p.user_id] ?? 0) + (p.pontos ?? 0)
      palpitesPorUser[p.user_id] = (palpitesPorUser[p.user_id] ?? 0) + 1
    }
    const totalJogos = jogos.length || 72
    return Object.keys(palpitesPorUser)
      .map(uid => ({
        nome: nomeMap[uid] ?? 'Anônimo',
        palpites: palpitesPorUser[uid],
        participacao: Math.round((palpitesPorUser[uid] / totalJogos) * 100),
        pontos: pontosPorUser[uid] ?? 0,
      }))
      .sort((a, b) => b.pontos - a.pontos)
      .map((u, i) => ({ ...u, posicao: i + 1 }))
  }, [palpites, nomeMap, jogos])

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
    </div>
  )

  const acuraciaMedia = palpites.length > 0
    ? Math.round((palpites.filter(p => (p.pontos ?? 0) > 0).length / palpites.length) * 100)
    : 0

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard icon={<Users className="h-5 w-5" />} label="Participantes" value={metrics.totalParticipantes} />
        <MetricCard icon={<Zap className="h-5 w-5" />} label="Palpites" value={metrics.totalPalpites}
          sub={`de ${metrics.totalParticipantes * 72} possíveis`} />
        <MetricCard icon={<Target className="h-5 w-5" />} label="Acertos exatos" value={metrics.totalAcertosExatos}
          color="text-brasil-yellow" />
        <MetricCard icon={<Zap className="h-5 w-5" />} label="Acurácia média" value={`${acuraciaMedia}%`}
          color="text-brasil-yellow" />
        <MetricCard icon={<Trophy className="h-5 w-5" />} label="Líder" value={metrics.lider}
          sub={`${metrics.liderPontos} pontos`} />
        <MetricCard icon={<Zap className="h-5 w-5" />} label="Próximo jogo" value=""
          sub={metrics.proximoJogo ?? '—'} />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="mb-4 text-sm font-semibold text-zinc-400 uppercase tracking-wider">Usuários por Rodada</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={palpitesPorRodada} barCategoryGap="30%">
              <XAxis dataKey="rodada" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} labelStyle={{ color: '#e4e4e7' }} />
              <Bar dataKey="usuarios" radius={[4, 4, 0, 0]}>
                {palpitesPorRodada.map((_, i) => <Cell key={i} fill="#00c853" fillOpacity={0.7 + i * 0.03} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="mb-4 text-sm font-semibold text-zinc-400 uppercase tracking-wider">Distribuição de Pontos</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={distribuicaoPontos} barCategoryGap="30%">
              <XAxis dataKey="range" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} labelStyle={{ color: '#e4e4e7' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#ffd600" fillOpacity={0.75} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Engagement table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-x-auto">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-xs tracking-wider text-zinc-500 uppercase">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3 text-center">Palpites</th>
              <th className="px-4 py-3 text-center">Participação</th>
              <th className="px-4 py-3 text-center">Pontos</th>
            </tr>
          </thead>
          <tbody>
            {engajamento.map(u => (
              <tr key={u.nome} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30">
                <td className="px-4 py-3 text-zinc-500">{u.posicao}</td>
                <td className="px-4 py-3 font-medium text-zinc-200">{u.nome}</td>
                <td className="px-4 py-3 text-center text-zinc-400">{u.palpites}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-semibold ${u.participacao >= 80 ? 'text-brasil-green' : u.participacao >= 50 ? 'text-brasil-yellow' : 'text-zinc-500'}`}>
                    {u.participacao}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-bold text-brasil-yellow">{u.pontos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
