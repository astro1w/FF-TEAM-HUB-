import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import LoadingState from '@/components/ui/LoadingState'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingState fullScreen message="A carregar sessão..." />
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

export function OnboardingGate() {
  const { profile, loading } = useAuth()

  if (loading) return <LoadingState fullScreen message="A preparar tudo..." />
  if (profile && !profile.onboardingCompleted) return <Navigate to="/onboarding" replace />
  return <Outlet />
}

export function GuestOnlyRoute() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingState fullScreen message="A carregar..." />
  if (user) return <Navigate to="/home" replace />
  return <Outlet />
}
