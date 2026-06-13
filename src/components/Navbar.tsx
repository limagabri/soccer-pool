import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LogOut, Menu, Moon, Sun, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { SUPPORTED_LANGS } from '../i18n'
import { Logo } from './Logo'

const LINKS = [
  { to: '/dashboard', key: 'nav.dashboard', protegido: true },
  { to: '/palpites', key: 'nav.predictions', protegido: true },
  { to: '/grupos', key: 'nav.groups', protegido: false },
  { to: '/estatisticas', key: 'nav.statistics', protegido: false },
  { to: '/ranking', key: 'nav.ranking', protegido: false },
  { to: '/simulador', key: 'nav.simulator', protegido: false },
]

function LangToggle({ className = '' }: { className?: string }) {
  const { i18n } = useTranslation()
  const current = SUPPORTED_LANGS.find(l => l.code === i18n.language || l.code === i18n.language.split('-')[0])
    ?? SUPPORTED_LANGS[0]
  const next = SUPPORTED_LANGS[(SUPPORTED_LANGS.findIndex(l => l.code === current.code) + 1) % SUPPORTED_LANGS.length]
  return (
    <button
      onClick={() => i18n.changeLanguage(next.code)}
      title={next.label}
      className={`rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-white/5 ${className}`}
    >
      {current.flag}
    </button>
  )
}

function ThemeToggle({ className = '' }: { className?: string }) {
  const { isDark, setTheme } = useTheme()
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Modo claro' : 'Modo escuro'}
      className={`rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5 light:text-gray-500 light:hover:bg-gray-100 ${className}`}
    >
      <motion.div
        key={isDark ? 'moon' : 'sun'}
        initial={{ rotate: -30, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </motion.div>
    </button>
  )
}

export function Navbar() {
  const { user, profile, signOut, isAdmin } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)

  const username =
    profile?.username ??
    (user?.user_metadata?.username as string | undefined) ??
    user?.email?.split('@')[0] ??
    ''
  const initials = username.slice(0, 2).toUpperCase()

  async function handleLogout() {
    await signOut()
    setMenuAberto(false)
    navigate('/')
  }

  const links = isAdmin ? [] : LINKS.filter((l) => !l.protegido || user)

  return (
    <>
      <header className="relative z-20 border-b border-gray-200 bg-white shadow-sm backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.02] dark:shadow-none">
        <div className="mx-auto flex max-w-7xl items-center gap-x-6 px-4 py-3 sm:px-6">
          <Logo />

          {/* Desktop nav */}
          <nav className="hidden flex-1 gap-1 sm:flex">
            {isAdmin ? (
              <NavLink
                to="/admin/jogos"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${
                    isActive
                      ? 'bg-green-700/20 text-green-600 dark:text-green-400'
                      : 'text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-300'
                  }`
                }
              >
                Painel Admin
              </NavLink>
            ) : (
              links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${
                      isActive
                        ? 'bg-brasil-green/15 text-brasil-green'
                        : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                    }`
                  }
                >
                  {t(l.key)}
                </NavLink>
              ))
            )}
          </nav>

          {/* Desktop actions */}
          <div className="ml-auto hidden items-center gap-1 sm:flex">
            <LangToggle />
            <ThemeToggle />
            {user ? (
              <>
                {!isAdmin && (
                  <Link
                    to="/perfil"
                    title="Meu perfil"
                    className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition hover:bg-gray-100 dark:hover:bg-white/5"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brasil-green to-brasil-yellow text-xs font-bold text-black">
                      {initials}
                    </div>
                    <span className="hidden text-sm font-medium text-gray-700 dark:text-zinc-300 md:block">
                      {username}
                    </span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  title="Sair"
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-500 transition hover:border-red-400 hover:text-red-500 dark:border-white/10 dark:text-zinc-400 dark:hover:border-red-500/50 dark:hover:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="btn-gradient rounded-lg px-4 py-2 text-sm font-semibold text-black"
              >
                Entrar
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuAberto((v) => !v)}
            className="ml-auto rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100 sm:hidden"
            aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
          >
            {menuAberto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuAberto && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/40 sm:hidden dark:bg-black/60"
              onClick={() => setMenuAberto(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 right-0 z-40 flex w-72 flex-col border-l border-gray-200 bg-white/98 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95 sm:hidden"
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-white/5">
                <Logo />
                <div className="flex items-center gap-1">
                  <LangToggle />
                  <ThemeToggle />
                  <button
                    onClick={() => setMenuAberto(false)}
                    className="rounded-lg p-1.5 text-gray-500 hover:text-gray-900 dark:text-zinc-500 dark:hover:text-zinc-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto p-4">
                {isAdmin ? (
                  <NavLink
                    to="/admin/jogos"
                    onClick={() => setMenuAberto(false)}
                    className="mb-1 flex rounded-xl px-4 py-3 text-base font-medium text-green-600 transition hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-700/10"
                  >
                    Painel Admin
                  </NavLink>
                ) : (
                  links.map((l) => (
                    <NavLink
                      key={l.to}
                      to={l.to}
                      onClick={() => setMenuAberto(false)}
                      className={({ isActive }) =>
                        `mb-1 flex rounded-xl px-4 py-3 text-base font-medium transition ${
                          isActive
                            ? 'bg-brasil-green/15 text-brasil-green'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100'
                        }`
                      }
                    >
                      {t(l.key)}
                    </NavLink>
                  ))
                )}
              </nav>

              <div className="border-t border-gray-200 p-4 dark:border-white/5">
                {user ? (
                  <div className="flex flex-col gap-3">
                    {!isAdmin && (
                      <Link
                        to="/perfil"
                        onClick={() => setMenuAberto(false)}
                        className="flex items-center gap-3 rounded-xl p-3 hover:bg-gray-100 dark:hover:bg-white/5"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brasil-green to-brasil-yellow text-sm font-bold text-black">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-200">{username}</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-500">Meu perfil</p>
                        </div>
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-500 transition hover:border-red-400 hover:text-red-500 dark:border-white/10 dark:text-zinc-400 dark:hover:border-red-500/50 dark:hover:text-red-400"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMenuAberto(false)}
                    className="btn-gradient flex w-full items-center justify-center rounded-xl px-4 py-3 font-semibold text-black"
                  >
                    Entrar
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
