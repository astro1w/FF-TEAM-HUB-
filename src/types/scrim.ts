export type ScrimStatus = 'open' | 'full' | 'live' | 'finished' | 'cancelled'
export type ScrimFormat = 'BR' | 'CS' | 'Custom'

export interface Scrim {
  id: string
  name: string
  hostTeamId: string | null
  createdBy: string
  scheduledAt: string
  format: ScrimFormat
  maxTeams: number
  rules: string | null
  status: ScrimStatus
  country: string
  createdAt: string
  teamCount?: number
  hostTeamName?: string
}

export interface CreateScrimInput {
  name: string
  scheduledAt: string
  format: ScrimFormat
  maxTeams: number
  rules?: string
  hostTeamId?: string
  roomCode?: string
  roomPassword?: string
}
