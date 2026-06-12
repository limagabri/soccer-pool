import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Loader2, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from '../components/Logo'
import { AuthBackground } from '../components/AuthBackground'

export function Cadastro() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (username.trim().length < 3) {
      setError('O nome de usuário precisa ter pelo menos 3 caracteres.')
      return
    }

    setLoading(true)
    const { error, needsConfirmation } = await signUp(
      email,
      password,
      username.trim()
    )
    setLoading(false)

    if (error) {
      setError(
        error.includes('already registered')
          ? 'Este e-mail já está cadastrado.'
          : 'Não foi possível criar a conta. Tente novamente.'
      )
      return
    }

    if (needsConfirmation) {
      setConfirmationSent(true)
      return
    }

    navigate('/dashboard')
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
            Enviamos um link de confirmação para <strong>{email}</strong>.
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

        <h1 className="text-center font-display text-4xl tracking-wide">
          Crie sua conta
        </h1>
        <p className="mt-1 text-center text-sm text-zinc-400">
          Entre na disputa pelo título de craque dos palpites
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-zinc-300">
              Nome de usuário
            </label>
            <div className="relative">
              <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="craque_do_bolao"
                className="input-glow"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-300">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                className="input-glow"
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
