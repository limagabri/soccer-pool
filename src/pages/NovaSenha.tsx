import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Loader2, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'
import { AuthBackground } from '../components/AuthBackground'

type Estado = 'aguardando' | 'pronto' | 'sucesso' | 'invalido'

export function NovaSenha() {
  const navigate = useNavigate()
  const [estado, setEstado] = useState<Estado>('aguardando')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // O Supabase processa o hash/code da URL automaticamente e emite PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setEstado('pronto')
    })

    // Se já tem sessão de recovery (ex: reload da página)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setEstado('pronto')
    })

    // Timeout: se não recebeu o evento em 8s, link inválido
    const timeout = setTimeout(() => {
      setEstado((atual) => (atual === 'aguardando' ? 'invalido' : atual))
    }, 8000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)

    if (senha.length < 8) { setErro('A senha deve ter pelo menos 8 caracteres.'); return }
    if (!/\d/.test(senha)) { setErro('A senha deve conter pelo menos 1 número.'); return }
    if (senha !== confirmar) { setErro('As senhas não coincidem.'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setLoading(false)

    if (error) {
      setErro('Não foi possível atualizar a senha. O link pode ter expirado.')
      return
    }
    setEstado('sucesso')
    setTimeout(() => navigate('/dashboard', { replace: true }), 2500)
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

        {estado === 'aguardando' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brasil-green border-t-transparent" />
            <p className="text-sm text-zinc-400">Validando link de recuperação…</p>
          </div>
        )}

        {estado === 'invalido' && (
          <div className="py-4 text-center">
            <p className="font-display text-3xl">Link inválido</p>
            <p className="mt-2 text-sm text-zinc-400">
              Este link expirou ou já foi usado. Solicite um novo link de recuperação.
            </p>
            <button
              onClick={() => navigate('/esqueci-senha')}
              className="btn-gradient mt-6 rounded-lg px-6 py-2.5 font-bold text-black"
            >
              Solicitar novo link
            </button>
          </div>
        )}

        {estado === 'sucesso' && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <CheckCircle className="h-12 w-12 text-brasil-green" />
            <p className="font-display text-4xl tracking-wide">Senha atualizada!</p>
            <p className="text-sm text-zinc-400">Redirecionando para o dashboard…</p>
          </div>
        )}

        {estado === 'pronto' && (
          <>
            <h1 className="text-center font-display text-4xl tracking-wide">Nova senha</h1>
            <p className="mt-1 text-center text-sm text-zinc-400">
              Escolha uma senha forte para proteger sua conta.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label htmlFor="senha" className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Nova senha
                </label>
                <div className="relative">
                  <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="senha"
                    type="password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo 8 chars + 1 número"
                    className="input-glow"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmar" className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Confirmar senha
                </label>
                <div className="relative">
                  <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="confirmar"
                    type="password"
                    required
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    placeholder="Repita a senha"
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
                Salvar nova senha
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  )
}
