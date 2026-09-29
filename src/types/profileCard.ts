export type ProfileCardTheme =
  | 'default'
  | 'neon'
  | 'fire'
  | 'ice'
  | 'royal'
  | 'shadow'

export type ProfileCardLayout =
  | 'classic'
  | 'minimal'
  | 'competitive'
  | 'signature'

export type ProfileCardFrame =
  | 'none'
  | 'basic'
  | 'elite'
  | 'legendary'

export type ProfileCardEffect =
  | 'none'
  | 'glow'
  | 'particles'
  | 'energy'

export type ProfileCardPattern =
  | 'none'
  | 'grid'
  | 'lines'
  | 'hex'
  | 'carbon'

export type ProfileCardFeaturedStat =
  | 'rank'
  | 'kills'
  | 'matches'
  | 'wins'
  | 'points'

export interface ProfileCardSettings {
  verificationStyle?: 'classic' | 'elite' | 'pro' | 'legend'
  id: string
  profileId: string
  theme: ProfileCardTheme
  layout: ProfileCardLayout
  background: string
  accentColor: string
  frame: ProfileCardFrame
  effect: ProfileCardEffect
  pattern: ProfileCardPattern
  personalSymbol: string | null
  bio: string | null
  featuredStat: ProfileCardFeaturedStat
  visibleStats: string[]
  updatedAt: string
}
