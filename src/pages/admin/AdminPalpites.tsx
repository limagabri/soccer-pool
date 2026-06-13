import { useEffect, useState } from 'react'
import { Loader2, Copy, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Profile {
  id: string
  username: string
}

interface Jogo {
  id: string
  numero_jogo: number
  time_casa: string
  time_fora: string
  emoji_casa: string
  emoji_fora: string
  data_jogo: string
  rodada: number
  gols_casa: number | null
  gols_fora: number | null
  encerrado: boolean
}

interface PalpiteDB {
  jogo_id: string
  gols_casa: number
  gols_fora: number
  pontos: number | null
}

type Edits = Record<string, { gols_casa: string; gols_fora: string }>

function calcPontos(gc: string, gf: string, rGc: number | null, rGf: number | null): number | null {
  if (rGc == null || rGf == null) return null
  const a = parseInt(gc), b = parseInt(gf)
  if (isNaN(a) || isNaN(b)) return null
  if (a === rGc && b === rGf) return 10
  const win = (x: number, y: number) => x > y ? 1 : x < y ? -1 : 0
  return win(a, b) === win(rGc, rGf) ? 5 : 0
}

function pontosBadge(pts: number | null) {
  if (pts === null) return null
  const cls = pts === 10 ? 'bg-green-900/50 text-green-400' : pts === 5 ? 'bg-yellow-900/50 text-yellow-400' : 'bg-red-900/30 text-red-500'
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${cls}`}>{pts} pts</span>
}

export function AdminPalpites() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedUser, setSelectedUser] = useState('')
  const [rodada, setRodada] = useState(1)
  const [jogos, setJogos] = useState<Jogo[]>([])
  const [edits, setEdits] = useState<Edits>({})
  const [copyUser, setCopyUser] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, username')
      .eq('is_admin', false)
      .order('username')
      .then(({ data }) => {
        const list = (data ?? []) as Profile[]
        setProfiles(list)
        if (list.length > 0) setSelectedUser(list[0].id)
      })
  }, [])

  useEffect(() => {
    if (!rodada) return
    supabase
      .from('jogos')
      .select('id, numero_jogo, time_casa, time_fora, emoji_casa, emoji_fora, data_jogo, rodada, gols_casa, gols_fora, encerrado')
      .eq('rodada', rodada)
      .order('numero_jogo')
      .then(({ data }) => setJogos((data ?? []) as Jogo[]))
  }, [rodada])

  useEffect(() => {
    if (!selectedUser || jogos.length === 0) return
    const jogoIds = jogos.map(j => j.id)
    supabase
      .from('palpites')
      .select('jogo_id, gols_casa, gols_fora, pontos')
      .eq('user_id', selectedUser)
      .in('jogo_id', jogoIds)
      .then(({ data }) => {
        const mapa: Edits = {}
        for (const j of jogos) mapa[j.id] = { gols_casa: '', gols_fora: '' }
        for (const p of (data ?? []) as PalpiteDB[]) {
          mapa[p.jogo_id] = { gols_casa: String(p.gols_casa), gols_fora: String(p.gols_fora) }
        }
        setEdits(mapa)
      })
  }, [selectedUser, jogos])

  async function copiarDe() {
    if (!copyUser || copyUser === selectedUser || jogos.length === 0) return
    const jogoIds = jogos.map(j => j.id)
    const { data } = await supabase
      .from('palpites')
      .select('jogo_id, gols_casa, gols_fora')
      .eq('user_id', copyUser)
      .in('jogo_id', jogoIds)
    const copia: Edits = { ...edits }
    for (const p of (data ?? []) as PalpiteDB[]) {
      copia[p.jogo_id] = { gols_casa: String(p.gols_casa), gols_fora: String(p.gols_fora) }
    }
    setEdits(copia)
    setMsg({ ok: true, text: `Palpites copiados de ${profiles.find(p => p.id === copyUser)?.username ?? ''}` })
    setTimeout(() => setMsg(null), 3000)
  }

  async function salvar() {
    if (!selectedUser) return
    setSaving(true)
    setMsg(null)

    const palpites = Object.entries(edits)
      .filter(([, v]) => v.gols_casa !== '' && v.gols_fora !== '')
      .map(([jogo_id, v]) => ({
        jogo_id,
        gols_casa: parseInt(v.gols_casa),
        gols_fora: parseInt(v.gols_fora),
      }))
      .filter(p => !isNaN(p.gols_casa) && !isNaN(p.gols_fora))

    if (palpites.length === 0) {
      setMsg({ ok: false, text: 'Nenhum palpite preenchido.' })
      setSaving(false)
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('admin-upsert-palpites', {
        body: { user_id: selectedUser, palpites },
      })
      if (error) throw error
      const username = profiles.find(p => p.id === selectedUser)?.username ?? 'jogador'
      setMsg({ ok: true, text: `${data.count} palpite(s) salvos para ${username} · ${data.recalculated} jogo(s) recalculado(s)` })
    } catch (err) {
      setMsg({ ok: false, text: String(err) })
    }

    setSaving(false)
    setTimeout(() => setMsg(null), 6000)
  }

  function setGols(jogoId: string, field: 'gols_casa' | 'gols_fora', val: string) {
    if (val !== '' && (isNaN(Number(val)) || Number(val) < 0 || Number(val) > 99)) return
    setEdits(prev => ({ ...prev, [jogoId]: { ...prev[jogoId], [field]: val } }))
  }

  const userName = profiles.find(p => p.id === selectedUser)?.username ?? '—'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-100">Palpites Retroativos</h1>

      {/* Selectors */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-500">Jogador</label>
          <select
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-green-600"
          >
            {profiles.map(p => (
              <option key={p.id} value={p.id}>{p.username}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-500">Rodada</label>
          <div className="flex gap-1">
            {[1, 2, 3].map(r => (
              <button
                key={r}
                onClick={() => setRodada(r)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  rodada === r
                    ? 'border-green-600 bg-green-900/30 text-green-400'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                }`}
              >
                R{r}
              </button>
            ))}
          </div>
        </div>

        {/* Copy from */}
        <div className="ml-auto flex items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">Copiar palpites de</label>
            <select
              value={copyUser}
              onChange={e => setCopyUser(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-400 outline-none focus:border-green-600"
            >
              <option value="">— selecionar —</option>
              {profiles.filter(p => p.id !== selectedUser).map(p => (
                <option key={p.id} value={p.id}>{p.username}</option>
              ))}
            </select>
          </div>
          <button
            onClick={copiarDe}
            disabled={!copyUser}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-40"
          >
            <Copy className="h-3.5 w-3.5" />
            Copiar
          </button>
        </div>
      </div>

      {msg && (
        <p className={`rounded-lg border px-4 py-2 text-sm ${
          msg.ok
            ? 'border-green-700/40 bg-green-900/20 text-green-400'
            : 'border-red-700/40 bg-red-900/20 text-red-400'
        }`}>
          {msg.text}
        </p>
      )}

      {/* Games grid */}
      {jogos.length === 0 ? (
        <p className="text-sm text-zinc-600">Nenhum jogo encontrado para Rodada {rodada}.</p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Palpites de <span className="text-zinc-300">{userName}</span> — Rodada {rodada}
          </p>

          <div className="overflow-hidden rounded-xl border border-zinc-800">
            {jogos.map((jogo, i) => {
              const edit = edits[jogo.id] ?? { gols_casa: '', gols_fora: '' }
              const pts = calcPontos(edit.gols_casa, edit.gols_fora, jogo.gols_casa, jogo.gols_fora)
              const dataFmt = new Date(jogo.data_jogo).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
              })

              return (
                <div
                  key={jogo.id}
                  className={`flex flex-wrap items-center gap-3 px-4 py-3 ${
                    i < jogos.length - 1 ? 'border-b border-zinc-800' : ''
                  }`}
                >
                  {/* Game info */}
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{jogo.emoji_casa}</span>
                      <span className="text-sm font-medium text-zinc-200">{jogo.time_casa}</span>
                      <span className="text-xs text-zinc-600">×</span>
                      <span className="text-sm font-medium text-zinc-200">{jogo.time_fora}</span>
                      <span className="text-base">{jogo.emoji_fora}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-600">{dataFmt}</span>
                      {jogo.encerrado && jogo.gols_casa != null && (
                        <span className="rounded-sm bg-zinc-800 px-1.5 py-0.5 text-xs font-bold text-zinc-400">
                          {jogo.gols_casa}–{jogo.gols_fora}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score inputs */}
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={edit.gols_casa}
                      onChange={e => setGols(jogo.id, 'gols_casa', e.target.value)}
                      placeholder="—"
                      className="w-12 rounded-lg border border-zinc-700 bg-zinc-800 py-1.5 text-center text-sm text-zinc-100 outline-none focus:border-green-600 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="text-xs font-bold text-zinc-600">×</span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={edit.gols_fora}
                      onChange={e => setGols(jogo.id, 'gols_fora', e.target.value)}
                      placeholder="—"
                      className="w-12 rounded-lg border border-zinc-700 bg-zinc-800 py-1.5 text-center text-sm text-zinc-100 outline-none focus:border-green-600 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <div className="w-14 text-right">{pontosBadge(pts)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Save button */}
      {jogos.length > 0 && (
        <button
          onClick={salvar}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-brasil-green/80 px-5 py-2.5 text-sm font-bold text-black transition hover:bg-brasil-green disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar palpites de {userName}
        </button>
      )}
    </div>
  )
}
