import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { Database } from './database.types'
import { GameType } from './types'

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getCurrentUserProfile() {
  const user = await getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) console.error('Error fetching user profile:', error)
  return data
}

export async function getUserStats(userId: string) {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) console.error('Error fetching user stats:', error)
  return data
}

export async function getFriends(userId: string) {
  const { data, error } = await supabase
    .from('friendships')
    .select('*, user_a:users!user_a_id(*), user_b:users!user_b_id(*)')
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .eq('status', 'accepted')

  if (error) console.error('Error fetching friends:', error)
  return data || []
}

export async function getGameInvites(userId: string) {
  const { data, error } = await supabase
    .from('game_invites')
    .select('*, from_user:users!from_user_id(*), game:games(*)')
    .eq('to_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) console.error('Error fetching game invites:', error)
  return data || []
}

export async function getGame(gameId: string) {
  const { data, error } = await supabase
    .from('games')
    .select('*, players:game_players(*)')
    .eq('id', gameId)
    .single()

  if (error) console.error('Error fetching game:', error)
  return data
}

export async function subscribeToPresence(userId: string, callback: (status: any) => void) {
  return supabase
    .channel(`presence:${userId}`)
    .on('presence', { event: 'sync' }, () => {
      callback({ event: 'sync' })
    })
    .on('presence', { event: 'join' }, ({ newPresences }) => {
      callback({ event: 'join', data: newPresences })
    })
    .on('presence', { event: 'leave' }, ({ leftPresences }) => {
      callback({ event: 'leave', data: leftPresences })
    })
    .subscribe()
}

export async function subscribeToGame(gameId: string, callback: (data: any) => void) {
  return supabase
    .channel(`game:${gameId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, (payload) => {
      callback(payload)
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_moves', filter: `game_id=eq.${gameId}` }, (payload) => {
      callback(payload)
    })
    .subscribe()
}

export async function subscribeToNotifications(userId: string, callback: (data: any) => void) {
  return supabase
    .channel(`notifications:${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_invites', filter: `to_user_id=eq.${userId}` }, (payload) => {
      callback({ type: 'invite', data: payload })
    })
    .subscribe()
}

export async function getAvailableGames() {
  const { data, error } = await supabase
    .from('games')
    .select('id, host_id, status, game_type, max_players, current_turn, round_number, created_at')
    .eq('status', 'waiting')
    .order('created_at', { ascending: true })
    .limit(10)

  return {
    games: data || [],
    error,
  }
}

export async function createGame(gameType: GameType = 'casual', maxPlayers = 4) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw authError || new Error('Usuário não autenticado')
  }

  const { data: game, error } = await supabase
    .from('games')
    .insert({
      host_id: user.id,
      status: 'waiting',
      game_type: gameType,
      max_players: maxPlayers,
      current_turn: user.id,
    })
    .select('*')
    .single()

  if (error || !game) {
    throw error || new Error('Não foi possível criar a partida')
  }

  const { error: playerError } = await supabase.from('game_players').insert({
    game_id: game.id,
    user_id: user.id,
    position: 1,
  })

  if (playerError) {
    throw playerError
  }

  return game
}

export async function joinGame(gameId: string) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw authError || new Error('Usuário não autenticado')
  }

  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('id, status, max_players')
    .eq('id', gameId)
    .single()

  if (gameError || !game) {
    throw gameError || new Error('Partida não encontrada')
  }

  if (game.status !== 'waiting') {
    throw new Error('A partida não está disponível para entrada')
  }

  const { count, error: countError } = await supabase
    .from('game_players')
    .select('id', { count: 'exact', head: true })
    .eq('game_id', gameId)

  if (countError) {
    throw countError
  }

  if (typeof count === 'number' && count >= game.max_players) {
    throw new Error('A partida já atingiu o número máximo de jogadores')
  }

  const { error: playerError } = await supabase.from('game_players').insert({
    game_id: gameId,
    user_id: user.id,
    position: (typeof count === 'number' ? count + 1 : 1),
  })

  if (playerError) {
    throw playerError
  }

  return true
}
