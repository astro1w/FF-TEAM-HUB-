import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'
import {
  getTournament, listTournamentTeams, registerTeam,
  listMatches, createMatch, getStandings, upsertMatchResult
} from '@/services/tournamentService'
import { getMyTeams } from '@/services/teamService'
import type { Tournament, Match, Standing } from '@/types/tournament'
import type { Team } from '@/types/team'
import { useAuth } from '@/hooks/useAuth'
import LoadingState from '@/components/ui/LoadingState'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>()
  const { user, profile } = useAuth()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [standings, setStandings] = useState<Standing[]>([])
  const [myTeams, setMyTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState('')
  const [tab, setTab] = useState<'info' | 'teams' | 'matches' | 'standings'>('info')
  const [showMatchForm, setShowMatchForm] = useState(false)
  const [matchName, setMatchName] = useState('')
  const [resultForm, setResultForm] = useState<{ matchId: string; teamId: string; placement: number; kills: number } | null>(null)

  const isOrganizer = user && tournament && (tournament.organizerId === user.id || profile?.role === 'admin')

  async function reload() {
    if (!id) return
    const [t, tm, m, s] = await Promise.all([
      getTournament(id),
      listTournamentTeams(id),
      listMatches(id),
      getStandings(id).catch(() => [])
    ])
    setTournament(t)
    setTeams(tm)
    setMatches(m)
    setStandings(s)
  }

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      reload(),
      user ? getMyTeams(user.id) : Promise.resolve([])
    ]).then(([, mt]) => {
      setMyTeams(mt as Team[])
      if ((mt as Team[]).length === 1) setSelectedTeam((mt as Team[])[0].id)
    }).catch((e) => {
      console.error(e)
      setError('Erro ao carregar torneio.')
    }).finally(() => setLoading(false))
  }, [id, user])

  async function handleRegister() {
    if (!selectedTeam || !tournament) return
    try {
      await registerTeam(tournament.id, selectedTeam)
      await reload()
    } catch (e: any) {
      alert(e?.message?.includes('unique') ? 'Team já inscrita.' : 'Não foi possível inscrever.')
    }
  }

  async function handleCreateMatch() {
    if (!tournament) return
    try {
      await createMatch(tournament.id, { name: matchName || undefined })
      setShowMatchForm(false)
      setMatchName('')
      await reload()
    } catch (e) {
      alert('Erro ao criar match.')
    }
  }

  async function handleSaveResult() {
    if (!resultForm) return
    try {
      await upsertMatchResult(resultForm.matchId, resultForm.teamId, resultForm.placement, resultForm.kills)
      setResultForm(null)
      await reload()
    } catch (e) {
      alert('Erro ao guardar resultado.')
    }
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!tournament) return <div className="px-4 pt-10"><EmptyState title="Torneio não encontrado." /></div>

  const date = new Date(tournament.startsAt)
  const alreadyRegistered = teams.some((t) => myTeams.some((mt) => mt.id === t.team_id))

  return (
    <div className="px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <div className="card mb-4">
        <h1 className="text-xl font-bold">{tournament.name}</h1>
        <p className="text-xs text-white/50 mt-1">
          {date.toLocaleDateString('pt-MZ')} · {tournament.format} · por {tournament.organizerNickname ?? 'Org'}
        </p>
        <div className="flex gap-2 mt-2">
          <span className="text-[10px] bg-success/15 text-success px-2 py-0.5 rounded-full">{tournament.status}</span>
          <span className="text-[10px] bg-base-700 px-2 py-0.5 rounded-full">{teams.length}/{tournament.maxTeams}</span>
          {tournament.prize && <span className="text-[10px] bg-warning/15 text-warning px-2 py-0.5 rounded-full">{tournament.prize}</span>}
        </div>
        {tournament.description && <p className="text-sm text-white/60 mt-3">{tournament.description}</p>}
      </div>

      <div className="flex gap-1 mb-4 overflow-x-auto">
        {(['info', 'teams', 'matches', 'standings'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full capitalize ${tab === t ? 'bg-accent text-white' : 'bg-base-700 text-white/70'}`}>
            {t === 'info' ? 'Info' : t === 'teams' ? 'Teams' : t === 'matches' ? 'Matches' : 'Classificação'}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="space-y-3">
          {tournament.rules && (
            <div className="card">
              <h2 className="text-sm font-semibold mb-1">Regras</h2>
              <p className="text-sm text-white/60 whitespace-pre-wrap">{tournament.rules}</p>
            </div>
          )}
          <div className="card text-sm text-white/60">
            <p>Pontos por kill: <strong className="text-white">{tournament.pointsPerKill}</strong></p>
            <p className="mt-1">Pontuação de placement configurável pelo organizador.</p>
          </div>
          {tournament.status === 'open' && myTeams.length > 0 && !alreadyRegistered && (
            <div className="card space-y-3">
              <select className="input-field" value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
                <option value="">Selecionar Team</option>
                {myTeams.map((t) => <option key={t.id} value={t.id}>[{t.tag}] {t.name}</option>)}
              </select>
              <Button className="w-full" onClick={handleRegister} disabled={!selectedTeam}>Inscrever Team</Button>
            </div>
          )}
        </div>
      )}

      {tab === 'teams' && (
        teams.length === 0 ? <EmptyState title="Nenhuma Team inscrita." /> : (
          <div className="space-y-2">
            {teams.map((t: any) => (
              <div key={t.id} className="card !py-3 flex gap-2 items-center">
                <span className="font-mono text-xs text-white/40">[{t.teams?.tag}]</span>
                <span className="font-medium">{t.teams?.name}</span>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'matches' && (
        <div>
          {isOrganizer && (
            <div className="mb-3">
              {showMatchForm ? (
                <div className="card space-y-2">
                  <Input label="Nome do match" value={matchName} onChange={(e) => setMatchName(e.target.value)} placeholder="Round 1 - Match A" />
                  <div className="flex gap-2">
                    <Button variant="secondary" className="flex-1" onClick={() => setShowMatchForm(false)}>Cancelar</Button>
                    <Button className="flex-1" onClick={handleCreateMatch}>Criar</Button>
                  </div>
                </div>
              ) : (
                <Button variant="secondary" className="w-full mb-3" onClick={() => setShowMatchForm(true)}>+ Match</Button>
              )}
            </div>
          )}
          {matches.length === 0 ? <EmptyState title="Sem matches ainda." /> : (
            <div className="space-y-2">
              {matches.map((m) => (
                <div key={m.id} className="card">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{m.name ?? 'Match'}</p>
                      <p className="text-xs text-white/40">{m.status}</p>
                    </div>
                    {isOrganizer && (
                      <button type="button" className="text-xs text-accent-soft" onClick={() => setResultForm({ matchId: m.id, teamId: teams[0]?.team_id ?? '', placement: 1, kills: 0 })}>
                        Resultado
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {resultForm && (
            <div className="card mt-3 space-y-2 border-accent/30">
              <h3 className="font-semibold text-sm">Inserir resultado</h3>
              <select className="input-field" value={resultForm.teamId} onChange={(e) => setResultForm({ ...resultForm, teamId: e.target.value })}>
                <option value="">Team</option>
                {teams.map((t: any) => <option key={t.team_id} value={t.team_id}>[{t.teams?.tag}] {t.teams?.name}</option>)}
              </select>
              <Input label="Placement" type="number" min={1} value={resultForm.placement} onChange={(e) => setResultForm({ ...resultForm, placement: Number(e.target.value) })} />
              <Input label="Kills" type="number" min={0} value={resultForm.kills} onChange={(e) => setResultForm({ ...resultForm, kills: Number(e.target.value) })} />
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setResultForm(null)}>Cancelar</Button>
                <Button className="flex-1" onClick={handleSaveResult}>Guardar</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'standings' && (
        standings.length === 0 ? <EmptyState title="Sem classificação ainda." description="Os resultados aparecem após matches." /> : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 text-left text-xs">
                  <th className="pb-2">#</th>
                  <th className="pb-2">Team</th>
                  <th className="pb-2 text-right">Kills</th>
                  <th className="pb-2 text-right">Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s, i) => (
                  <tr key={s.teamId} className="border-t border-base-600">
                    <td className="py-2 text-white/50">{i + 1}</td>
                    <td className="py-2 font-medium">[{s.teamTag}] {s.teamName}</td>
                    <td className="py-2 text-right">{s.kills}</td>
                    <td className="py-2 text-right font-bold text-accent-soft">{s.totalPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
