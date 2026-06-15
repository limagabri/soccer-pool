import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'
import { AuthBackground } from '../components/AuthBackground'
import { APP_FULL_NAME } from '../config/app'

interface ConviteInfo {
  id: string
  email: string
  nome: string
  token: string
}

export function Cadastro() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [convite, setConvite] = useState<ConviteInfo | null>(null)
  const [conviteStatus, setConviteStatus] = useState<'carregando' | 'valido' | 'invalido' | 'sem-token'>('carregando')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  useEffect(() => {
    if (!token) { setConviteStatus('sem-token'); return }

    supabase
      .from('convites')
      .select('id, email, nome, token')
      .eq('token', token)
      .eq('usado', false)
      .gt('expires_at', new Date().toISOString())
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setConviteStatus('invalido'); return }
        setConvite(data as ConviteInfo)
        setConviteStatus('valido')
      })
  }, [token])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!convite) return
    setError(null)

    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.')
      return
    }

    try {
      setLoading(true)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: convite.email,
        password,
        options: {
          data: { username: convite.nome },
          emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}/auth/callback`,
        },
      })
      setLoading(false)

      if (signUpError) {
        const msg = signUpError.message.toLowerCase()
        if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('email already')) {
          setError('Este e-mail já está cadastrado.')
        } else if (msg.includes('rate limit') || (signUpError as { status?: number }).status === 429) {
          setError('Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente.')
        } else {
          setError('Não foi possível criar a conta. Tente novamente.')
        }
        return
      }

      // Marca convite como usado independente da confirmação de e-mail
      await supabase.rpc('marcar_convite_usado', { p_token: convite.token, p_email: convite.email })

      if (!data.session) {
        setConfirmationSent(true)
        return
      }

      // User created their own password — no need to change it on first access
      if (data.user) {
        await supabase.from('profiles').update({ senha_trocada: true }).eq('id', data.user.id)
      }

      navigate('/primeiro-acesso')
    } catch {
      setLoading(false)
      setError('Não foi possível criar a conta. Tente novamente.')
    }
  }

  // ── Estados de tela ───────────────────────────────────────────────────────

  if (conviteStatus === 'carregando') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brasil-green border-t-transparent" />
      </div>
    )
  }

  if (conviteStatus === 'sem-token') {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        <AuthBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass relative z-10 w-full max-w-md p-8 text-center"
        >
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-brasil-yellow" />
          <h1 className="font-display text-4xl tracking-wide">Acesso por convite</h1>
          <p className="mt-3 text-zinc-400">
            O {APP_FULL_NAME} é um bolão fechado. Para participar, você precisa de um convite enviado pelo organizador.
          </p>
          <Link to="/login" className="mt-6 inline-block text-sm text-brasil-green hover:underline">
            Já tenho conta — fazer login →
          </Link>
        </motion.div>
      </div>
    )
  }

  if (conviteStatus === 'invalido') {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        <AuthBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass relative z-10 w-full max-w-md p-8 text-center"
        >
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h1 className="font-display text-4xl tracking-wide">Convite inválido</h1>
          <p className="mt-3 text-zinc-400">
            Este link de convite é inválido, já foi utilizado ou expirou. Peça um novo convite ao organizador.
          </p>
          <Link to="/login" className="mt-6 inline-block text-sm text-zinc-500 hover:text-zinc-300">
            Voltar para o login
          </Link>
        </motion.div>
      </div>
    )
  }

  if (confirmationSent) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        <AuthBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass relative z-10 w-full max-w-md p-8 text-center"
        >
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-brasil-green" />
          <h1 className="font-display text-4xl tracking-wide">Confirme seu e-mail</h1>
          <p className="mt-2 text-zinc-400">
            Enviamos um link de confirmação para <strong>{convite?.email}</strong>.
            Depois de confirmar, é só fazer login!
          </p>
          <Link
            to="/login"
            className="btn-gradient mt-6 inline-block rounded-lg px-6 py-2.5 font-bold text-black"
          >
            Ir para o login
          </Link>
        </motion.div>
      </div>
    )
  }

  // ── Formulário de cadastro ────────────────────────────────────────────────

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <AuthBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass relative z-10 w-full max-w-md p-8"
      >
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <h1 className="text-center font-display text-4xl tracking-wide">Criar conta</h1>
        <p className="mt-1 text-center text-sm text-zinc-400">
          Você foi convidado para o {APP_FULL_NAME}!
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">
              Nome de usuário
            </label>
            <div className="relative">
              <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                readOnly
                value={convite?.nome ?? ''}
                className="input-glow cursor-not-allowed opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">E-mail</label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                readOnly
                value={convite?.email ?? ''}
                className="input-glow cursor-not-allowed opacity-60"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-zinc-300">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="input-glow"
              />
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gradient flex w-full items-center justify-center gap-2 rounded-lg py-3 font-bold text-black disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar conta
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Já tem conta?{' '}
          <Link to="/login" className="font-semibold text-brasil-yellow hover:underline">
            Entrar
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
