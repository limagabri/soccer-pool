import { useMemo } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import type { EntradaHistorico } from '../hooks/useRankingHistorico'

const CORES = [
  '#00c853', '#ffd700', '#64b5f6', '#ef5350',
  '#ab47bc', '#26c6da', '#ff7043', '#9ccc65',
  '#f06292', '#4db6ac',
]

interface Props {
  historico: EntradaHistorico[]
  usernames: Record<string, string>
}

export function GraficoRanking({ historico, usernames }: Props) {
  const { t } = useTranslation()
  const datas = useMemo(
    () => [...new Set(historico.map((h) => h.data))].sort(),
    [historico]
  )

  const userIds = useMemo(
    () => [...new Set(historico.map((h) => h.user_id))],
    [historico]
  )

  const data = useMemo(
    () =>
      datas.map((date) => {
        const ponto: Record<string, string | number> = { date }
        for (const uid of userIds) {
          const entry = historico.find((h) => h.user_id === uid && h.data === date)
          if (entry) ponto[uid] = entry.posicao
        }
        return ponto
      }),
    [datas, userIds, historico]
  )

  if (datas.length < 2) {
    return (
      <p className="py-6 text-center text-sm text-zinc-600">
        {t('ranking.noHistory')}
      </p>
    )
  }

  const maxPos = Math.max(...historico.map((h) => h.posicao))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#71717a', fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
        />
        <YAxis
          reversed
          domain={[1, maxPos]}
          allowDecimals={false}
          tick={{ fill: '#71717a', fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v}º`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#18181b',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
          formatter={(value, key) => [
            `${value ?? '?'}º lugar`,
            usernames[String(key)] ?? String(key),
          ]}
        />
        <Legend
          formatter={(key) => (
            <span style={{ color: '#a1a1aa', fontSize: '12px' }}>
              {usernames[String(key)] ?? String(key)}
            </span>
          )}
        />
        {userIds.map((uid, i) => (
          <Line
            key={uid}
            type="monotone"
            dataKey={uid}
            name={uid}
            stroke={CORES[i % CORES.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
