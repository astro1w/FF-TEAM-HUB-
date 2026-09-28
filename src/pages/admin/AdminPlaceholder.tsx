import React from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import EmptyState from '@/components/ui/EmptyState'

export default function AdminPlaceholder() {
  const { profile } = useAuth()
  const { section } = useParams()
  if (profile && !['admin', 'moderator'].includes(profile.role)) {
    return <Navigate to="/home" replace />
  }
  return (
    <div className="px-4 pt-10 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4 capitalize">{section}</h1>
      <EmptyState title="Gestão disponível via listagens principais." description="Usa Teams / Torneios / Tryouts na app para moderar." />
    </div>
  )
}
