export type TournamentStatus = 'draft' | 'open' | 'upcoming' | 'live' | 'finished' | 'cancelled'
export type TournamentFormat = 'Battle Royale' | 'Liga' | 'Eliminação' | 'Grupos + Final'
export type MatchStatus = 'scheduled' | 'live' | 'completed' | 'cancelled'

export interface Tournament {
  id: string
  name: string
  slug: string
  description: string | null
  bannerUrl: string | null
  organizerId: string
  startsAt: string
  endsAt: string | null
  maxTeams: number
  format: TournamentFormat
  rules: string | null
  prize: string | null
  status: TournamentStatus
  country: string
  pointsPerKill: number
  placementPoints: Record<string, number>
  teamCount?: number
  organizerNickname?: string
}

export interface CreateTournamentInput {
  name: string
  description?: string
  startsAt: string
  endsAt?: string
  maxTeams: number
  format: TournamentFormat
  rules?: string
  prize?: string
  pointsPerKill?: number
  bannerUrl?: string
}

export interface Match {
  id: string
  tournamentId: string
  roundId: string | null
  name: string | null
  scheduledAt: string | null
  status: MatchStatus
}

export interface MatchResult {
  id: string
  matchId: string
  teamId: string
  placement: number
  kills: number
  placementPoints: number
  killPoints: number
  totalPoints: number
  teamName?: string
  teamTag?: string
}

export interface Standing {
  teamId: string
  teamName: string
  teamTag: string
  kills: number
  placementPoints: number
  totalPoints: number
  matches: number
}
