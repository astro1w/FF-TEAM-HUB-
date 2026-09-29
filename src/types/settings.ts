export type MessagePermission = 'everyone' | 'team' | 'none'
export type ProfileVisibility = 'everyone' | 'team' | 'none'
export type CompetitiveStatus = 'searching' | 'in_team' | 'unavailable'
export type ThemePreference = 'light' | 'dark' | 'system'
export type Locale = 'pt' | 'en'

export const COMPETITIVE_STATUS_LABELS: Record<CompetitiveStatus, string> = {
  searching: 'Procurando equipa',
  in_team: 'Em equipa',
  unavailable: 'Não disponível'
}

export const VISIBILITY_LABELS: Record<MessagePermission, string> = {
  everyone: 'Todos',
  team: 'Apenas jogadores da equipa',
  none: 'Ninguém'
}

/** Tipos de notificação que o jogador pode desligar nesta versão da app. */
export const MUTABLE_NOTIFICATION_TYPES = ['message_received', 'post_like', 'post_reply', 'new_follower'] as const
export type MutableNotificationType = (typeof MUTABLE_NOTIFICATION_TYPES)[number]

export const NOTIFICATION_LABELS: Record<MutableNotificationType, string> = {
  message_received: 'Mensagens',
  post_like: 'Likes',
  post_reply: 'Respostas aos teus posts',
  new_follower: 'Novos seguidores'
}

export interface PrivacySettings {
  whoCanMessage: MessagePermission
  whoCanComment: MessagePermission
  profileVisibility: ProfileVisibility
  showOnlineStatus: boolean
  showUid: boolean
  showStats: boolean
}

export interface AccountSettings {
  competitiveStatus: CompetitiveStatus
  themePreference: ThemePreference
  locale: Locale
}

export interface BlockedPlayer {
  id: string
  nickname: string
  avatarUrl: string | null
  blockedAt: string
}
