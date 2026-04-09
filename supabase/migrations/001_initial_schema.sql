-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  elo_rank INTEGER DEFAULT 1200,
  casual_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  bio TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User stats table
CREATE TABLE IF NOT EXISTS public.user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users ON DELETE CASCADE,
  total_games INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  elo_rating INTEGER DEFAULT 1200,
  casual_points INTEGER DEFAULT 0,
  rank_position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Games table
CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES public.users ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  game_type TEXT NOT NULL CHECK (game_type IN ('casual', 'ranked')),
  max_players INTEGER DEFAULT 10,
  current_turn UUID,
  round_number INTEGER DEFAULT 1,
  winner_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Game players (join table)
CREATE TABLE IF NOT EXISTS public.game_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES public.games ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users ON DELETE CASCADE,
  position INTEGER NOT NULL,
  hand_cards JSONB DEFAULT '[]'::jsonb,
  score INTEGER DEFAULT 0,
  is_alive BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(game_id, user_id)
);

-- Game moves history
CREATE TABLE IF NOT EXISTS public.game_moves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES public.games ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.users ON DELETE CASCADE,
  move_type TEXT NOT NULL CHECK (move_type IN ('play', 'draw', 'skip', 'uno_call', 'pass')),
  card_played JSONB,
  color_chosen TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_a_id UUID NOT NULL REFERENCES public.users ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES public.users ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CHECK (user_a_id < user_b_id),
  UNIQUE(user_a_id, user_b_id)
);

-- Game invites
CREATE TABLE IF NOT EXISTS public.game_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES public.games ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.users ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '15 minutes',
  UNIQUE(game_id, from_user_id, to_user_id)
);

-- User presence (real-time status)
CREATE TABLE IF NOT EXISTS public.user_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'playing', 'waiting')),
  game_id UUID REFERENCES public.games ON DELETE SET NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Achievements
CREATE TABLE IF NOT EXISTS public.achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  criteria JSONB,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User achievements (unlock history)
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES public.achievements ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, achievement_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('invite', 'friend_request', 'achievement', 'achievement_unlocked', 'game_started')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- INDEXES for performance
-- ========================

CREATE INDEX idx_games_host_id ON public.games(host_id);
CREATE INDEX idx_games_status ON public.games(status);
CREATE INDEX idx_games_created_at ON public.games(created_at);
CREATE INDEX idx_game_players_game_id ON public.game_players(game_id);
CREATE INDEX idx_game_players_user_id ON public.game_players(user_id);
CREATE INDEX idx_game_moves_game_id ON public.game_moves(game_id);
CREATE INDEX idx_game_moves_player_id ON public.game_moves(player_id);
CREATE INDEX idx_friendships_user_a ON public.friendships(user_a_id);
CREATE INDEX idx_friendships_user_b ON public.friendships(user_b_id);
CREATE INDEX idx_friendships_status ON public.friendships(status);
CREATE INDEX idx_game_invites_to_user ON public.game_invites(to_user_id);
CREATE INDEX idx_game_invites_from_user ON public.game_invites(from_user_id);
CREATE INDEX idx_game_invites_status ON public.game_invites(status);
CREATE INDEX idx_user_presence_user_id ON public.user_presence(user_id);
CREATE INDEX idx_user_presence_status ON public.user_presence(status);
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);

-- ========================
-- ROW LEVEL SECURITY (RLS)
-- ========================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view public profiles
CREATE POLICY "Users can view all profiles"
  ON public.users FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- User stats - public read, auto-updated
CREATE POLICY "Everyone can view user stats"
  ON public.user_stats FOR SELECT
  USING (true);

-- Users can insert their own stats
CREATE POLICY "Users can insert own stats"
  ON public.user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Games - users can view games they're in or public games
CREATE POLICY "Users can view games they're in"
  ON public.games FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM public.game_players WHERE game_id = id)
    OR status = 'waiting'
  );

-- Game players - users can view players in games they're in
CREATE POLICY "Users can view players in their games"
  ON public.game_players FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM public.game_players gp2 WHERE gp2.game_id = game_id)
  );

-- Game moves - users can view moves in games they're in
CREATE POLICY "Users can view moves in their games"
  ON public.game_moves FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM public.game_players WHERE game_id = game_id)
  );

-- Friendships - users can view their own friendships
CREATE POLICY "Users can view their friendships"
  ON public.friendships FOR SELECT
  USING (
    auth.uid() = user_a_id OR auth.uid() = user_b_id
  );

-- Game invites - users can view invites sent to them
CREATE POLICY "Users can view invites sent to them"
  ON public.game_invites FOR SELECT
  USING (
    auth.uid() = to_user_id OR auth.uid() = from_user_id
  );

-- User presence - users can view presence (public)
CREATE POLICY "Everyone can view user presence"
  ON public.user_presence FOR SELECT
  USING (true);

-- User achievements - public read
CREATE POLICY "Everyone can view user achievements"
  ON public.user_achievements FOR SELECT
  USING (true);

-- Notifications - users can view only their notifications
CREATE POLICY "Users can view their notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- ========================
-- DEFAULT ACHIEVEMENTS
-- ========================

INSERT INTO public.achievements (id, name, description, icon, points) VALUES
  ('first_win', 'First Blood', 'Win your first game', '🎯', 10),
  ('ten_wins', 'Victory', 'Win 10 games', '🏆', 50),
  ('hundred_wins', 'Legend', 'Win 100 games', '👑', 500),
  ('five_win_streak', 'On Fire', 'Win 5 games in a row', '🔥', 100),
  ('one_card_win', 'Bold Move', 'Win with only 1 card', '🎲', 50),
  ('three_wild_draw4', 'Nuclear', 'Play 3 Wild Draw4 cards in one game', '💣', 75),
  ('ranked_win', 'Competitive', 'Win a ranked game', '⚔️', 30),
  ('top_50', 'Elite', 'Reach top 50 in ranking', '🌟', 200),
  ('invite_10_friends', 'Social Butterfly', 'Invite 10 friends', '🦋', 100),
  ('ten_player_game', 'Party Time', 'Play a game with 10 players', '🎉', 150),
  ('quick_win', 'Speed Racer', 'Win a game in less than 5 minutes', '⚡', 40),
  ('collector', 'Collector', 'Unlock all achievements', '🎖️', 1000)
ON CONFLICT DO NOTHING;
