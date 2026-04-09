// Game Constants
export const GAME_RULES = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 10,
  INITIAL_HAND_SIZE: 7,
  DRAW_PENALTY: 2,
  DRAW_FOUR_PENALTY: 4,
  TURN_TIMEOUT: 180000, // 3 minutes in ms
  GAME_TIMEOUT: 3600000, // 1 hour in ms
}

// Card Constants
export const CARD_COLORS = ['red', 'yellow', 'blue', 'green'] as const
export const CARD_ACTIONS = ['skip', 'reverse', 'draw2'] as const
export const CARD_WILDS = ['wild', 'wild_draw4'] as const

// ELO Constants
export const ELO_SETTINGS = {
  INITIAL_RATING: 1200,
  K_FACTOR: 32,
  MULTIPLAYER_ADJUSTMENT: 0.8,
}

// Points Constants
export const CARD_POINTS = {
  '0': 0,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  'skip': 20,
  'reverse': 20,
  'draw2': 20,
  'wild': 50,
  'wild_draw4': 50,
} as const

// UI Colors
export const UNO_COLORS = {
  red: '#ef5350',
  yellow: '#fdd835',
  blue: '#42a5f5',
  green: '#66bb6a',
  wild: '#9c27b0',
} as const

// Game States
export const GAME_STATUSES = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished',
} as const

export const GAME_TYPES = {
  CASUAL: 'casual',
  RANKED: 'ranked',
} as const

// User Presence
export const USER_PRESENCE = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  PLAYING: 'playing',
  WAITING: 'waiting',
} as const

// Achievements
export const ACHIEVEMENTS = {
  FIRST_WIN: {
    id: 'first_win',
    name: 'First Blood',
    description: 'Win your first game',
    points: 10,
  },
  TEN_WINS: {
    id: 'ten_wins',
    name: 'Victory',
    description: 'Win 10 games',
    points: 50,
  },
  HUNDRED_WINS: {
    id: 'hundred_wins',
    name: 'Legend',
    description: 'Win 100 games',
    points: 500,
  },
  FIVE_WIN_STREAK: {
    id: 'five_win_streak',
    name: 'On Fire',
    description: 'Win 5 games in a row',
    points: 100,
  },
  ONE_CARD_WIN: {
    id: 'one_card_win',
    name: 'Bold Move',
    description: 'Win with only 1 card',
    points: 50,
  },
  THREE_WILD_DRAW4: {
    id: 'three_wild_draw4',
    name: 'Nuclear',
    description: 'Play 3 Wild Draw4 cards in one game',
    points: 75,
  },
  RANKED_WIN: {
    id: 'ranked_win',
    name: 'Competitive',
    description: 'Win a ranked game',
    points: 30,
  },
  TOP_50: {
    id: 'top_50',
    name: 'Elite',
    description: 'Reach top 50 in ranking',
    points: 200,
  },
  INVITE_10_FRIENDS: {
    id: 'invite_10_friends',
    name: 'Social Butterfly',
    description: 'Invite 10 friends',
    points: 100,
  },
  TEN_PLAYER_GAME: {
    id: 'ten_player_game',
    name: 'Party Time',
    description: 'Play a game with 10 players',
    points: 150,
  },
  QUICK_WIN: {
    id: 'quick_win',
    name: 'Speed Racer',
    description: 'Win a game in less than 5 minutes',
    points: 40,
  },
  COLLECTOR: {
    id: 'collector',
    name: 'Collector',
    description: 'Unlock all achievements',
    points: 1000,
  },
} as const

// Time constants (milliseconds)
export const TIMEOUTS = {
  TURN_TIMER: 180000, // 3 minutes
  GAME_IDLE: 900000, // 15 minutes
  DISCONNECT_CLEANUP: 300000, // 5 minutes
} as const
