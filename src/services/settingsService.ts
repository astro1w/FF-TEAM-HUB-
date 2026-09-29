import { supabase } from '@/lib/supabase'
import type {
  AccountSettings,
  BlockedPlayer,
  CompetitiveStatus,
  Locale,
  MessagePermission,
  MutableNotificationType,
  PrivacySettings,
  ProfileVisibility,
  ThemePreference
} from '@/types/settings'

const rpc = (name: string, args?: Record<string, unknown>) => (supabase as any).rpc(name, args)

// --- Conta ---

export async function updateBasicProfile(
  userId: string,
  payload: { nickname?: string; bio?: string | null; freeFireId?: string | null }
) {
  const patch: Record<string, unknown> = {}
  if (payload.nickname !== undefined) patch.nickname = payload.nickname.trim()
  if (payload.bio !== undefined) patch.bio = payload.bio?.trim() || null
  if (payload.freeFireId !== undefined) patch.free_fire_id = payload.freeFireId?.trim() || null
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId)
  if (error) throw error
}

export async function updateCompetitiveProfile(
  userId: string,
  payload: {
    countryCode: string
    province: string | null
    primaryRole: string | null
    secondaryRole: string | null
    skillLevel: string | null
    availability: string[]
    competitiveStatus: CompetitiveStatus
  }
) {
  const { error } = await supabase
    .from('profiles')
    .update({
      country_code: payload.countryCode,
      province: payload.province,
      primary_role: payload.primaryRole as never,
      secondary_role: payload.secondaryRole as never,
      skill_level: payload.skillLevel as never,
      availability: payload.availability as never,
      competitive_status: payload.competitiveStatus as never
    })
    .eq('id', userId)
  if (error) throw error
}

export async function changeEmail(newEmail: string) {
  const { error } = await supabase.auth.updateUser({ email: newEmail })
  if (error) throw error
}

export async function changePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw error
}

// --- Privacidade ---

export async function getPrivacySettings(userId: string): Promise<PrivacySettings> {
  const { data, error } = await supabase
    .from('profiles')
    .select('who_can_message, who_can_comment, profile_visibility, show_online_status, show_uid, show_stats')
    .eq('id', userId)
    .single()
  if (error) throw error
  const r = data as any
  return {
    whoCanMessage: r.who_can_message,
    whoCanComment: r.who_can_comment,
    profileVisibility: r.profile_visibility,
    showOnlineStatus: r.show_online_status,
    showUid: r.show_uid,
    showStats: r.show_stats
  }
}

export async function updatePrivacySettings(userId: string, patch: Partial<PrivacySettings>) {
  const row: Record<string, unknown> = {}
  if (patch.whoCanMessage) row.who_can_message = patch.whoCanMessage as MessagePermission
  if (patch.whoCanComment) row.who_can_comment = patch.whoCanComment as MessagePermission
  if (patch.profileVisibility) row.profile_visibility = patch.profileVisibility as ProfileVisibility
  if (patch.showOnlineStatus !== undefined) row.show_online_status = patch.showOnlineStatus
  if (patch.showUid !== undefined) row.show_uid = patch.showUid
  if (patch.showStats !== undefined) row.show_stats = patch.showStats
  const { error } = await supabase.from('profiles').update(row).eq('id', userId)
  if (error) throw error
}

// --- Aparência / idioma (preferência guardada; ver nota em featureStatus) ---

export async function updateAppPreferences(userId: string, patch: { theme?: ThemePreference; locale?: Locale }) {
  const row: Record<string, unknown> = {}
  if (patch.theme) row.theme_preference = patch.theme
  if (patch.locale) row.locale = patch.locale
  const { error } = await supabase.from('profiles').update(row).eq('id', userId)
  if (error) throw error
}

export async function getAccountSettings(userId: string): Promise<AccountSettings> {
  const { data, error } = await supabase
    .from('profiles')
    .select('competitive_status, theme_preference, locale')
    .eq('id', userId)
    .single()
  if (error) throw error
  const r = data as any
  return { competitiveStatus: r.competitive_status, themePreference: r.theme_preference, locale: r.locale }
}

// --- Notificações ---

export async function getMutedNotificationTypes(userId: string): Promise<Set<MutableNotificationType>> {
  const { data, error } = await supabase.from('notification_mutes').select('notification_type').eq('profile_id', userId)
  if (error) throw error
  return new Set((data ?? []).map((r: any) => r.notification_type))
}

export async function setNotificationEnabled(type: MutableNotificationType, enabled: boolean) {
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) throw new Error('Sessão inválida.')
  if (enabled) {
    const { error } = await supabase
      .from('notification_mutes')
      .delete()
      .eq('profile_id', userId)
      .eq('notification_type', type)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('notification_mutes')
      .upsert({ profile_id: userId, notification_type: type } as any, { onConflict: 'profile_id,notification_type' })
    if (error) throw error
  }
}

// --- Bloqueios ---

export async function listBlockedPlayers(): Promise<BlockedPlayer[]> {
  const { data, error } = await supabase
    .from('blocked_players')
    .select('blocked_id, created_at, profiles:blocked_id(nickname, avatar_url)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r: any) => ({
    id: r.blocked_id,
    nickname: r.profiles?.nickname ?? 'Jogador',
    avatarUrl: r.profiles?.avatar_url ?? null,
    blockedAt: r.created_at
  }))
}

export async function blockPlayer(targetId: string) {
  const { error } = await rpc('block_player', { p_target: targetId })
  if (error) throw error
}

export async function unblockPlayer(targetId: string) {
  const { error } = await rpc('unblock_player', { p_target: targetId })
  if (error) throw error
}

export async function isBlocked(targetId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('blocked_players')
    .select('blocked_id')
    .eq('blocked_id', targetId)
    .maybeSingle()
  if (error) throw error
  return !!data
}

// --- Sessões ---

/** Termina a sessão. scope 'others' mantém a sessão atual e termina as restantes (Supabase Auth). */
export async function signOutSessions(scope: 'global' | 'others' | 'local') {
  const { error } = await supabase.auth.signOut({ scope })
  if (error) throw error
}

// --- Eliminação de conta ---

/**
 * A anon key não tem permissão para apagar contas do Supabase Auth. Isto regista o pedido,
 * suspende a conta imediatamente e um administrador confirma a eliminação definitiva.
 */
export async function requestAccountDeletion(reason: string) {
  const { error } = await rpc('request_account_deletion', { p_reason: reason || null })
  if (error) throw error
}
