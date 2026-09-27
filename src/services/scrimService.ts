import { supabase } from '@/lib/supabase'
import type { CreateScrimInput, Scrim } from '@/types/scrim'

function rowToScrim(row: any): Scrim {
  return {
    id: row.id,
    name: row.name,
    hostTeamId: row.host_team_id,
    createdBy: row.created_by,
    scheduledAt: row.scheduled_at,
    format: row.format,
    maxTeams: row.max_teams,
    rules: row.rules,
    roomCode: row.room_code,
    roomPassword: row.room_password,
    status: row.status,
    country: row.country,
    createdAt: row.created_at,
    teamCount: row.scrim_teams?.[0]?.count ?? row.team_count,
    hostTeamName: row.teams?.name
  }
}

export async function listScrims(status?: string): Promise<Scrim[]> {
  let q = supabase
    .from('scrims')
    .select('*, scrim_teams(count), teams:host_team_id(name)')
    .order('scheduled_at', { ascending: true })
    .limit(40)
  if (status) q = q.eq('status', status)
  else q = q.in('status', ['open', 'full', 'live'])
  const { data, error } = await q
  if (error) throw error
  return (data ?? []).map(rowToScrim)
}

export async function getScrim(id: string): Promise<Scrim | null> {
  const { data, error } = await supabase
    .from('scrims')
    .select('*, scrim_teams(count), teams:host_team_id(name)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? rowToScrim(data) : null
}

export async function createScrim(input: CreateScrimInput, userId: string): Promise<Scrim> {
  const { data, error } = await supabase
    .from('scrims')
    .insert({
      name: input.name.trim(),
      scheduled_at: input.scheduledAt,
      format: input.format,
      max_teams: input.maxTeams,
      rules: input.rules?.trim() || null,
      host_team_id: input.hostTeamId || null,
      room_code: input.roomCode || null,
      room_password: input.roomPassword || null,
      created_by: userId,
      status: 'open'
    })
    .select()
    .single()
  if (error) throw error
  return rowToScrim(data)
}

export async function joinScrim(scrimId: string, teamId: string): Promise<void> {
  const { error } = await supabase.from('scrim_teams').insert({ scrim_id: scrimId, team_id: teamId })
  if (error) throw error
}

export async function listScrimTeams(scrimId: string) {
  const { data, error } = await supabase
    .from('scrim_teams')
    .select('*, teams(name, tag, logo_url)')
    .eq('scrim_id', scrimId)
  if (error) throw error
  return data ?? []
}
