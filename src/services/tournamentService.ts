import { supabase } from '@/lib/supabase'
import type { CreateTournamentInput, Tournament, Match, MatchResult, Standing } from '@/types/tournament'

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

function rowToTournament(row: any): Tournament {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    bannerUrl: row.banner_url,
    organizerId: row.organizer_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    maxTeams: row.max_teams,
    format: row.format,
    rules: row.rules,
    prize: row.prize,
    status: row.status,
    country: row.country,
    pointsPerKill: Number(row.points_per_kill ?? 1),
    placementPoints: row.placement_points ?? {},
    teamCount: row.tournament_teams?.[0]?.count,
    organizerNickname: row.profiles?.nickname
  }
}

export async function listTournaments(status?: string): Promise<Tournament[]> {
  let q = supabase
    .from('tournaments')
    .select('*, tournament_teams(count), profiles:organizer_id(nickname)')
    .order('starts_at', { ascending: true })
    .limit(40)
  if (status) q = q.eq('status', status)
  else q = q.in('status', ['open', 'upcoming', 'live', 'finished'])
  const { data, error } = await q
  if (error) throw error
  return (data ?? []).map(rowToTournament)
}

export async function getTournament(id: string): Promise<Tournament | null> {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*, tournament_teams(count), profiles:organizer_id(nickname)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? rowToTournament(data) : null
}

export async function createTournament(input: CreateTournamentInput, organizerId: string): Promise<Tournament> {
  const slug = slugify(input.name) + '-' + Date.now().toString(36)
  const { data, error } = await supabase
    .from('tournaments')
    .insert({
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      starts_at: input.startsAt,
      ends_at: input.endsAt || null,
      max_teams: input.maxTeams,
      format: input.format,
      rules: input.rules?.trim() || null,
      prize: input.prize?.trim() || null,
      points_per_kill: input.pointsPerKill ?? 1,
      organizer_id: organizerId,
      status: 'open'
    })
    .select()
    .single()
  if (error) throw error
  return rowToTournament(data)
}

export async function registerTeam(tournamentId: string, teamId: string): Promise<void> {
  const { error } = await supabase
    .from('tournament_teams')
    .insert({ tournament_id: tournamentId, team_id: teamId })
  if (error) throw error
}

export async function listTournamentTeams(tournamentId: string) {
  const { data, error } = await supabase
    .from('tournament_teams')
    .select('*, teams(name, tag, logo_url)')
    .eq('tournament_id', tournamentId)
  if (error) throw error
  return data ?? []
}

export async function listMatches(tournamentId: string): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('scheduled_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((r: any) => ({
    id: r.id,
    tournamentId: r.tournament_id,
    roundId: r.round_id,
    name: r.name,
    scheduledAt: r.scheduled_at,
    roomCode: r.room_code,
    roomPassword: r.room_password,
    status: r.status
  }))
}

export async function createMatch(
  tournamentId: string,
  payload: { name?: string; scheduledAt?: string; roomCode?: string; roomPassword?: string }
): Promise<Match> {
  const { data, error } = await supabase
    .from('matches')
    .insert({
      tournament_id: tournamentId,
      name: payload.name || null,
      scheduled_at: payload.scheduledAt || null,
      room_code: payload.roomCode || null,
      room_password: payload.roomPassword || null,
      status: 'scheduled'
    })
    .select()
    .single()
  if (error) throw error
  return {
    id: data.id,
    tournamentId: data.tournament_id,
    roundId: data.round_id,
    name: data.name,
    scheduledAt: data.scheduled_at,
    roomCode: data.room_code,
    roomPassword: data.room_password,
    status: data.status
  }
}

export async function upsertMatchResult(
  matchId: string,
  teamId: string,
  placement: number,
  kills: number
): Promise<MatchResult> {
  const { data, error } = await supabase
    .from('match_results')
    .upsert(
      { match_id: matchId, team_id: teamId, placement, kills },
      { onConflict: 'match_id,team_id' }
    )
    .select()
    .single()
  if (error) throw error
  return {
    id: data.id,
    matchId: data.match_id,
    teamId: data.team_id,
    placement: data.placement,
    kills: data.kills,
    placementPoints: Number(data.placement_points),
    killPoints: Number(data.kill_points),
    totalPoints: Number(data.total_points)
  }
}

export async function getStandings(tournamentId: string): Promise<Standing[]> {
  const { data, error } = await supabase
    .from('match_results')
    .select('team_id, kills, placement_points, total_points, matches!inner(tournament_id), teams(name, tag)')
    .eq('matches.tournament_id', tournamentId)
  if (error) throw error

  const map = new Map<string, Standing>()
  for (const row of data ?? []) {
    const tid = row.team_id
    const existing = map.get(tid)
    if (existing) {
      existing.kills += row.kills
      existing.placementPoints += Number(row.placement_points)
      existing.totalPoints += Number(row.total_points)
      existing.matches += 1
    } else {
      map.set(tid, {
        teamId: tid,
        teamName: (row as any).teams?.name ?? 'Team',
        teamTag: (row as any).teams?.tag ?? '',
        kills: row.kills,
        placementPoints: Number(row.placement_points),
        totalPoints: Number(row.total_points),
        matches: 1
      })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.totalPoints - a.totalPoints || b.kills - a.kills)
}
