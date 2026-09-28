import { supabase } from '@/lib/supabase'
import { rowToProfile } from '@/services/profileService'
import type { Profile } from '@/types/user'

export interface PlayerTeam {
  id: string
  name: string
  tag: string
  logoUrl: string | null
  teamRole: string
}

export interface PlayerAchievement {
  title: string
  icon: string | null
  earnedAt: string
}

export interface PlayerPage {
  profile: Profile
  team: PlayerTeam | null
  followers: number
  following: number
  achievements: PlayerAchievement[]
}

/** Perfil público de um jogador. Só devolve dados que as regras de acesso já permitem ver. */
export async function getPlayerPage(id: string): Promise<PlayerPage | null> {
  const { data: row, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!row) return null

  const [teamRes, followersRes, followingRes, achRes] = await Promise.all([
    supabase.from('team_members').select('team_role, teams(id, name, tag, logo_url)').eq('profile_id', id).limit(1),
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('followed_profile_id', id),
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', id),
    supabase.from('player_achievements').select('earned_at, achievements(title, icon)').eq('profile_id', id)
  ])

  const t: any = teamRes.data?.[0]
  return {
    profile: rowToProfile(row as any),
    team: t?.teams
      ? { id: t.teams.id, name: t.teams.name, tag: t.teams.tag, logoUrl: t.teams.logo_url, teamRole: t.team_role }
      : null,
    followers: followersRes.count ?? 0,
    following: followingRes.count ?? 0,
    achievements: (achRes.data ?? []).map((a: any) => ({
      title: a.achievements?.title ?? '',
      icon: a.achievements?.icon ?? null,
      earnedAt: a.earned_at
    }))
  }
}

export interface PlayerListItem {
  profile: Profile
  isFollowing: boolean
}

export interface PlayerListFilters {
  search?: string
  role?: string
  province?: string
  page?: number
}

export const PLAYERS_PAGE_SIZE = 20

/** Remove caracteres que têm significado especial no filtro .or()/ilike do PostgREST. */
function sanitizeSearch(input: string): string {
  return input.replace(/[%,()*\\]/g, ' ').trim().slice(0, 40)
}

/**
 * Lista jogadores registados (onboarding concluído, contas ativas — a RLS já esconde
 * suspensos/banidos), com pesquisa e filtros reais. Exclui o próprio utilizador.
 */
export async function listPlayers(
  currentUserId: string,
  filters: PlayerListFilters = {}
): Promise<{ items: PlayerListItem[]; hasMore: boolean }> {
  const page = filters.page ?? 0
  const from = page * PLAYERS_PAGE_SIZE
  const to = from + PLAYERS_PAGE_SIZE // pede +1 para saber se há mais

  let q = supabase
    .from('profiles')
    .select('*')
    .eq('onboarding_completed', true)
    .neq('id', currentUserId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filters.role) q = q.eq('primary_role', filters.role)
  if (filters.province) q = q.eq('province', filters.province)

  const term = filters.search ? sanitizeSearch(filters.search) : ''
  if (term) q = q.or(`nickname.ilike.%${term}%,competitive_id.ilike.%${term}%`)

  const { data, error } = await q
  if (error) throw error

  const rows = data ?? []
  const hasMore = rows.length > PLAYERS_PAGE_SIZE
  const pageRows = rows.slice(0, PLAYERS_PAGE_SIZE)

  let followedIds = new Set<string>()
  if (pageRows.length > 0) {
    const { data: fol, error: folError } = await supabase
      .from('follows')
      .select('followed_profile_id')
      .eq('follower_id', currentUserId)
      .in('followed_profile_id', pageRows.map((r: any) => r.id))
    if (folError) throw folError
    followedIds = new Set((fol ?? []).map((f: any) => f.followed_profile_id))
  }

  return {
    items: pageRows.map((r: any) => ({
      profile: rowToProfile(r),
      isFollowing: followedIds.has(r.id)
    })),
    hasMore
  }
}
