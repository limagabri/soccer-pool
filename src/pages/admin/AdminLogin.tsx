import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Loader2, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LangToggle } from '../../components/LangToggle'
import { supabase } from '../../lib/supabase'
import { APP_FULL_NAME } from '../../config/app'

export function AdminLogin() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError || !data.user) {
      setError(t('auth.invalidCredentials'))
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', data.user.id)
      .single()

    if (!profile?.is_admin) {
      await supabase.auth.signOut()
      setError(t('admin.accessDenied'))
      setLoading(false)
      return
    }

    navigate('/admin/jogos')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-8"
      >
        <div className="-mt-2 -mr-2 mb-1 flex justify-end">
          <LangToggle className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100" />
        </div>
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-900/40 ring-2 ring-green-700/50">
            <Shield className="h-7 w-7 text-green-400" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-zinc-100">{t('admin.title')}</h1>
            <p className="mt-1 text-sm text-zinc-500">{APP_FULL_NAME}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-400">
              {t('auth.email')}
            </label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-600" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@email.com"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pr-3 pl-10 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-green-600 focus:ring-1 focus:ring-green-600/30"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-zinc-400">
              {t('auth.password')}
            </label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-600" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pr-3 pl-10 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-green-600 focus:ring-1 focus:ring-green-600/30"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-red-800/50 bg-red-900/20 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 py-3 font-semibold text-white transition hover:bg-green-600 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('admin.signin')}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
