import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/user'
import type { Database } from '@/types/database'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    nickname: row.nickname,
    freeFireId: row.free_fire_id,
    country: row.country,
    province: row.province,
    city: row.city,
    primaryRole: row.primary_role,
    secondaryRole: row.secondary_role,
    skillLevel: row.skill_level,
    availability: row.availability ?? [],
    bio: row.bio,
    avatarUrl: row.avatar_url,
    role: row.role,
    status: row.status,
    onboardingCompleted: row.onboarding_completed,
    createdAt: row.created_at
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data ? rowToProfile(data) : null
}

export async function createInitialProfile(userId: string, nickname: string, country: string, province: string) {
  const { error } = await supabase.from('profiles').insert({
    id: userId,
    nickname,
    country,
    province,
    role: 'player',
    status: 'active',
    onboarding_completed: false
  })
  if (error) throw error
}

export async function completeOnboarding(
  userId: string,
  payload: {
    nickname: string
    freeFireId: string
    country: string
    province: string
    city: string
    primaryRole: string
    secondaryRole: string
    skillLevel: string
    availability: string[]
    bio: string
  }
) {
  const { error } = await supabase
    .from('profiles')
    .update({
      nickname: payload.nickname,
      free_fire_id: payload.freeFireId || null,
      country: payload.country,
      province: payload.province || null,
      city: payload.city || null,
      primary_role: payload.primaryRole as never,
      secondary_role: (payload.secondaryRole || null) as never,
      skill_level: payload.skillLevel as never,
      availability: payload.availability as never,
      bio: payload.bio || null,
      onboarding_completed: true
    })
    .eq('id', userId)

  if (error) throw error
}
