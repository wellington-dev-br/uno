// User Types
export interface User {
  id: string
  email: string
  username: string
  avatar_url: string | null
  elo_rank: number
  casual_points: number
  level: number
  joined_at: string
  updated_at: string
}

export interface UserStats {
  total_games: number
  wins: number
  losses: number
  elo_rating: number
  casual_points: number
  rank_position: number
  win_rate: number
}

// Game Types
export type GameType = 'casual' | 'ranked'
export type GameStatus = 'waiting' | 'playing' | 'finished'

export interface Game {
  id: string
  host_id: string
  status: GameStatus
  game_type: GameType
  max_players: number
  current_turn: string
  round_number: number
  created_at: string
  started_at: string | null
  finished_at: string | null
}

export interface GamePlayer {
  id: string
  game_id: string
  user_id: string
  position: number
  hand_cards: Card[]
  score: number
  is_alive: boolean
  joined_at: string
}

// Card Types
export type CardColor = 'red' | 'yellow' | 'blue' | 'green' | 'wild'
export type CardValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild_draw4'

export interface Card {
  id: string
  color: CardColor
  value: CardValue
  timestamp?: number
}

// Move Types
export type MoveType = 'play' | 'draw' | 'skip' | 'uno_call'

export interface GameMove {
  id: string
  game_id: string
  player_id: string
  move_type: MoveType
  card_played: Card | null
  color_chosen: CardColor | null
  timestamp: string
}

// Friendship Types
export type FriendshipStatus = 'pending' | 'accepted' | 'blocked'

export interface Friendship {
  id: string
  user_a_id: string
  user_b_id: string
  status: FriendshipStatus
  created_at: string
}

// Invite Types
export type InviteStatus = 'pending' | 'accepted' | 'declined'

export interface GameInvite {
  id: string
  game_id: string
  from_user_id: string
  to_user_id: string
  status: InviteStatus
  created_at: string
  expires_at: string
}

// Presence Types
export type UserPresence = 'online' | 'offline' | 'playing' | 'waiting'

export interface UserStatus {
  id: string
  user_id: string
  status: UserPresence
  game_id: string | null
  last_seen: string
  updated_at: string
}

// Achievement Types
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  criteria: Record<string, any>
  points: number
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  unlocked_at: string
}

// Notification Types
export interface Notification {
  id: string
  user_id: string
  type: 'invite' | 'friend_request' | 'achievement' | 'achievement_unlocked'
  title: string
  message: string
  data: Record<string, any>
  read: boolean
  created_at: string
}
