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
export type ScrimStatus = 'open' | 'full' | 'live' | 'finished' | 'cancelled'
export type ScrimFormat = 'BR' | 'CS' | 'Custom'
export type TournamentStatus = 'draft' | 'open' | 'upcoming' | 'live' | 'finished' | 'cancelled'
export type TournamentFormat = 'Battle Royale' | 'Liga' | 'Eliminação' | 'Grupos + Final'
export type MatchStatus = 'scheduled' | 'live' | 'completed' | 'cancelled'

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
          status?: string
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
          status?: ApplicationStatus
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
      scrims: {
        Row: {
          id: string
          name: string
          host_team_id: string | null
          created_by: string
          scheduled_at: string
          format: ScrimFormat
          max_teams: number
          rules: string | null
          room_code: string | null
          room_password: string | null
          status: ScrimStatus
          country: string
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          host_team_id?: string | null
          created_by: string
          scheduled_at: string
          format?: ScrimFormat
          max_teams?: number
          rules?: string | null
          room_code?: string | null
          room_password?: string | null
          status?: ScrimStatus
          country?: string
        }
        Update: Partial<Database['public']['Tables']['scrims']['Row']>
      }
      scrim_teams: {
        Row: {
          id: string
          scrim_id: string
          team_id: string
          joined_at: string
        }
        Insert: {
          scrim_id: string
          team_id: string
        }
        Update: Partial<Database['public']['Tables']['scrim_teams']['Row']>
      }
      tournaments: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          banner_url: string | null
          organizer_id: string
          starts_at: string
          ends_at: string | null
          max_teams: number
          format: TournamentFormat
          rules: string | null
          prize: string | null
          status: TournamentStatus
          country: string
          season_id: string | null
          points_per_kill: number
          placement_points: Record<string, number>
          tiebreaker: string
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          slug: string
          description?: string | null
          banner_url?: string | null
          organizer_id: string
          starts_at: string
          ends_at?: string | null
          max_teams?: number
          format?: TournamentFormat
          rules?: string | null
          prize?: string | null
          status?: TournamentStatus
          country?: string
          season_id?: string | null
          points_per_kill?: number
          placement_points?: Record<string, number>
        }
        Update: Partial<Database['public']['Tables']['tournaments']['Row']>
      }
      tournament_teams: {
        Row: {
          id: string
          tournament_id: string
          team_id: string
          seed: number | null
          registered_at: string
        }
        Insert: {
          tournament_id: string
          team_id: string
          seed?: number | null
        }
        Update: Partial<Database['public']['Tables']['tournament_teams']['Row']>
      }
      matches: {
        Row: {
          id: string
          tournament_id: string
          round_id: string | null
          name: string | null
          scheduled_at: string | null
          room_code: string | null
          room_password: string | null
          status: MatchStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          tournament_id: string
          round_id?: string | null
          name?: string | null
          scheduled_at?: string | null
          room_code?: string | null
          room_password?: string | null
          status?: MatchStatus
        }
        Update: Partial<Database['public']['Tables']['matches']['Row']>
      }
      match_results: {
        Row: {
          id: string
          match_id: string
          team_id: string
          placement: number
          kills: number
          placement_points: number
          kill_points: number
          total_points: number
          created_at: string
        }
        Insert: {
          match_id: string
          team_id: string
          placement: number
          kills?: number
          placement_points?: number
          kill_points?: number
          total_points?: number
        }
        Update: Partial<Database['public']['Tables']['match_results']['Row']>
      }
      posts: {
        Row: {
          id: string
          author_id: string
          team_id: string | null
          body: string
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          author_id: string
          team_id?: string | null
          body: string
          image_url?: string | null
        }
        Update: Partial<Database['public']['Tables']['posts']['Row']>
      }
      comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          body: string
          created_at: string
        }
        Insert: {
          post_id: string
          author_id: string
          body: string
        }
        Update: Partial<Database['public']['Tables']['comments']['Row']>
      }
      likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          post_id: string
          user_id: string
        }
        Update: Partial<Database['public']['Tables']['likes']['Row']>
      }
      conversations: {
        Row: {
          id: string
          is_group: boolean
          title: string | null
          team_id: string | null
          created_at: string
        }
        Insert: {
          is_group?: boolean
          title?: string | null
          team_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['conversations']['Row']>
      }
      conversation_members: {
        Row: {
          id: string
          conversation_id: string
          profile_id: string
          last_read_at: string | null
          joined_at: string
        }
        Insert: {
          conversation_id: string
          profile_id: string
          last_read_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['conversation_members']['Row']>
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          body: string
          created_at: string
        }
        Insert: {
          conversation_id: string
          sender_id: string
          body: string
        }
        Update: Partial<Database['public']['Tables']['messages']['Row']>
      }
      rankings: {
        Row: {
          id: string
          season_id: string | null
          profile_id: string | null
          team_id: string | null
          points: number
          kills: number
          wins: number
          matches_played: number
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['rankings']['Row']>
        Update: Partial<Database['public']['Tables']['rankings']['Row']>
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          target_type: string
          target_id: string
          reason: string
          details: string | null
          status: string
          reviewed_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          reporter_id: string
          target_type: string
          target_id: string
          reason: string
          details?: string | null
          status?: string
        }
        Update: Partial<Database['public']['Tables']['reports']['Row']>
      }
      admin_logs: {
        Row: {
          id: string
          admin_id: string
          action: string
          target_type: string | null
          target_id: string | null
          meta: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          admin_id: string
          action: string
          target_type?: string | null
          target_id?: string | null
          meta?: Record<string, unknown> | null
        }
        Update: Partial<Database['public']['Tables']['admin_logs']['Row']>
      }
      account_sanctions: {
        Row: {
          id: string
          profile_id: string
          status: AccountStatus
          reason: string | null
          start_date: string
          end_date: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          profile_id: string
          status: AccountStatus
          reason?: string | null
          start_date?: string
          end_date?: string | null
          created_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['account_sanctions']['Row']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
