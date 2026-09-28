import React, { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getAdminMetrics } from '@/services/adminService'
import LoadingState from '@/components/ui/LoadingState'

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminMetrics()
      .then(setMetrics)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (profile && profile.role !== 'admin' && profile.role !== 'moderator') {
    return <Navigate to="/home" replace />
  }

  if (loading) return <LoadingState fullScreen />

  const cards = [
    { label: 'Utilizadores', value: metrics?.totalUsers, to: '/admin/users' },
    { label: 'Teams ativas', value: metrics?.activeTeams, to: '/admin/teams' },
    { label: 'Tryouts abertos', value: metrics?.openTryouts, to: '/admin/tryouts' },
    { label: 'Scrims ativas', value: metrics?.activeScrims, to: '/admin/scrims' },
    { label: 'Torneios ativos', value: metrics?.activeTournaments, to: '/admin/tournaments' },
    { label: 'Reports pendentes', value: metrics?.pendingReports, to: '/admin/reports' }
  ]

  return (
    <div className="px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-1">Admin</h1>
      <p className="text-white/50 text-sm mb-6">Painel de moderação e métricas</p>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="card !p-4 hover:border-accent/40 transition-colors">
            <p className="text-2xl font-black text-accent-soft">{c.value ?? '—'}</p>
            <p className="text-xs text-white/50 mt-1">{c.label}</p>
          </Link>
        ))}
      </div>
      <div className="mt-6 space-y-2">
        <Link to="/admin/users" className="card block !py-3 font-medium">Utilizadores →</Link>
        <Link to="/admin/reports" className="card block !py-3 font-medium">Reports →</Link>
        <Link to="/admin/teams" className="card block !py-3 font-medium">Teams →</Link>
        <Link to="/admin/tournaments" className="card block !py-3 font-medium">Torneios →</Link>
      </div>
    </div>
  )
}
