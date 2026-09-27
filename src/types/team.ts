import type { TeamMemberRole, TeamStatus, PlayerRole } from './database'

export interface Team {
  id: string
  name: string
  tag: string
  logoUrl: string | null
  bannerUrl: string | null
  country: string
  province: string | null
  description: string | null
  captainId: string
  status: TeamStatus
  recruiting: boolean
  createdAt: string
  memberCount?: number
  captainNickname?: string
}

export interface TeamMember {
  id: string
  teamId: string
  profileId: string
  teamRole: TeamMemberRole
  joinedAt: string
  nickname?: string
  primaryRole?: PlayerRole | null
  avatarUrl?: string | null
}

export interface CreateTeamInput {
  name: string
  tag: string
  country: string
  province?: string
  description?: string
}

export const TEAM_MEMBER_ROLES: TeamMemberRole[] = [
  'Captain',
  'Vice Captain',
  'Rush',
  'IGL',
  'Support',
  'Sniper',
  'Flex'
]
