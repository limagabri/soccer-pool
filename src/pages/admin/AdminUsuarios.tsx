import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, RefreshCw, Shield, ShieldOff, UserPlus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'

interface UsuarioAdmin {
  id: string
  username: string
  email: string
  is_admin: boolean
  primeiro_acesso: boolean
  pontos: number
  palpites_count: number
  created_at: string
}

interface FormCriar {
  nome: string
  email: string
  senha: string
}

export function AdminUsuarios() {
  const { t } = useTranslation()
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState<FormCriar>({ nome: '', email: '', senha: '' })
  const [criando, setCriando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null)

  async function carregar() {
    setLoading(true)
    const { data } = await supabase.rpc('admin_listar_usuarios')
    setUsuarios(((data as UsuarioAdmin[]) ?? []).filter((u) => !u.is_admin))
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  async function toggleAdmin(usuario: UsuarioAdmin) {
    await supabase
      .from('profiles')
      .update({ is_admin: !usuario.is_admin })
      .eq('id', usuario.id)
    setUsuarios((prev) =>
      prev.map((u) => (u.id === usuario.id ? { ...u, is_admin: !u.is_admin } : u))
    )
  }

  async function criarUsuario() {
    if (!form.nome || !form.email || !form.senha) {
      setErro(t('admin.users.fillAll'))
      return
    }
    if (form.senha.length < 6) {
      setErro(t('admin.users.passMin'))
      return
    }
    setErro(null)
    setCriando(true)

    const { data, error } = await supabase.functions.invoke('criar-usuario', {
      body: { email: form.email, nome: form.nome, senha_temporaria: form.senha },
    })

    setCriando(false)
    if (error || !data?.success) {
      setErro(data?.error ?? t('admin.users.createError'))
      return
    }

    setSucessoMsg(t('admin.users.created', { name: form.nome }))
    setForm({ nome: '', email: '', senha: '' })
    setModalAberto(false)
    setTimeout(() => setSucessoMsg(null), 4000)
    carregar()
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{t('admin.users.title')}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t('admin.users.count', { count: usuarios.length })}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={carregar}
            className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-400 transition hover:text-zinc-100"
          >
            <RefreshCw className="h-4 w-4" />
            {t('admin.refresh')}
          </button>
          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-600"
          >
            <UserPlus className="h-4 w-4" />
            {t('admin.users.create')}
          </button>
        </div>
      </div>

      {sucessoMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-lg border border-green-800/50 bg-green-900/20 px-4 py-3 text-sm text-green-400"
        >
          {sucessoMsg}
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-zinc-800" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs tracking-wider text-zinc-500 uppercase">
                <th className="px-4 py-3">{t('admin.user')}</th>
                <th className="px-3 py-3">{t('auth.email')}</th>
                <th className="px-3 py-3 text-center">{t('admin.points')}</th>
                <th className="px-3 py-3 text-center">{t('admin.dash.predictions')}</th>
                <th className="px-3 py-3 text-center">{t('admin.users.colFirstAccess')}</th>
                <th className="px-4 py-3 text-center">{t('admin.users.colAdmin')}</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-zinc-800/50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-700 to-yellow-600 text-xs font-bold text-black">
                        {u.username.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-zinc-200">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-zinc-500">{u.email}</td>
                  <td className="px-3 py-3 text-center font-bold text-yellow-500">{u.pontos}</td>
                  <td className="px-3 py-3 text-center text-zinc-400">{u.palpites_count}</td>
                  <td className="px-3 py-3 text-center">
                    {u.primeiro_acesso ? (
                      <span className="rounded-full bg-amber-900/40 px-2 py-0.5 text-xs text-amber-400">{t('admin.users.pending')}</span>
                    ) : (
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">{t('admin.users.done')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleAdmin(u)}
                      title={u.is_admin ? t('admin.users.removeAdmin') : t('admin.users.makeAdmin')}
                      className={`rounded-lg p-2 transition ${
                        u.is_admin
                          ? 'text-green-400 hover:bg-red-900/20 hover:text-red-400'
                          : 'text-zinc-600 hover:bg-green-900/20 hover:text-green-400'
                      }`}
                    >
                      {u.is_admin ? <Shield className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal criar usuário */}
      <AnimatePresence>
        {modalAberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-semibold text-zinc-100">{t('admin.users.createTitle')}</h2>
                <button onClick={() => { setModalAberto(false); setErro(null) }} className="text-zinc-600 hover:text-zinc-300">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {(['nome', 'email', 'senha'] as const).map((campo) => (
                  <div key={campo}>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-400 capitalize">
                      {campo === 'senha' ? t('admin.users.labelTempPass') : campo === 'nome' ? t('admin.users.labelName') : t('auth.email')}
                    </label>
                    <input
                      type={campo === 'senha' ? 'password' : campo === 'email' ? 'email' : 'text'}
                      value={form[campo]}
                      onChange={(e) => setForm((f) => ({ ...f, [campo]: e.target.value }))}
                      placeholder={
                        campo === 'nome' ? 'joaosilva' : campo === 'email' ? 'joao@email.com' : '••••••••'
                      }
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-green-600"
                    />
                  </div>
                ))}

                {erro && (
                  <p className="rounded-lg border border-red-800/50 bg-red-900/20 px-3 py-2 text-sm text-red-400">
                    {erro}
                  </p>
                )}

                <p className="text-xs text-zinc-600">
                  {t('admin.users.hint')}
                </p>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => { setModalAberto(false); setErro(null) }}
                  className="flex-1 rounded-lg border border-zinc-700 py-2.5 text-sm font-medium text-zinc-400 transition hover:border-zinc-600"
                >
                  {t('admin.common.cancel')}
                </button>
                <button
                  onClick={criarUsuario}
                  disabled={criando}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-700 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-60"
                >
                  {criando && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('admin.common.create')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
