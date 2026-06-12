import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from './Logo'

const LINKS = [
  { to: '/dashboard', label: 'Dashboard', protegido: true },
  { to: '/palpites', label: 'Palpites', protegido: true },
  { to: '/grupos', label: 'Grupos', protegido: false },
  { to: '/ranking', label: 'Ranking', protegido: false },
  { to: '/simulador', label: 'Simulador', protegido: false },
]

export function Navbar() {
  const { user, profile, signOut, isAdmin } = useAuth()
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
      <header className="relative z-20 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-x-6 px-4 py-3 sm:px-6">
          <Logo />

          {/* Desktop nav */}
          <nav className="hidden flex-1 gap-1 sm:flex">
            {isAdmin ? (
              <NavLink
                to="/admin/jogos"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${
                    isActive
                      ? 'bg-green-700/20 text-green-400'
                      : 'text-green-500 hover:text-green-300'
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
                        : 'text-zinc-400 hover:text-zinc-100'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))
            )}
          </nav>

          {/* Desktop actions */}
          <div className="ml-auto hidden items-center gap-3 sm:flex">
            {user ? (
              <>
                {!isAdmin && (
                  <Link
                    to="/perfil"
                    title="Meu perfil"
                    className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition hover:bg-white/5"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brasil-green to-brasil-yellow text-xs font-bold text-black">
                      {initials}
                    </div>
                    <span className="hidden text-sm font-medium text-zinc-300 md:block">
                      {username}
                    </span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  title="Sair"
                  className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-zinc-400 transition hover:border-red-500/50 hover:text-red-400"
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
            className="ml-auto rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100 sm:hidden"
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
              className="fixed inset-0 z-30 bg-black/60 sm:hidden"
              onClick={() => setMenuAberto(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 right-0 z-40 flex w-72 flex-col border-l border-white/10 bg-zinc-950/95 backdrop-blur-xl sm:hidden"
            >
              <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
                <Logo />
                <button
                  onClick={() => setMenuAberto(false)}
                  className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-4">
                {isAdmin ? (
                  <NavLink
                    to="/admin/jogos"
                    onClick={() => setMenuAberto(false)}
                    className="mb-1 flex rounded-xl px-4 py-3 text-base font-medium text-green-400 transition hover:bg-green-700/10"
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
                            : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
                        }`
                      }
                    >
                      {l.label}
                    </NavLink>
                  ))
                )}
              </nav>

              <div className="border-t border-white/5 p-4">
                {user ? (
                  <div className="flex flex-col gap-3">
                    {!isAdmin && (
                      <Link
                        to="/perfil"
                        onClick={() => setMenuAberto(false)}
                        className="flex items-center gap-3 rounded-xl p-3 hover:bg-white/5"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brasil-green to-brasil-yellow text-sm font-bold text-black">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-200">{username}</p>
                          <p className="text-xs text-zinc-500">Meu perfil</p>
                        </div>
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-400 transition hover:border-red-500/50 hover:text-red-400"
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
