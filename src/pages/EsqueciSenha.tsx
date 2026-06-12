import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Loader2, CheckCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'
import { AuthBackground } from '../components/AuthBackground'

export function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setLoading(true)

    const redirectTo =
      `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}/nova-senha`

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    setLoading(false)

    if (error) {
      setErro('Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.')
      return
    }
    setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        <AuthBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass relative z-10 w-full max-w-md p-8 text-center"
        >
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-brasil-green" />
          <h1 className="font-display text-4xl tracking-wide">Verifique seu e-mail</h1>
          <p className="mt-3 text-zinc-400">
            Enviamos um link para <strong className="text-zinc-200">{email}</strong>.
            Clique no link para criar uma nova senha.
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            Não recebeu? Verifique a pasta de spam ou tente novamente.
          </p>
          <button
            onClick={() => setEnviado(false)}
            className="mt-6 text-sm text-brasil-green hover:underline"
          >
            Tentar com outro e-mail
          </button>
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
          Esqueci minha senha
        </h1>
        <p className="mt-1 text-center text-sm text-zinc-400">
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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

          {erro && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gradient flex w-full items-center justify-center gap-2 rounded-lg py-3 font-bold text-black disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Enviar link de recuperação
          </button>
        </form>

        <Link
          to="/login"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o login
        </Link>
      </motion.div>
    </div>
  )
}
