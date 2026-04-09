export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          avatar_url: string | null
          elo_rank: number
          casual_points: number
          level: number
          bio: string | null
          joined_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          avatar_url?: string | null
          elo_rank?: number
          casual_points?: number
          level?: number
          bio?: string | null
          joined_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          username?: string
          avatar_url?: string | null
          elo_rank?: number
          casual_points?: number
          level?: number
          bio?: string | null
          joined_at?: string
          updated_at?: string
        }
      }
      user_stats: {
        Row: {
          id: string
          user_id: string
          total_games: number
          wins: number
          losses: number
          elo_rating: number
          casual_points: number
          rank_position: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_games?: number
          wins?: number
          losses?: number
          elo_rating?: number
          casual_points?: number
          rank_position?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          total_games?: number
          wins?: number
          losses?: number
          elo_rating?: number
          casual_points?: number
          rank_position?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      games: {
        Row: {
          id: string
          host_id: string
          status: string
          game_type: string
          max_players: number
          current_turn: string | null
          round_number: number
          winner_id: string | null
          created_at: string
          started_at: string | null
          finished_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          host_id: string
          status?: string
          game_type: string
          max_players?: number
          current_turn?: string | null
          round_number?: number
          winner_id?: string | null
          created_at?: string
          started_at?: string | null
          finished_at?: string | null
          updated_at?: string
        }
        Update: {
          host_id?: string
          status?: string
          game_type?: string
          max_players?: number
          current_turn?: string | null
          round_number?: number
          winner_id?: string | null
          created_at?: string
          started_at?: string | null
          finished_at?: string | null
          updated_at?: string
        }
      }
      game_players: {
        Row: {
          id: string
          game_id: string
          user_id: string
          position: number
          hand_cards: Json
          score: number
          is_alive: boolean
          joined_at: string
        }
        Insert: {
          id?: string
          game_id: string
          user_id: string
          position: number
          hand_cards?: Json
          score?: number
          is_alive?: boolean
          joined_at?: string
        }
        Update: {
          game_id?: string
          user_id?: string
          position?: number
          hand_cards?: Json
          score?: number
          is_alive?: boolean
          joined_at?: string
        }
      }
      game_moves: {
        Row: {
          id: string
          game_id: string
          player_id: string
          move_type: string
          card_played: Json | null
          color_chosen: string | null
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          player_id: string
          move_type: string
          card_played?: Json | null
          color_chosen?: string | null
          details?: Json | null
          created_at?: string
        }
        Update: {
          game_id?: string
          player_id?: string
          move_type?: string
          card_played?: Json | null
          color_chosen?: string | null
          details?: Json | null
          created_at?: string
        }
      }
      friendships: {
        Row: {
          id: string
          user_a_id: string
          user_b_id: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_a_id: string
          user_b_id: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_a_id?: string
          user_b_id?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      game_invites: {
        Row: {
          id: string
          game_id: string
          from_user_id: string
          to_user_id: string
          status: string
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          game_id: string
          from_user_id: string
          to_user_id: string
          status?: string
          created_at?: string
          expires_at?: string
        }
        Update: {
          game_id?: string
          from_user_id?: string
          to_user_id?: string
          status?: string
          created_at?: string
          expires_at?: string
        }
      }
      user_presence: {
        Row: {
          id: string
          user_id: string
          status: string
          game_id: string | null
          last_seen: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: string
          game_id?: string | null
          last_seen?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          status?: string
          game_id?: string | null
          last_seen?: string
          updated_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          name: string
          description: string
          icon: string | null
          criteria: Json
          points: number
          created_at: string
        }
        Insert: {
          id: string
          name: string
          description: string
          icon?: string | null
          criteria: Json
          points?: number
          created_at?: string
        }
        Update: {
          name?: string
          description?: string
          icon?: string | null
          criteria?: Json
          points?: number
          created_at?: string
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          unlocked_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          unlocked_at?: string
        }
        Update: {
          user_id?: string
          achievement_id?: string
          unlocked_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          data: Json | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          data?: Json | null
          read?: boolean
          created_at?: string
        }
        Update: {
          user_id?: string
          type?: string
          title?: string
          message?: string
          data?: Json | null
          read?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: {
        Args: Record<string, never>
        Returns: never
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
