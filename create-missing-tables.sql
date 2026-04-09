-- CRIAR TABELAS FALTANTES DO UNO
-- Execute este SQL no SQL Editor do Supabase

-- Friend requests table (não existia no schema original, mas vamos criar)
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES public.users ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(from_user_id, to_user_id)
);

-- Rankings table (não existia no schema original, mas vamos criar)
CREATE TABLE IF NOT EXISTS public.rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  elo_rating INTEGER DEFAULT 1200,
  total_games INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Game invitations table (alias para game_invites)
CREATE TABLE IF NOT EXISTS public.game_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES public.games ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.users ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '15 minutes',
  UNIQUE(game_id, from_user_id, to_user_id)
);

-- User presence table (do schema original)
CREATE TABLE IF NOT EXISTS public.user_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'playing', 'waiting')),
  game_id UUID REFERENCES public.games ON DELETE SET NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table (do schema original)
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

-- Enable RLS
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view friend requests involving them" ON public.friend_requests FOR SELECT USING (
  auth.uid() = from_user_id OR auth.uid() = to_user_id
);

CREATE POLICY "Everyone can view rankings" ON public.rankings FOR SELECT USING (true);

CREATE POLICY "Users can view game invitations involving them" ON public.game_invitations FOR SELECT USING (
  auth.uid() = from_user_id OR auth.uid() = to_user_id
);

CREATE POLICY "Everyone can view user presence" ON public.user_presence FOR SELECT USING (true);

CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_friend_requests_from_user ON public.friend_requests(from_user_id);
CREATE INDEX idx_friend_requests_to_user ON public.friend_requests(to_user_id);
CREATE INDEX idx_rankings_rank ON public.rankings(rank);
CREATE INDEX idx_rankings_user_id ON public.rankings(user_id);
CREATE INDEX idx_game_invitations_to_user ON public.game_invitations(to_user_id);
CREATE INDEX idx_game_invitations_from_user ON public.game_invitations(from_user_id);
CREATE INDEX idx_user_presence_user_id ON public.user_presence(user_id);
CREATE INDEX idx_user_presence_status ON public.user_presence(status);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);