import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Award, BarChart2, ClipboardList, ImagePlay, LogOut, Mail, Menu, MessageCircle, Mic2, Trophy, Users, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const LINKS = [
  { to: '/admin/dashboard',     label: 'Dashboard',     icon: BarChart2 },
  { to: '/admin/jogos',         label: 'Jogos',          icon: ClipboardList },
  { to: '/admin/usuarios',      label: 'Usuários',       icon: Users },
  { to: '/admin/convites',      label: 'Convites',       icon: Mail },
  { to: '/admin/especiais',     label: 'Especiais',      icon: Award },
  { to: '/admin/chat',          label: 'Chat',           icon: MessageCircle },
  { to: '/admin/comentarista',  label: 'Comentarista',   icon: Mic2 },
  { to: '/admin/stories',       label: 'Stories',        icon: ImagePlay },
]

export function AdminLayout() {
  const navigate = useNavigate()
  const [verificando, setVerificando] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    async function verificarAdmin() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/admin'); return }
      const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (!data?.is_admin) { navigate('/admin'); return }
      setVerificando(false)
    }
    verificarAdmin()
  }, [navigate])

  async function sair() {
    await supabase.auth.signOut()
    navigate('/admin')
  }

  if (verificando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — always fixed, never scrolls with content */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-zinc-800 bg-zinc-900 transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-4">
          <Link to="/" className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-green-500" />
            <span className="font-bold text-zinc-100">Admin</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded p-1 text-zinc-500 hover:text-zinc-200 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-green-900/40 text-green-400'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-zinc-800 p-3">
          <button
            onClick={sair}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-500 transition hover:bg-zinc-800 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main — offset by sidebar width on desktop */}
      <div className="flex min-h-screen flex-col lg:ml-60">
        {/* Top bar (mobile) */}
        <header className="flex h-16 items-center border-b border-zinc-800 bg-zinc-900 px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="mr-4 rounded p-1.5 text-zinc-400 hover:text-zinc-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold text-zinc-200">Painel Admin</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
