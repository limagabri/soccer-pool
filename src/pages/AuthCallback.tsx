import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleCallback() {
      // Tokens vêm no hash da URL: #access_token=...&refresh_token=...&type=signup
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const errorDescription = hashParams.get('error_description')

      if (errorDescription) {
        setError(errorDescription)
        setTimeout(() => navigate('/login', { replace: true }), 2500)
        return
      }

      if (!accessToken || !refreshToken) {
        // Sem tokens no hash: verifica se já existe sessão (detectSessionInUrl)
        const {
          data: { session },
        } = await supabase.auth.getSession()
        navigate(session ? '/dashboard' : '/login', { replace: true })
        return
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      // Limpa os tokens da URL
      window.history.replaceState(null, '', window.location.pathname)

      if (error) {
        setError('Não foi possível confirmar sua conta. Tente fazer login.')
        setTimeout(() => navigate('/login', { replace: true }), 2500)
        return
      }

      navigate('/dashboard', { replace: true })
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      {error ? (
        <>
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
          <p className="text-sm text-zinc-500">Redirecionando para o login…</p>
        </>
      ) : (
        <>
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brasil-green border-t-transparent" />
          <p className="text-sm text-zinc-400">Confirmando sua conta…</p>
        </>
      )}
    </div>
  )
}
