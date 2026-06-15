import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check, Loader2, Trophy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from '../components/Logo'

const SELECOES = [
  'África do Sul', 'Alemanha', 'Arábia Saudita', 'Argélia', 'Argentina',
  'Austrália', 'Áustria', 'Bélgica', 'Bósnia-Herzegóvina', 'Brasil',
  'Cabo Verde', 'Canadá', 'Catar', 'Colômbia', 'Coreia do Sul',
  'Costa do Marfim', 'Croácia', 'Curaçao', 'Egito', 'Equador',
  'Escócia', 'Espanha', 'Estados Unidos', 'França', 'Gana',
  'Haiti', 'Holanda', 'Inglaterra', 'Irã', 'Iraque',
  'Japão', 'Jordânia', 'Kosovo', 'Marrocos', 'México',
  'Noruega', 'Nova Zelândia', 'Panamá', 'Paraguai', 'Portugal',
  'RD Congo', 'Rep. Tcheca', 'Senegal', 'Suécia', 'Suíça',
  'Tunísia', 'Turquia', 'Uruguai', 'Uzbequistão',
]

function CampoSelecao({
  label, emoji, value, onChange, livre = false
}: {
  label: string; emoji: string; value: string; onChange: (v: string) => void; livre?: boolean
}) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')

  const opcoes = SELECOES.filter((s) => s.toLowerCase().includes(busca.toLowerCase()))

  if (livre) {
    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-300">
          {emoji} {label}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Nome do jogador"
          className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-brasil-green"
        />
      </div>
    )
  }

  return (
    <div className="relative">
      <label className="mb-1.5 block text-sm font-medium text-zinc-300">
        {emoji} {label}
      </label>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-left outline-none transition focus:border-brasil-green"
      >
        <span className={value ? 'text-zinc-100' : 'text-zinc-600'}>{value || 'Selecionar seleção…'}</span>
        <ArrowRight className={`h-4 w-4 shrink-0 text-zinc-600 transition ${aberto ? 'rotate-90' : ''}`} />
      </button>
      {aberto && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 shadow-2xl">
          <input
            autoFocus
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar…"
            className="w-full rounded-t-lg border-b border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          />
          <div className="max-h-48 overflow-y-auto p-1">
            {opcoes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { onChange(s); setAberto(false); setBusca('') }}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                  value === s ? 'bg-brasil-green/20 text-brasil-green' : 'text-zinc-300 hover:bg-white/5'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const stepVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
}

interface Escolhas {
  campeao: string
  vice_campeao: string
  terceiro: string
  artilheiro: string
  melhor_jogador: string
}

export function PrimeiroAcesso() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Step 0: escolhas especiais
  const [escolhas, setEscolhas] = useState<Escolhas>({
    campeao: '', vice_campeao: '', terceiro: '',
    artilheiro: '', melhor_jogador: '',
  })

  const username =
    profile?.username ?? user?.user_metadata?.username ?? user?.email?.split('@')[0] ?? 'participante'

  useEffect(() => {
    // Se já completou o primeiro acesso, vai pro dashboard
    if (profile && !profile.primeiro_acesso) navigate('/dashboard', { replace: true })
  }, [profile, navigate])

  async function concluirEscolhas() {
    setErro(null)
    const vals = Object.values(escolhas)
    if (vals.some((v) => !v.trim())) { setErro('Preencha todos os campos de escolhas especiais.'); return }

    setLoading(true)
    const { error } = await supabase.from('escolhas_especiais').upsert(
      { user_id: user!.id, ...escolhas },
      { onConflict: 'user_id' }
    )
    if (error) { setErro('Erro ao salvar escolhas. Tente novamente.'); setLoading(false); return }
    setLoading(false)
    setStep(1)
  }

  async function concluir() {
    setLoading(true)
    await supabase.from('profiles').update({ primeiro_acesso: false }).eq('id', user!.id)
    await refreshProfile()
    navigate('/dashboard', { replace: true })
  }

  const STEPS = [
    {
      titulo: `Bem-vindo, ${username}!`,
      subtitulo: 'Faça suas apostas especiais antes de começar. Valem pontos bônus!',
    },
    {
      titulo: 'Tudo certo!',
      subtitulo: 'Suas escolhas foram salvas. Agora vá dar seus palpites!',
    },
  ]

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-brasil-green/10 blur-3xl" />
        <div className="absolute -right-40 -bottom-40 h-[32rem] w-[32rem] rounded-full bg-brasil-yellow/8 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  i < step
                    ? 'bg-brasil-green text-black'
                    : i === step
                      ? 'bg-brasil-green/20 text-brasil-green ring-2 ring-brasil-green/50'
                      : 'bg-white/5 text-zinc-600'
                }`}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < 1 && <div className={`h-0.5 w-10 ${i < step ? 'bg-brasil-green' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        <div className="glass overflow-hidden p-6 sm:p-8">
          <div className="mb-6">
            <h1 className="font-display text-3xl tracking-wide sm:text-4xl">{STEPS[step].titulo}</h1>
            <p className="mt-1 text-sm text-zinc-400">{STEPS[step].subtitulo}</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              {/* STEP 0: Escolhas especiais */}
              {step === 0 && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <CampoSelecao label="Campeão" emoji="🏆" value={escolhas.campeao} onChange={(v) => setEscolhas((e) => ({ ...e, campeao: v }))} />
                    <CampoSelecao label="Vice-campeão" emoji="🥈" value={escolhas.vice_campeao} onChange={(v) => setEscolhas((e) => ({ ...e, vice_campeao: v }))} />
                  </div>
                  <CampoSelecao label="3º lugar" emoji="🥉" value={escolhas.terceiro} onChange={(v) => setEscolhas((e) => ({ ...e, terceiro: v }))} />
                  <CampoSelecao label="Artilheiro" emoji="⚽" value={escolhas.artilheiro} onChange={(v) => setEscolhas((e) => ({ ...e, artilheiro: v }))} livre />
                  <CampoSelecao label="Melhor jogador da Copa" emoji="🌟" value={escolhas.melhor_jogador} onChange={(v) => setEscolhas((e) => ({ ...e, melhor_jogador: v }))} livre />

                  {erro && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{erro}</p>}

                  <button
                    onClick={concluirEscolhas}
                    disabled={loading}
                    className="btn-gradient mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-black disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    Confirmar escolhas
                  </button>
                </div>
              )}

              {/* STEP 1: Confirmação */}
              {step === 1 && (
                <div>
                  <div className="mb-6 rounded-xl bg-brasil-green/5 p-4">
                    <p className="mb-3 text-sm font-medium text-zinc-400">Suas apostas especiais:</p>
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">🏆 Campeão</span>
                        <span className="font-semibold text-zinc-200">{escolhas.campeao}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">🥈 Vice-campeão</span>
                        <span className="font-semibold text-zinc-200">{escolhas.vice_campeao}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">🥉 3º lugar</span>
                        <span className="font-semibold text-zinc-200">{escolhas.terceiro}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">⚽ Artilheiro</span>
                        <span className="font-semibold text-zinc-200">{escolhas.artilheiro}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">🌟 Melhor jogador</span>
                        <span className="font-semibold text-zinc-200">{escolhas.melhor_jogador}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={concluir}
                    disabled={loading}
                    className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-black disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
                    Ir para os palpites!
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
