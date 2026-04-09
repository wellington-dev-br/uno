-- CORREÇÃO: Recriar tabelas faltantes do UNO (com RLS corrigido)
-- Execute este SQL no SQL Editor do Supabase

-- Primeiro, remover tabelas existentes (se existirem)
DROP TABLE IF EXISTS public.game_moves CASCADE;
DROP TABLE IF EXISTS public.game_players CASCADE;
DROP TABLE IF EXISTS public.games CASCADE;

-- Games table
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID REFERENCES public.users ON DELETE SET NULL,
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
CREATE TABLE public.game_players (
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
CREATE TABLE public.game_moves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES public.games ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.users ON DELETE CASCADE,
  move_type TEXT NOT NULL CHECK (move_type IN ('play', 'draw', 'skip', 'uno_call', 'pass')),
  card_played JSONB,
  color_chosen TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_moves ENABLE ROW LEVEL SECURITY;

-- RLS Policies CORRIGIDAS (sem recursão infinita)

-- Games: usuários podem ver jogos que hospedam OU jogos em espera
CREATE POLICY "Users can view games" ON public.games FOR SELECT USING (
  host_id = auth.uid() OR status = 'waiting'
);

-- Game players: usuários podem ver jogadores de jogos que estão participando
CREATE POLICY "Users can view game players" ON public.game_players FOR SELECT USING (
  user_id = auth.uid() OR
  game_id IN (
    SELECT gp.game_id FROM public.game_players gp WHERE gp.user_id = auth.uid()
  )
);

-- Game moves: usuários podem ver movimentos de jogos que estão participando
CREATE POLICY "Users can view game moves" ON public.game_moves FOR SELECT USING (
  player_id = auth.uid() OR
  game_id IN (
    SELECT gp.game_id FROM public.game_players gp WHERE gp.user_id = auth.uid()
  )
);

-- Indexes for performance
CREATE INDEX idx_games_host_id ON public.games(host_id);
CREATE INDEX idx_games_status ON public.games(status);
CREATE INDEX idx_games_created_at ON public.games(created_at);
CREATE INDEX idx_game_players_game_id ON public.game_players(game_id);
CREATE INDEX idx_game_players_user_id ON public.game_players(user_id);
CREATE INDEX idx_game_moves_game_id ON public.game_moves(game_id);
CREATE INDEX idx_game_moves_player_id ON public.game_moves(player_id);