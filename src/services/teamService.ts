import { supabase } from '@/lib/supabase'
import type { CreateTeamInput, Team, TeamMember } from '@/types/team'
import type { Database } from '@/types/database'

type TeamRow = Database['public']['Tables']['teams']['Row']

function rowToTeam(row: TeamRow & { member_count?: number; captain_nickname?: string }): Team {
  return {
    id: row.id,
    name: row.name,
    tag: row.tag,
    logoUrl: row.logo_url,
    bannerUrl: row.banner_url,
    country: row.country,
    province: row.province,
    description: row.description,
    captainId: row.captain_id,
    status: row.status,
    recruiting: row.recruiting,
    createdAt: row.created_at,
    memberCount: row.member_count,
    captainNickname: row.captain_nickname
  }
}

export async function listTeams(filters?: {
  country?: string
  province?: string
  recruiting?: boolean
  search?: string
}): Promise<Team[]> {
  let query = supabase
    .from('teams')
    .select('*, team_members(count)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50)

  if (filters?.country) query = query.eq('country', filters.country)
  if (filters?.province) query = query.eq('province', filters.province)
  if (filters?.recruiting === true) query = query.eq('recruiting', true)
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,tag.ilike.%${filters.search}%`)
  }

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map((row: any) =>
    rowToTeam({
      ...row,
      member_count: row.team_members?.[0]?.count ?? 0
    })
  )
}

export async function getTeam(id: string): Promise<Team | null> {
  const { data, error } = await supabase
    .from('teams')
    .select('*, team_members(count)')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return rowToTeam({
    ...data,
    member_count: (data as any).team_members?.[0]?.count ?? 0
  } as any)
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('*, profiles(nickname, primary_role, avatar_url)')
    .eq('team_id', teamId)
    .order('joined_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row: any) => ({
    id: row.id,
    teamId: row.team_id,
    profileId: row.profile_id,
    teamRole: row.team_role,
    joinedAt: row.joined_at,
    nickname: row.profiles?.nickname,
    primaryRole: row.profiles?.primary_role,
    avatarUrl: row.profiles?.avatar_url
  }))
}

export async function createTeam(input: CreateTeamInput, captainId: string): Promise<Team> {
  const tag = input.tag.trim().toUpperCase()

  const { data: team, error } = await supabase
    .from('teams')
    .insert({
      name: input.name.trim(),
      tag,
      country: input.country,
      province: input.province || null,
      description: input.description?.trim() || null,
      captain_id: captainId,
      recruiting: true,
      status: 'active'
    })
    .select()
    .single()

  if (error) throw error

  const { error: memberError } = await supabase.from('team_members').insert({
    team_id: team.id,
    profile_id: captainId,
    team_role: 'Captain'
  })

  if (memberError) {
    await supabase.from('teams').delete().eq('id', team.id)
    throw memberError
  }

  await supabase
    .from('profiles')
    .update({ role: 'captain' })
    .eq('id', captainId)
    .eq('role', 'player')

  return rowToTeam(team)
}

export async function getMyTeams(userId: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('team_id, teams(*)')
    .eq('profile_id', userId)

  if (error) throw error

  return (data ?? [])
    .map((row: any) => (row.teams ? rowToTeam(row.teams) : null))
    .filter(Boolean) as Team[]
}
