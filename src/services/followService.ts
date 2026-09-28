import { supabase } from '@/lib/supabase'

export async function isFollowingProfile(followerId: string, profileId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('followed_profile_id', profileId)
    .maybeSingle()
  if (error) throw error
  return !!data
}

export async function followProfile(followerId: string, profileId: string): Promise<void> {
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, followed_profile_id: profileId })
  if (error) throw error
}

export async function unfollowProfile(followerId: string, profileId: string): Promise<void> {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('followed_profile_id', profileId)
  if (error) throw error
}
