import { supabase } from '@/lib/supabase'
import type { ProfileCardSettings } from '@/types/profileCard'

function mapRow(row: any): ProfileCardSettings {
  return {
    id: row.id,
    profileId: row.profile_id,
    theme: row.theme,
    layout: row.layout,
    background: row.background,
    accentColor: row.accent_color,
    frame: row.frame,
    effect: row.effect,
    pattern: row.pattern,
    verificationStyle: row.verification_style || 'classic',
    personalSymbol: row.personal_symbol,
    bio: row.bio,
    featuredStat: row.featured_stat,
    visibleStats: row.visible_stats ?? [],
    updatedAt: row.updated_at
  }
}

export async function getProfileCardSettings(profileId: string): Promise<ProfileCardSettings | null> {
  const { data, error } = await supabase
    .from('profile_card_settings')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle()

  if (error) throw error
  return data ? mapRow(data) : null
}

export async function createProfileCardSettings(profileId: string): Promise<ProfileCardSettings> {
  const { data, error } = await supabase
    .from('profile_card_settings')
    .insert({ profile_id: profileId })
    .select('*')
    .single()

  if (error) throw error
  return mapRow(data)
}

export async function getOrCreateProfileCardSettings(profileId: string): Promise<ProfileCardSettings> {
  const existing = await getProfileCardSettings(profileId)

  if (existing) return existing

  return createProfileCardSettings(profileId)
}

export async function updateProfileCardSettings(profileId: string, updates: Partial<Omit<ProfileCardSettings, 'id' | 'profileId' | 'updatedAt'>>): Promise<ProfileCardSettings> {
  const payload: Record<string, unknown> = {}

  if (updates.theme !== undefined) payload.theme = updates.theme
  if (updates.layout !== undefined) payload.layout = updates.layout
  if (updates.background !== undefined) payload.background = updates.background
  if (updates.accentColor !== undefined) payload.accent_color = updates.accentColor
  if (updates.frame !== undefined) payload.frame = updates.frame
  if (updates.effect !== undefined) payload.effect = updates.effect
  if (updates.pattern !== undefined) payload.pattern = updates.pattern
  if (updates.verificationStyle !== undefined) payload.verification_style = updates.verificationStyle
  if (updates.personalSymbol !== undefined) payload.personal_symbol = updates.personalSymbol
  if (updates.bio !== undefined) payload.bio = updates.bio
  if (updates.featuredStat !== undefined) payload.featured_stat = updates.featuredStat
  if (updates.visibleStats !== undefined) payload.visible_stats = updates.visibleStats

  const { data, error } = await supabase
    .from('profile_card_settings')
    .update(payload)
    .eq('profile_id', profileId)
    .select('*')
    .single()

  if (error) throw error
  return mapRow(data)
}
