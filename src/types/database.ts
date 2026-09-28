// Tipos alinhados com as migrations em /supabase/migrations.

export type UserRole = 'player' | 'captain' | 'organizer' | 'moderator' | 'admin'
export type PlayerRole = 'RUSH' | 'IGL' | 'SUPPORT' | 'SNIPER' | 'FLEX'
export type SkillLevel = 'Iniciante' | 'Intermédio' | 'Competitivo' | 'Avançado'
export type Availability = 'Manhã' | 'Tarde' | 'Noite' | 'Fim de semana'
export type AccountStatus = 'active' | 'suspended' | 'banned'
export type TeamStatus = 'active' | 'inactive' | 'disbanded'
export type TeamMemberRole = 'Captain' | 'Vice Captain' | 'Rush' | 'IGL' | 'Support' | 'Sniper' | 'Flex'
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'
export type NotificationType =
  | 'application_received'
  | 'application_accepted'
  | 'application_rejected'
  | 'tryout_created'
  | 'scrim_invitation'
  | 'tournament_update'
  | 'match_reminder'
  | 'message_received'
  | 'team_update'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nickname: string
          free_fire_id: string | null
          country: string
          province: string | null
          city: string | null
          primary_role: PlayerRole | null
          secondary_role: PlayerRole | null
          skill_level: SkillLevel | null
          availability: Availability[] | null
          bio: string | null
          avatar_url: string | null
          role: UserRole
          status: AccountStatus
          onboarding_completed: boolean
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      teams: {
        Row: {
          id: string
          name: string
          tag: string
          logo_url: string | null
          banner_url: string | null
          country: string
          province: string | null
          description: string | null
          captain_id: string
          status: TeamStatus
          recruiting: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          tag: string
          country?: string
          province?: string | null
          description?: string | null
          captain_id: string
          logo_url?: string | null
          banner_url?: string | null
          status?: TeamStatus
          recruiting?: boolean
        }
        Update: Partial<Database['public']['Tables']['teams']['Row']>
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          profile_id: string
          team_role: TeamMemberRole
          joined_at: string
        }
        Insert: {
          team_id: string
          profile_id: string
          team_role?: TeamMemberRole
        }
        Update: Partial<Database['public']['Tables']['team_members']['Row']>
      }
      tryouts: {
        Row: {
          id: string
          team_id: string
          title: string
          role_sought: PlayerRole
          slots: number
          requirements: string | null
          description: string | null
          closes_at: string | null
          status: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          team_id: string
          title: string
          role_sought: PlayerRole
          slots?: number
          requirements?: string | null
          description?: string | null
          closes_at?: string | null
          created_by: string
        }
        Update: Partial<Database['public']['Tables']['tryouts']['Row']>
      }
      applications: {
        Row: {
          id: string
          tryout_id: string
          applicant_id: string
          message: string | null
          experience: string | null
          availability: string | null
          video_url: string | null
          status: ApplicationStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          tryout_id: string
          applicant_id: string
          message?: string | null
          experience?: string | null
          availability?: string | null
          video_url?: string | null
        }
        Update: Partial<Database['public']['Tables']['applications']['Row']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: NotificationType
          title: string
          body: string | null
          data: Record<string, unknown> | null
          read: boolean
          created_at: string
        }
        Insert: {
          user_id: string
          type: NotificationType
          title: string
          body?: string | null
          data?: Record<string, unknown> | null
        }
        Update: Partial<Database['public']['Tables']['notifications']['Row']>
      }
    }
  }
}
