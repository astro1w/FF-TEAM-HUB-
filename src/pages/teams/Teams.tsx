import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listTeams } from '@/services/teamService'
import type { Team } from '@/types/team'
import TeamCard from '@/components/teams/TeamCard'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import Button from '@/components/ui/Button'

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recruitingOnly, setRecruitingOnly] = useState(false)
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listTeams({
        recruiting: recruitingOnly || undefined,
        search: search.trim() || undefined,
        country: 'Moçambique'
      })
      setTeams(data)
    } catch (e) {
      console.error(e)
      setError('Não foi possível carregar as Teams.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [recruitingOnly])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    load()
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Teams</h1>
        <Link to="/teams/create">
          <Button className="!py-2 !px-3 text-sm">+ Criar</Button>
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mb-3">
        <input
          className="input-field"
          placeholder="Procurar por nome ou tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setRecruitingOnly(false)}
          className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full ${
            !recruitingOnly ? 'bg-accent text-white' : 'bg-base-700 text-white/70'
          }`}
        >
          Todas
        </button>
        <button
          type="button"
          onClick={() => setRecruitingOnly(true)}
          className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full ${
            recruitingOnly ? 'bg-accent text-white' : 'bg-base-700 text-white/70'
          }`}
        >
          A recrutar
        </button>
      </div>

      {loading && <LoadingState message="A carregar Teams..." />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && teams.length === 0 && (
        <EmptyState
          title="Nenhuma Team encontrada."
          description="Sê o primeiro a criar uma Team em Moçambique."
          action={
            <Link to="/teams/create">
              <Button>Criar Team</Button>
            </Link>
          }
        />
      )}
      {!loading && !error && teams.length > 0 && (
        <div className="space-y-3">
          {teams.map((t) => (
            <TeamCard key={t.id} team={t} />
          ))}
        </div>
      )}
    </div>
  )
}
