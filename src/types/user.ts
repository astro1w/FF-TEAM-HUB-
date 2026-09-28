import type { AccountStatus, Availability, PlayerRole, SkillLevel, UserRole } from './database'

/** Como cada função aparece ao utilizador (o valor guardado na base de dados não muda). */
export const ROLE_LABELS: Record<PlayerRole, string> = {
  RUSH: 'RUSHER / ENTRY',
  IGL: 'IGL',
  SUPPORT: 'SUPPORT',
  SNIPER: 'SNIPER',
  FLEX: 'FLEX'
}

/** Bandeira a partir do código ISO do país (ex.: MZ → 🇲🇿). */
export function flagEmoji(countryCode: string | null | undefined): string {
  if (!countryCode || countryCode.length !== 2) return '🌍'
  return String.fromCodePoint(...[...countryCode.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)))
}

export interface Profile {
  id: string
  nickname: string
  freeFireId: string | null
  country: string
  province: string | null
  city: string | null
  primaryRole: PlayerRole | null
  secondaryRole: PlayerRole | null
  skillLevel: SkillLevel | null
  availability: Availability[]
  bio: string | null
  avatarUrl: string | null
  role: UserRole
  status: AccountStatus
  onboardingCompleted: boolean
  isVerified: boolean
  competitiveId: string
  countryCode: string
  createdAt: string
}

export const PLAYER_ROLES: PlayerRole[] = ['RUSH', 'IGL', 'SUPPORT', 'SNIPER', 'FLEX']
export const SKILL_LEVELS: SkillLevel[] = ['Iniciante', 'Intermédio', 'Competitivo', 'Avançado']
export const AVAILABILITIES: Availability[] = ['Manhã', 'Tarde', 'Noite', 'Fim de semana']

export const MOZAMBIQUE_PROVINCES = [
  'Cabo Delgado',
  'Nampula',
  'Niassa',
  'Zambézia',
  'Tete',
  'Manica',
  'Sofala',
  'Inhambane',
  'Gaza',
  'Maputo',
  'Maputo Cidade'
]
