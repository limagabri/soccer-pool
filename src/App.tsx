import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { JogosProvider } from './contexts/JogosContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ScrollToTop } from './components/ScrollToTop'
import { InstalarPWA } from './components/InstalarPWA'
import { AnimacaoGol } from './components/AnimacaoGol'
import { Footer } from './components/Footer'
import { usePontuacao } from './hooks/usePontuacao'

// Code-splitting por rota: cada página vira um chunk próprio, carregado sob
// demanda (recharts, html2canvas etc. não pesam no carregamento inicial).
const Landing = lazy(() => import('./pages/Landing').then((m) => ({ default: m.Landing })))
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })))
const Cadastro = lazy(() => import('./pages/Cadastro').then((m) => ({ default: m.Cadastro })))
const EsqueciSenha = lazy(() => import('./pages/EsqueciSenha').then((m) => ({ default: m.EsqueciSenha })))
const NovaSenha = lazy(() => import('./pages/NovaSenha').then((m) => ({ default: m.NovaSenha })))
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const AuthCallback = lazy(() => import('./pages/AuthCallback').then((m) => ({ default: m.AuthCallback })))
const Grupos = lazy(() => import('./pages/Grupos').then((m) => ({ default: m.Grupos })))
const Palpites = lazy(() => import('./pages/Palpites').then((m) => ({ default: m.Palpites })))
const Simulador = lazy(() => import('./pages/Simulador').then((m) => ({ default: m.Simulador })))
const Ranking = lazy(() => import('./pages/Ranking').then((m) => ({ default: m.Ranking })))
const Perfil = lazy(() => import('./pages/Perfil').then((m) => ({ default: m.Perfil })))
const PrimeiroAcesso = lazy(() => import('./pages/PrimeiroAcesso').then((m) => ({ default: m.PrimeiroAcesso })))
const Comentarios = lazy(() => import('./pages/Comentarios').then((m) => ({ default: m.Comentarios })))
const Stories = lazy(() => import('./pages/Stories').then((m) => ({ default: m.Stories })))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then((m) => ({ default: m.AdminLogin })))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })))
const AdminJogos = lazy(() => import('./pages/admin/AdminJogos').then((m) => ({ default: m.AdminJogos })))
const AdminUsuarios = lazy(() => import('./pages/admin/AdminUsuarios').then((m) => ({ default: m.AdminUsuarios })))
const AdminConvites = lazy(() => import('./pages/admin/AdminConvites').then((m) => ({ default: m.AdminConvites })))
const AdminEspeciais = lazy(() => import('./pages/admin/AdminEspeciais').then((m) => ({ default: m.AdminEspeciais })))
const AdminChat = lazy(() => import('./pages/admin/AdminChat').then((m) => ({ default: m.AdminChat })))
const AdminComentarista = lazy(() => import('./pages/admin/AdminComentarista').then((m) => ({ default: m.AdminComentarista })))
const AdminStories = lazy(() => import('./pages/admin/AdminStories').then((m) => ({ default: m.AdminStories })))
const AdminPalpites = lazy(() => import('./pages/admin/AdminPalpites').then((m) => ({ default: m.AdminPalpites })))
const Estatisticas = lazy(() => import('./pages/Estatisticas').then((m) => ({ default: m.Estatisticas })))
const Regulamento = lazy(() => import('./pages/Regulamento').then((m) => ({ default: m.Regulamento })))
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })))

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-brasil-green" />
    </div>
  )
}

function PontuacaoGlobal() {
  usePontuacao()
  return null
}

function App() {
  return (
    <ErrorBoundary label="App">
      <ThemeProvider>
        <AuthProvider>
          <JogosProvider>
            <PontuacaoGlobal />
            <ErrorBoundary label="AnimacaoGol" fallback={null}>
              <AnimacaoGol />
            </ErrorBoundary>
            <BrowserRouter
              basename={import.meta.env.BASE_URL}
              future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
            >
              <ScrollToTop />
              <InstalarPWA />
              <Suspense fallback={<RouteFallback />}>
              <Routes>
                {/* Públicas */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Cadastro />} />
                <Route path="/esqueci-senha" element={<EsqueciSenha />} />
                <Route path="/nova-senha" element={<NovaSenha />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Protegidas — requerem login */}
                <Route path="/grupos"        element={<ProtectedRoute><Grupos /></ProtectedRoute>} />
                <Route path="/estatisticas"  element={<ProtectedRoute><Estatisticas /></ProtectedRoute>} />
                <Route path="/ranking"       element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
                <Route path="/simulador"     element={<ProtectedRoute><Simulador /></ProtectedRoute>} />
                <Route path="/regulamento"   element={<ProtectedRoute><Regulamento /></ProtectedRoute>} />
                <Route path="/comentarios"   element={<ProtectedRoute><Comentarios /></ProtectedRoute>} />
                <Route path="/stories"       element={<ProtectedRoute><Stories /></ProtectedRoute>} />

                {/* Protegidas */}
                <Route
                  path="/primeiro-acesso"
                  element={
                    <ProtectedRoute skipPrimeiroAcesso>
                      <PrimeiroAcesso />
                    </ProtectedRoute>
                  }
                />
                <Route path="/perfil"    element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
                <Route path="/palpites"  element={<ProtectedRoute><Palpites /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

                {/* Admin */}
                <Route path="/admin">
                  <Route index element={<AdminLogin />} />
                  <Route element={<AdminLayout />}>
                    <Route path="dashboard"    element={<AdminDashboard />} />
                    <Route path="jogos"        element={<AdminJogos />} />
                    <Route path="palpites"     element={<AdminPalpites />} />
                    <Route path="usuarios"     element={<AdminUsuarios />} />
                    <Route path="convites"     element={<AdminConvites />} />
                    <Route path="especiais"    element={<AdminEspeciais />} />
                    <Route path="chat"         element={<AdminChat />} />
                    <Route path="comentarista" element={<AdminComentarista />} />
                    <Route path="stories"      element={<AdminStories />} />
                  </Route>
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
              <Footer />
            </BrowserRouter>
          </JogosProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
