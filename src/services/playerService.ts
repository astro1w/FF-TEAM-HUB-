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
