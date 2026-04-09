import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from './database.types'

export const supabase = createClientComponentClient<Database>()

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
