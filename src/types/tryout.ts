import type { ApplicationStatus, PlayerRole } from './database'

export interface Tryout {
  id: string
  teamId: string
  title: string
  roleSought: PlayerRole
  slots: number
  requirements: string | null
  description: string | null
  closesAt: string | null
  status: string
  createdBy: string
  createdAt: string
  teamName?: string
  teamTag?: string
  teamLogoUrl?: string | null
  teamCountry?: string
}

export interface Application {
  id: string
  tryoutId: string
  applicantId: string
  message: string | null
  experience: string | null
  availability: string | null
  videoUrl: string | null
  status: ApplicationStatus
  createdAt: string
  applicantNickname?: string
}

export interface CreateTryoutInput {
  teamId: string
  title: string
  roleSought: PlayerRole
  slots: number
  requirements?: string
  description?: string
  closesAt?: string
}

export interface ApplyToTryoutInput {
  tryoutId: string
  message?: string
  experience?: string
  availability?: string
  videoUrl?: string
}
