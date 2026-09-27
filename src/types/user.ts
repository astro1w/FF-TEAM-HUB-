import type { AccountStatus, Availability, PlayerRole, SkillLevel, UserRole } from './database'

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
