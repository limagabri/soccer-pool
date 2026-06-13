import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ScrollToTop } from './components/ScrollToTop'
import { InstalarPWA } from './components/InstalarPWA'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Cadastro } from './pages/Cadastro'
import { EsqueciSenha } from './pages/EsqueciSenha'
import { NovaSenha } from './pages/NovaSenha'
import { Dashboard } from './pages/Dashboard'
import { AuthCallback } from './pages/AuthCallback'
import { Grupos } from './pages/Grupos'
import { Palpites } from './pages/Palpites'
import { Simulador } from './pages/Simulador'
import { Ranking } from './pages/Ranking'
import { Perfil } from './pages/Perfil'
import { PrimeiroAcesso } from './pages/PrimeiroAcesso'
import { AdminLogin } from './pages/admin/AdminLogin'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminJogos } from './pages/admin/AdminJogos'
import { AdminUsuarios } from './pages/admin/AdminUsuarios'
import { AdminConvites } from './pages/admin/AdminConvites'
import { AdminEspeciais } from './pages/admin/AdminEspeciais'
import { AdminChat } from './pages/admin/AdminChat'
import { Estatisticas } from './pages/Estatisticas'
import { Regulamento } from './pages/Regulamento'
import { NotFound } from './pages/NotFound'
import { usePontuacao } from './hooks/usePontuacao'

function PontuacaoGlobal() {
  usePontuacao()
  return null
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PontuacaoGlobal />
        <BrowserRouter
          basename={import.meta.env.BASE_URL}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <ScrollToTop />
          <InstalarPWA />
          <Routes>
            {/* Públicas */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/esqueci-senha" element={<EsqueciSenha />} />
            <Route path="/nova-senha" element={<NovaSenha />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/grupos" element={<Grupos />} />
            <Route path="/estatisticas" element={<Estatisticas />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/simulador" element={<Simulador />} />
            <Route path="/regulamento" element={<Regulamento />} />

            {/* Protegidas */}
            <Route
              path="/primeiro-acesso"
              element={
                <ProtectedRoute skipPrimeiroAcesso>
                  <PrimeiroAcesso />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={<ProtectedRoute><Perfil /></ProtectedRoute>}
            />
            <Route
              path="/palpites"
              element={<ProtectedRoute><Palpites /></ProtectedRoute>}
            />
            <Route
              path="/dashboard"
              element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
            />

            {/* Admin */}
            <Route path="/admin">
              <Route index element={<AdminLogin />} />
              <Route element={<AdminLayout />}>
                <Route path="jogos" element={<AdminJogos />} />
                <Route path="usuarios" element={<AdminUsuarios />} />
                <Route path="convites" element={<AdminConvites />} />
                <Route path="especiais" element={<AdminEspeciais />} />
                <Route path="chat" element={<AdminChat />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
