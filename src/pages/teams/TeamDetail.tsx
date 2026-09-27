import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom'
import { getTeam, getTeamMembers } from '@/services/teamService'
import type { Team, TeamMember } from '@/types/team'
import LoadingState from '@/components/ui/LoadingState'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [t, m] = await Promise.all([getTeam(id!), getTeamMembers(id!)])
        if (cancelled) return
        setTeam(t)
        setMembers(m)
      } catch (e) {
        console.error(e)
        if (!cancelled) setError('Não foi possível carregar a Team.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <LoadingState message="A carregar Team..." />
  if (error) return <ErrorState message={error} />
  if (!team) {
    return (
      <div className="px-4 pt-10">
        <EmptyState title="Team não encontrada." />
      </div>
    )
  }

  const isCaptain = user?.id === team.captainId

  return (
    <div className="px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <div className="card mb-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-base-700 flex items-center justify-center text-xl font-black text-accent shrink-0">
            {team.logoUrl ? (
              <img src={team.logoUrl} alt="" className="w-full h-full object-cover rounded-xl" />
            ) : (
              team.tag.slice(0, 2)
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">{team.name}</h1>
            <p className="text-white/50 text-sm font-mono">[{team.tag}]</p>
            <p className="text-xs text-white/40 mt-1">
              🇲🇿 {team.province ? `${team.province}, ` : ''}{team.country}
            </p>
            {team.recruiting && (
              <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wide bg-success/15 text-success px-2 py-0.5 rounded-full">
                A recrutar
              </span>
            )}
          </div>
        </div>
        {team.description && (
          <p className="text-sm text-white/70 mt-4 leading-relaxed">{team.description}</p>
        )}
      </div>

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-white/80 mb-2">
          Lineup ({members.length})
        </h2>
        {members.length === 0 ? (
          <EmptyState title="Sem membros." />
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="card flex items-center gap-3 !py-3">
                <div className="w-9 h-9 rounded-full bg-base-700 flex items-center justify-center text-xs font-bold">
                  {(m.nickname ?? '?').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{m.nickname ?? 'Jogador'}</p>
                  <p className="text-xs text-white/40">{m.teamRole}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {isCaptain && (
        <div className="space-y-2">
          <Link to={`/tryouts/create?team=${team.id}`}>
            <Button className="w-full" variant="secondary">
              Publicar Tryout
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
