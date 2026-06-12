import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Cadastro } from './pages/Cadastro'
import { Dashboard } from './pages/Dashboard'
import { AuthCallback } from './pages/AuthCallback'
import { Grupos } from './pages/Grupos'
import { Palpites } from './pages/Palpites'
import { Simulador } from './pages/Simulador'
import { Ranking } from './pages/Ranking'
import { Perfil } from './pages/Perfil'
import { usePontuacao } from './hooks/usePontuacao'

/* Watcher global: recalcula pontos quando um jogo é encerrado */
function PontuacaoGlobal() {
  usePontuacao()
  return null
}

function App() {
  return (
    <AuthProvider>
      <PontuacaoGlobal />
      <BrowserRouter
        basename={import.meta.env.BASE_URL}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/grupos" element={<Grupos />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/simulador" element={<Simulador />} />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            }
          />
          <Route
            path="/palpites"
            element={
              <ProtectedRoute>
                <Palpites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
