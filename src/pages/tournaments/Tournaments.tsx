import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listTournaments } from '@/services/tournamentService'
import type { Tournament } from '@/types/tournament'
import TournamentCard from '@/components/tournaments/TournamentCard'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import Button from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

const TABS = [
  { key: '', label: 'Todos' },
  { key: 'open', label: 'Inscrições' },
  { key: 'live', label: 'Em andamento' },
  { key: 'finished', label: 'Terminados' }
]

export default function Tournaments() {
  const { profile } = useAuth()
  const [list, setList] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState('')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setList(await listTournaments(tab || undefined))
    } catch (e) {
      console.error(e)
      setError('Não foi possível carregar torneios.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [tab])

  const canCreate = profile?.role === 'organizer' || profile?.role === 'admin'

  return (
    <div className="px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Torneios</h1>
        {canCreate && (
          <Link to="/tournaments/create"><Button className="!py-2 !px-3 text-sm">+ Criar</Button></Link>
        )}
      </div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full ${tab === t.key ? 'bg-accent text-white' : 'bg-base-700 text-white/70'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && list.length === 0 && (
        <EmptyState title="Nenhum torneio disponível." description="Os organizadores publicam aqui." />
      )}
      {!loading && !error && list.length > 0 && (
        <div className="space-y-3">{list.map((t) => <TournamentCard key={t.id} tournament={t} />)}</div>
      )}
    </div>
  )
}
