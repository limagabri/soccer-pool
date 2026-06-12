import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  children: ReactNode
  skipPrimeiroAcesso?: boolean
}

export function ProtectedRoute({ children, skipPrimeiroAcesso = false }: Props) {
  const { session, loading, profile, profileLoading } = useAuth()
  const location = useLocation()

  if (loading || (session && profileLoading && !profile)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brasil-green border-t-transparent" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  if (
    !skipPrimeiroAcesso &&
    profile?.primeiro_acesso === true &&
    location.pathname !== '/primeiro-acesso'
  ) {
    return <Navigate to="/primeiro-acesso" replace />
  }

  return <>{children}</>
}
