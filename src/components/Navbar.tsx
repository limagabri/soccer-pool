import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
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
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const username =
    profile?.username ??
    (user?.user_metadata?.username as string | undefined) ??
    user?.email?.split('@')[0] ??
    ''
  const initials = username.slice(0, 2).toUpperCase()

  async function handleLogout() {
    await signOut()
    navigate('/')
  }

  const links = LINKS.filter((l) => !l.protegido || user)

  return (
    <header className="relative z-20 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 sm:px-6">
        <Logo />

        <nav className="order-last -mx-1 flex w-full gap-1 overflow-x-auto pb-1 sm:order-none sm:mx-0 sm:w-auto sm:flex-1 sm:pb-0">
          {links.map((l) => (
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
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
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
      </div>
    </header>
  )
}
