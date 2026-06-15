import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Copy, Link as LinkIcon, Loader2, MessageCircle, RefreshCw, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { APP_FULL_NAME } from '../../config/app'

interface Convite {
  id: string
  email: string
  nome: string
  token: string
  usado: boolean
  created_at: string
  expires_at: string
}

function statusConvite(c: Convite, t: (k: string) => string): { label: string; cls: string } {
  if (c.usado) return { label: t('admin.invites.stUsed'), cls: 'bg-zinc-800 text-zinc-500' }
  if (new Date(c.expires_at) < new Date()) return { label: t('admin.invites.stExpired'), cls: 'bg-red-900/30 text-red-500' }
  return { label: t('admin.invites.stPending'), cls: 'bg-amber-900/30 text-amber-400' }
}

function urlConvite(token: string) {
  const base = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}`
  return `${base}/cadastro?token=${token}`
}

export function AdminConvites() {
  const { t } = useTranslation()
  const [convites, setConvites] = useState<Convite[]>([])
  const [loading, setLoading] = useState(true)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [novoConvite, setNovoConvite] = useState<Convite | null>(null)
  const [copiado, setCopiado] = useState(false)

  async function carregar() {
    setLoading(true)
    const { data } = await supabase
      .from('convites')
      .select('*')
      .order('created_at', { ascending: false })
    setConvites((data as Convite[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  async function gerarConvite() {
    if (!nome.trim() || !email.trim()) { setErro(t('admin.invites.fillNameEmail')); return }
    setErro(null)
    setGerando(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('convites')
      .insert({ email: email.trim().toLowerCase(), nome: nome.trim(), criado_por: user?.id })
      .select()
      .single()

    setGerando(false)
    if (error) {
      setErro(error.message.includes('unique') ? t('admin.invites.dupEmail') : t('admin.invites.genError'))
      return
    }

    setNovoConvite(data as Convite)
    setNome('')
    setEmail('')
    carregar()
  }

  async function deletarConvite(id: string) {
    await supabase.from('convites').delete().eq('id', id)
    setConvites((prev) => prev.filter((c) => c.id !== id))
  }

  function copiarLink(token: string) {
    navigator.clipboard.writeText(urlConvite(token))
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function compartilharWhatsApp(token: string) {
    const url = urlConvite(token)
    const msg = t('admin.invites.waMsg', { app: APP_FULL_NAME, url })
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">{t('admin.invites.title')}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t('admin.invites.subtitle')}</p>
      </div>

      {/* Instrução */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-brasil-green/20 bg-brasil-green/5 p-4">
        <span className="text-2xl">📲</span>
        <div>
          <p className="text-sm font-semibold text-green-400">{t('landing.howItWorks')}</p>
          <p className="mt-0.5 text-sm text-zinc-400">
            {t('admin.invites.instr1')} <strong className="text-zinc-300">{t('admin.invites.validDays')}</strong> {t('admin.invites.instrMid')} <strong className="text-zinc-300">{t('admin.invites.once')}</strong>.
          </p>
        </div>
      </div>

      {/* Formulário */}
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-300 uppercase tracking-wider">{t('admin.invites.newInvite')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">{t('admin.users.labelName')}</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="joaosilva"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-green-600"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-400">{t('auth.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="joao@email.com"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-green-600"
            />
          </div>
        </div>

        {erro && (
          <p className="mt-3 rounded-lg border border-red-800/50 bg-red-900/20 px-3 py-2 text-sm text-red-400">
            {erro}
          </p>
        )}

        <button
          onClick={gerarConvite}
          disabled={gerando}
          className="mt-4 flex items-center gap-2 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-60"
        >
          {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
          {t('admin.invites.generate')}
        </button>
      </div>

      {/* Link gerado */}
      <AnimatePresence>
        {novoConvite && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 rounded-xl border border-green-800/50 bg-green-900/10 p-5"
          >
            <p className="mb-3 text-sm font-semibold text-green-400">
              {t('admin.invites.generatedFor')} <strong>{novoConvite.nome}</strong> ({novoConvite.email})
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2">
                <p className="truncate text-xs text-zinc-400 font-mono">{urlConvite(novoConvite.token)}</p>
              </div>
              <button
                onClick={() => copiarLink(novoConvite.token)}
                className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-300 transition hover:text-zinc-100"
              >
                {copiado ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                {copiado ? t('admin.invites.copied') : t('admin.invites.copy')}
              </button>
              <button
                onClick={() => compartilharWhatsApp(novoConvite.token)}
                className="flex items-center gap-1.5 rounded-lg bg-green-800/50 px-3 py-2 text-sm text-green-300 transition hover:bg-green-700/50"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-600">{t('admin.invites.validFor')}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">{t('admin.invites.listTitle')}</h2>
        <button onClick={carregar} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300">
          <RefreshCw className="h-3.5 w-3.5" />
          {t('admin.refresh')}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-zinc-800" />)}
        </div>
      ) : convites.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 p-8 text-center text-zinc-600">
          {t('admin.invites.empty')}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full min-w-[540px] text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs tracking-wider text-zinc-500 uppercase">
                <th className="px-4 py-3">{t('admin.invites.colName')}</th>
                <th className="px-3 py-3">{t('auth.email')}</th>
                <th className="px-3 py-3 text-center">{t('admin.invites.colStatus')}</th>
                <th className="px-3 py-3 text-center">{t('admin.invites.colCreated')}</th>
                <th className="px-4 py-3 text-right">{t('admin.invites.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {convites.map((c) => {
                const st = statusConvite(c, t)
                return (
                  <tr key={c.id} className="border-b border-zinc-800/50 last:border-0">
                    <td className="px-4 py-3 font-medium text-zinc-200">{c.nome}</td>
                    <td className="px-3 py-3 text-zinc-500">{c.email}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-3 py-3 text-center text-xs text-zinc-600">
                      {new Date(c.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {!c.usado && new Date(c.expires_at) > new Date() && (
                          <>
                            <button
                              onClick={() => copiarLink(c.token)}
                              title={t('admin.invites.copyLink')}
                              className="rounded p-1.5 text-zinc-500 hover:text-zinc-200"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => compartilharWhatsApp(c.token)}
                              title={t('admin.invites.shareWa')}
                              className="rounded p-1.5 text-zinc-500 hover:text-green-400"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => deletarConvite(c.id)}
                          title={t('admin.invites.deleteInvite')}
                          className="rounded p-1.5 text-zinc-600 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
