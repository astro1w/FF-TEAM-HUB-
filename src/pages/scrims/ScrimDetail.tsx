import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getScrim, getScrimRoom, joinScrim, listScrimTeams } from '@/services/scrimService'
import type { RoomCredentials } from '@/services/scrimService'
import { getMyTeams } from '@/services/teamService'
import type { Scrim } from '@/types/scrim'
import type { Team } from '@/types/team'
import { useAuth } from '@/hooks/useAuth'
import LoadingState from '@/components/ui/LoadingState'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'

export default function ScrimDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [scrim, setScrim] = useState<Scrim | null>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [myTeams, setMyTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState('')
  const [room, setRoom] = useState<RoomCredentials | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([
      getScrim(id),
      listScrimTeams(id),
      user ? getMyTeams(user.id) : Promise.resolve([])
    ]).then(([s, t, mt]) => {
      setScrim(s)
      setTeams(t)
      setMyTeams(mt)
      if (mt.length === 1) setSelectedTeam(mt[0].id)
    }).catch((e) => {
      console.error(e)
      setError('Erro ao carregar Scrim.')
    }).finally(() => setLoading(false))
  }, [id, user])

  // Credenciais vêm de tabela privada; o servidor (RLS) decide quem as vê.
  useEffect(() => {
    if (!id || !user) return
    getScrimRoom(id).then(setRoom).catch(() => setRoom(null))
  }, [id, user, teams.length])

  async function handleJoin() {
    if (!selectedTeam || !scrim) return
    setJoining(true)
    try {
      await joinScrim(scrim.id, selectedTeam)
      setTeams(await listScrimTeams(scrim.id))
      setScrim(await getScrim(scrim.id))
    } catch (e: any) {
      alert(e?.message?.includes('unique') ? 'Team já inscrita.' : 'Não foi possível inscrever.')
    } finally {
      setJoining(false)
    }
  }

  if (loading) return <LoadingState message="A carregar..." />
  if (error) return <ErrorState message={error} />
  if (!scrim) return <div className="px-4 pt-10"><EmptyState title="Scrim não encontrada." /></div>

  const date = new Date(scrim.scheduledAt)
  const isParticipant = teams.some((t) => myTeams.some((mt) => mt.id === t.team_id))

  return (
    <div className="px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <div className="card mb-4">
        <h1 className="text-xl font-bold">{scrim.name}</h1>
        <p className="text-sm text-white/50 mt-1">
          {date.toLocaleDateString('pt-MZ')} · {date.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <div className="flex gap-2 mt-3">
          <span className="text-xs bg-base-700 px-2 py-1 rounded-full">{scrim.format}</span>
          <span className="text-xs bg-base-700 px-2 py-1 rounded-full">{scrim.teamCount ?? teams.length}/{scrim.maxTeams}</span>
          <span className="text-xs bg-success/15 text-success px-2 py-1 rounded-full">{scrim.status}</span>
        </div>
        {scrim.rules && <p className="text-sm text-white/60 mt-3 whitespace-pre-wrap">{scrim.rules}</p>}
        {room?.roomCode && (
          <div className="mt-4 p-3 bg-base-700 rounded-xl">
            <p className="text-xs text-white/50">Código da sala</p>
            <p className="font-mono font-bold">{room.roomCode}</p>
            {room.roomPassword && (
              <>
                <p className="text-xs text-white/50 mt-2">Senha</p>
                <p className="font-mono font-bold">{room.roomPassword}</p>
              </>
            )}
          </div>
        )}
      </div>

      <h2 className="text-sm font-semibold text-white/80 mb-2">Teams inscritas ({teams.length})</h2>
      {teams.length === 0 ? (
        <EmptyState title="Nenhuma Team inscrita ainda." />
      ) : (
        <div className="space-y-2 mb-4">
          {teams.map((t: any) => (
            <div key={t.id} className="card !py-3 flex items-center gap-3">
              <span className="font-mono text-xs text-white/40">[{t.teams?.tag}]</span>
              <span className="font-medium">{t.teams?.name}</span>
            </div>
          ))}
        </div>
      )}

      {scrim.status === 'open' && myTeams.length > 0 && !isParticipant && (
        <div className="card space-y-3">
          <select className="input-field" value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
            <option value="">Selecionar Team</option>
            {myTeams.map((t) => <option key={t.id} value={t.id}>[{t.tag}] {t.name}</option>)}
          </select>
          <Button className="w-full" loading={joining} onClick={handleJoin} disabled={!selectedTeam}>
            Inscrever Team
          </Button>
        </div>
      )}
    </div>
  )
}
