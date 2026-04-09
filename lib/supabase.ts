import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { Database } from './database.types'
import {
  GameState,
  GameType,
  GamePlayer,
  GameMove,
  Card,
  CardColor,
  UserStats,
  Achievement,
  UserAchievement,
  GameInvite,
} from './types'
import {
  generateUnoDeck,
  shuffleDeck,
  dealInitialHands,
  getStartingTopCard,
  drawCards,
  isValidMove,
  getNextPlayer,
  getExpectedScore,
  calculateEloRating,
  calculateMultiplayerElo,
  calculateLoserElo,
} from './gameLogic'
import { USER_PRESENCE, ACHIEVEMENTS, ACHIEVEMENT_LIST, ELO_SETTINGS } from './constants'

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
) as any

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

export async function sendFriendRequest(username: string) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw authError || new Error('Usuário não autenticado')
  }

  const { data: targetUser, error: targetError } = await supabase
    .from('users')
    .select('id, username')
    .eq('username', username)
    .single()

  if (targetError || !targetUser) {
    throw targetError || new Error('Usuário não encontrado')
  }

  if (targetUser.id === user.id) {
    throw new Error('Você não pode enviar solicitação para si mesmo')
  }

  const userA = user.id < targetUser.id ? user.id : targetUser.id
  const userB = user.id < targetUser.id ? targetUser.id : user.id

  const { data: existingFriendship, error: existingError } = await supabase
    .from('friendships')
    .select('*')
    .eq('user_a_id', userA)
    .eq('user_b_id', userB)
    .single()

  if (existingError && existingError.code !== 'PGRST116') {
    console.error('Error checking friendship existence:', existingError)
  }

  if (existingFriendship) {
    throw new Error('Já existe uma amizade ou solicitação entre vocês')
  }

  const { error: insertError } = await supabase.from('friendships').insert({
    user_a_id: userA,
    user_b_id: userB,
    status: 'pending',
  })

  if (insertError) {
    throw insertError
  }

  return true
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

export async function setUserPresence(status: string = USER_PRESENCE.ONLINE, gameId: string | null = null) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw authError || new Error('Usuário não autenticado')
  }

  const { error } = await supabase
    .from('user_presence')
    .upsert({
      user_id: user.id,
      status,
      game_id: gameId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) {
    console.error('Error updating presence:', error)
    throw error
  }

  return true
}

export async function subscribeToUserPresence(callback: (payload: any) => void) {
  return supabase
    .channel('realtime:user_presence')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'user_presence' },
      (payload) => callback(payload)
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'user_presence' },
      (payload) => callback(payload)
    )
    .subscribe()
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
    } as any)
    .select('*')
    .single()

  if (error || !game) {
    throw error || new Error('Não foi possível criar a partida')
  }

  const { error: playerError } = await supabase.from('game_players').insert({
    game_id: game.id,
    user_id: user.id,
    position: 1,
  } as any)

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
    hand_cards: [],
  } as any)

  if (playerError) {
    throw playerError
  }

  return true
}

export async function getGameState(gameId: string) {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single()

  if (error || !data) {
    throw error || new Error('Não foi possível carregar o estado da partida')
  }

  return data as GameState
}

export async function getGamePlayers(gameId: string) {
  const { data, error } = await supabase
    .from('game_players')
    .select('*, user:users(*)')
    .eq('game_id', gameId)
    .order('position', { ascending: true })

  if (error) {
    throw error
  }

  return (data || []) as GamePlayer[]
}

export async function getGameMoves(gameId: string) {
  const { data, error } = await supabase
    .from('game_moves')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return data as GameMove[]
}

export async function startGame(gameId: string) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw authError || new Error('Usuário não autenticado')
  }

  const { data: players, error: playersError } = await supabase
    .from('game_players')
    .select('user_id, position')
    .eq('game_id', gameId)
    .order('position', { ascending: true })

  if (playersError || !players || players.length < 2) {
    throw playersError || new Error('É necessário pelo menos 2 jogadores para iniciar a partida')
  }

  const orderedPlayers = players.map((player) => player.user_id)
  const deck = shuffleDeck(generateUnoDeck())
  const { hands, deck: deckAfterDeal } = dealInitialHands(deck, orderedPlayers.length)
  const { topCard, currentColor, deck: deckWithTop } = getStartingTopCard(deckAfterDeal)

  const updates = orderedPlayers.map((playerId, index) => {
    return supabase
      .from('game_players')
      .update({ hand_cards: hands[index] })
      .eq('game_id', gameId)
      .eq('user_id', playerId)
  })

  for (const update of updates) {
    const { error } = await update
    if (error) {
      throw error
    }
  }

  const { error } = await supabase
    .from('games')
    .update({
      status: 'playing',
      started_at: new Date().toISOString(),
      current_turn: orderedPlayers[0],
      active_player_index: 0,
      player_order: orderedPlayers,
      deck: deckWithTop,
      discard_pile: [topCard],
      top_card: topCard,
      current_color: currentColor,
      direction: 'clockwise',
      draw_penalty: 0,
    })
    .eq('id', gameId)

  if (error) {
    throw error
  }

  return true
}

export async function playCard(gameId: string, card: Card, colorChoice: CardColor | null = null) {
  const { data: currentUser, error: authError } = await supabase.auth.getUser()
  if (authError || !currentUser) {
    throw authError || new Error('Usuário não autenticado')
  }

  const game = await getGameState(gameId)
  const players = await getGamePlayers(gameId)
  const playerRow = players.find((player) => player.user_id === currentUser.id)

  if (!playerRow) {
    throw new Error('Você não está participando desta partida')
  }

  if (game.status !== 'playing') {
    throw new Error('A partida ainda não começou')
  }

  if (game.current_turn !== currentUser.id) {
    throw new Error('Não é sua vez de jogar')
  }

  const hand = playerRow.hand_cards || []
  const cardIndex = hand.findIndex((item) => item.id === card.id)
  if (cardIndex === -1) {
    throw new Error('Carta não encontrada na sua mão')
  }

  if (!game.top_card) {
    throw new Error('O monte não foi inicializado corretamente')
  }

  if (!isValidMove(card, game.top_card, game.current_color || null)) {
    throw new Error('Jogada inválida para a carta selecionada')
  }

  const updatedHand = [...hand]
  updatedHand.splice(cardIndex, 1)
  let nextDirection = game.direction || 'clockwise'
  let nextPlayerIndex = game.active_player_index ?? 0
  const totalPlayers = game.player_order?.length || players.length
  let nextColor = card.color === 'wild' || card.value === 'wild_draw4' ? colorChoice || 'red' : card.color
  let nextDrawPenalty = 0

  switch (card.value) {
    case 'skip':
      nextPlayerIndex = nextPlayerIndex === -1 ? 0 : nextPlayerIndex
      nextPlayerIndex = getNextPlayer(nextPlayerIndex, totalPlayers, nextDirection === 'counterclockwise')
      nextPlayerIndex = getNextPlayer(nextPlayerIndex, totalPlayers, nextDirection === 'counterclockwise')
      break
    case 'reverse':
      nextDirection = nextDirection === 'clockwise' ? 'counterclockwise' : 'clockwise'
      nextPlayerIndex = getNextPlayer(nextPlayerIndex, totalPlayers, nextDirection === 'counterclockwise')
      break
    case 'draw2': {
      const nextIndex = getNextPlayer(nextPlayerIndex, totalPlayers, nextDirection === 'counterclockwise')
      const nextPlayerId = game.player_order?.[nextIndex]
      if (nextPlayerId) {
        const nextPlayer = players.find((player) => player.user_id === nextPlayerId)
        if (nextPlayer) {
          const { drawn, deck: remainder } = drawCards(game.deck || [], 2)
          nextPlayer.hand_cards = [...(nextPlayer.hand_cards || []), ...drawn]
          await supabase
            .from('game_players')
            .update({ hand_cards: nextPlayer.hand_cards })
            .eq('game_id', gameId)
            .eq('user_id', nextPlayerId)
          game.deck = remainder
        }
      }
      nextPlayerIndex = getNextPlayer(nextIndex, totalPlayers, nextDirection === 'counterclockwise')
      nextDrawPenalty = 0
      break
    }
    case 'wild_draw4': {
      const nextIndex = getNextPlayer(nextPlayerIndex, totalPlayers, nextDirection === 'counterclockwise')
      const nextPlayerId = game.player_order?.[nextIndex]
      if (nextPlayerId) {
        const nextPlayer = players.find((player) => player.user_id === nextPlayerId)
        if (nextPlayer) {
          const { drawn, deck: remainder } = drawCards(game.deck || [], 4)
          nextPlayer.hand_cards = [...(nextPlayer.hand_cards || []), ...drawn]
          await supabase
            .from('game_players')
            .update({ hand_cards: nextPlayer.hand_cards })
            .eq('game_id', gameId)
            .eq('user_id', nextPlayerId)
          game.deck = remainder
        }
      }
      nextPlayerIndex = getNextPlayer(nextIndex, totalPlayers, nextDirection === 'counterclockwise')
      nextDrawPenalty = 0
      break
    }
    default:
      nextPlayerIndex = getNextPlayer(nextPlayerIndex, totalPlayers, nextDirection === 'counterclockwise')
      break
  }

  const nextPlayerId = game.player_order?.[nextPlayerIndex]
  const isWinner = updatedHand.length === 0

  const { error: updatePlayerError } = await supabase
    .from('game_players')
    .update({ hand_cards: updatedHand })
    .eq('game_id', gameId)
    .eq('user_id', currentUser.id)

  if (updatePlayerError) {
    throw updatePlayerError
  }

  const gameUpdatePayload: Partial<GameState> = {
    top_card: card,
    current_color: nextColor,
    direction: nextDirection,
    active_player_index: isWinner ? nextPlayerIndex : nextPlayerIndex,
    current_turn: nextPlayerId || currentUser.id,
    discard_pile: [...(game.discard_pile || []), card],
    deck: game.deck,
    draw_penalty: nextDrawPenalty,
    status: isWinner ? 'finished' : game.status,
    finished_at: isWinner ? new Date().toISOString() : game.finished_at,
  }

  const { error: updateGameError } = await supabase
    .from('games')
    .update(gameUpdatePayload)
    .eq('id', gameId)

  if (updateGameError) {
    throw updateGameError
  }

  const { error: moveError } = await supabase.from('game_moves').insert({
    game_id: gameId,
    player_id: currentUser.id,
    move_type: 'play',
    card_played: card,
    color_chosen: card.color === 'wild' || card.value === 'wild_draw4' ? nextColor : null,
    timestamp: new Date().toISOString(),
  } as any)

  if (moveError) {
    throw moveError
  }

  return true
}

export async function drawCard(gameId: string) {
  const { data: currentUser, error: authError } = await supabase.auth.getUser()
  if (authError || !currentUser) {
    throw authError || new Error('Usuário não autenticado')
  }

  const game = await getGameState(gameId)
  const players = await getGamePlayers(gameId)
  const playerRow = players.find((player) => player.user_id === currentUser.id)

  if (!playerRow) {
    throw new Error('Você não está participando desta partida')
  }

  if (game.status !== 'playing') {
    throw new Error('A partida ainda não começou')
  }

  if (game.current_turn !== currentUser.id) {
    throw new Error('Não é sua vez de jogar')
  }

  let deck = game.deck || []
  let topCard = game.top_card

  if (deck.length === 0 && game.discard_pile && game.discard_pile.length > 1) {
    topCard = game.discard_pile[game.discard_pile.length - 1]
    const reshuffle = [...game.discard_pile.slice(0, -1)]
    deck = shuffleDeck(reshuffle)
  }

  const { drawn, deck: remainingDeck } = drawCards(deck, 1)
  const updatedHand = [...(playerRow.hand_cards || []), ...drawn]

  const nextPlayerIndex = getNextPlayer(game.active_player_index ?? 0, game.player_order?.length || players.length, game.direction === 'counterclockwise')
  const nextPlayerId = game.player_order?.[nextPlayerIndex] || currentUser.id

  const { error: updatePlayerError } = await supabase
    .from('game_players')
    .update({ hand_cards: updatedHand })
    .eq('game_id', gameId)
    .eq('user_id', currentUser.id)

  if (updatePlayerError) {
    throw updatePlayerError
  }

  const { error: updateGameError } = await supabase
    .from('games')
    .update({
      deck: remainingDeck,
      current_turn: nextPlayerId,
      active_player_index: nextPlayerIndex,
      top_card: topCard,
    })
    .eq('id', gameId)

  if (updateGameError) {
    throw updateGameError
  }

  const { error: moveError } = await supabase.from('game_moves').insert({
    game_id: gameId,
    player_id: currentUser.id,
    move_type: 'draw',
    card_played: drawn[0] || null,
    color_chosen: null,
    timestamp: new Date().toISOString(),
  } as any)

  if (moveError) {
    throw moveError
  }

  return true
}

export async function getPendingGameInvites(userId: string) {
  const { data, error } = await supabase
    .from('game_invites')
    .select('*, from_user:users!from_user_id(username, avatar_url), game:games(*)')
    .eq('to_user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching pending game invites:', error)
    throw error
  }

  return (data || []) as GameInvite[]
}

export async function sendGameInvite(gameId: string, toUsername: string) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw authError || new Error('Usuário não autenticado')
  }

  const { data: targetUser, error: targetError } = await supabase
    .from('users')
    .select('id, username')
    .eq('username', toUsername)
    .single()

  if (targetError || !targetUser) {
    throw targetError || new Error('Usuário não encontrado')
  }

  if (targetUser.id === user.id) {
    throw new Error('Você não pode convidar você mesmo')
  }

  const { error } = await supabase.from('game_invites').insert({
    game_id: gameId,
    from_user_id: user.id,
    to_user_id: targetUser.id,
    status: 'pending',
    expires_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
  })

  if (error) {
    throw error
  }

  await supabase.from('notifications').insert({
    user_id: targetUser.id,
    type: 'invite',
    title: 'Você recebeu um convite',
    message: `${user.email} te convidou para jogar UNO.`,
    data: { gameId },
    read: false,
    created_at: new Date().toISOString(),
  })

  return true
}

export async function respondGameInvite(inviteId: string, accept: boolean) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw authError || new Error('Usuário não autenticado')
  }

  const { data: invite, error: inviteError } = await supabase
    .from('game_invites')
    .select('*')
    .eq('id', inviteId)
    .single()

  if (inviteError || !invite) {
    throw inviteError || new Error('Convite não encontrado')
  }

  if (invite.to_user_id !== user.id) {
    throw new Error('Você não pode responder a este convite')
  }

  const responseStatus = accept ? 'accepted' : 'declined'

  const { error: updateError } = await supabase
    .from('game_invites')
    .update({ status: responseStatus })
    .eq('id', inviteId)

  if (updateError) {
    throw updateError
  }

  if (accept) {
    await joinGame(invite.game_id)

    await supabase.from('notifications').insert({
      user_id: invite.from_user_id,
      type: 'invite',
      title: 'Convite aceito',
      message: `${user.email} aceitou seu convite para a partida.`,
      data: { gameId: invite.game_id },
      read: false,
      created_at: new Date().toISOString(),
    })
  }

  return true
}

export async function quickMatch() {
  const available = await getAvailableGames()
  const waiting = available.games.find((game) => game.game_type === 'casual')

  if (waiting) {
    await joinGame(waiting.id)
    return waiting
  }

  return createGame('casual', 4)
}

export async function getLeaderboard(limit = 30) {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, elo_rank, casual_points, level')
    .order('elo_rank', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching leaderboard:', error)
    throw error
  }

  return data || []
}

export async function getFriendLeaderboard(userId: string, limit = 20) {
  const friends = await getFriends(userId)
  const friendIds = friends.map((friend: any) => (friend.user_a_id === userId ? friend.user_b_id : friend.user_a_id))

  if (friendIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, username, elo_rank, casual_points, level')
    .in('id', friendIds)
    .order('elo_rank', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching friend leaderboard:', error)
    throw error
  }

  return data || []
}

export async function getUserAchievements(userId: string) {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('*, achievement:achievements(*)')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false })

  if (error) {
    console.error('Error fetching user achievements:', error)
    throw error
  }

  return data || []
}

export async function getUserGameHistory(userId: string) {
  const { data, error } = await supabase
    .from('game_players')
    .select('game(*)')
    .eq('user_id', userId)
    .order('game.finished_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching game history:', error)
    throw error
  }

  return (data || []).map((entry: any) => entry.game)
}

async function ensureUserStats(userId: string) {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error reading user stats:', error)
    throw error
  }

  if (data) {
    return data as UserStats
  }

  const { data: inserted, error: insertError } = await supabase.from('user_stats').insert({
    user_id: userId,
    total_games: 0,
    wins: 0,
    losses: 0,
    elo_rating: ELO_SETTINGS.INITIAL_RATING,
    casual_points: 0,
    rank_position: 0,
    win_rate: 0,
  }).single()

  if (insertError) {
    throw insertError
  }

  return inserted as UserStats
}

export async function unlockAchievement(userId: string, achievementId: string) {
  const { data: existing, error: existingError } = await supabase
    .from('user_achievements')
    .select('*')
    .eq('user_id', userId)
    .eq('achievement_id', achievementId)
    .single()

  if (existingError && existingError.code !== 'PGRST116') {
    console.error('Error checking achievement existence:', existingError)
    throw existingError
  }

  if (existing) {
    return false
  }

  const achievement = ACHIEVEMENT_LIST.find((item) => item.id === achievementId)
  if (!achievement) {
    throw new Error('Achievement inválida')
  }

  const { error } = await supabase.from('user_achievements').insert({
    user_id: userId,
    achievement_id: achievement.id,
    unlocked_at: new Date().toISOString(),
  })

  if (error) {
    throw error
  }

  await supabase.from('notifications').insert({
    user_id,
    type: 'achievement',
    title: `Conquista desbloqueada: ${achievement.name}`,
    message: achievement.description,
    data: { achievementId: achievement.id },
    read: false,
    created_at: new Date().toISOString(),
  })

  return true
}

function shouldUnlockAchievementFromStats(achievement: Achievement, stats: UserStats, friendCount = 0, gamesWithFriends = 0) {
  const criteria = achievement.criteria as any

  switch (criteria.type) {
    case 'wins':
      return stats.wins >= criteria.value
    case 'games_completed':
      return stats.total_games >= criteria.value
    case 'rank_position':
      return stats.rank_position > 0 && stats.rank_position <= criteria.value
    case 'friends_invited':
      return friendCount >= criteria.value
    case 'games_with_friends':
      return gamesWithFriends >= criteria.value
    default:
      return false
  }
}

export async function syncStatsAndAchievements(userId: string) {
  const [stats, friends, gameHistory] = await Promise.all([
    ensureUserStats(userId),
    getFriends(userId),
    getUserGameHistory(userId),
  ])

  const friendCount = friends.length
  const gamesWithFriends = gameHistory.filter((game: any) =>
    game.players?.some((player: any) =>
      player.user_id !== userId && friends.some((friend: any) => friend.user_a_id === player.user_id || friend.user_b_id === player.user_id)
    )
  ).length

  for (const achievement of ACHIEVEMENT_LIST) {
    if (achievement.criteria?.type === 'game_result' || achievement.criteria?.type === 'all_achievements') {
      continue
    }

    if (shouldUnlockAchievementFromStats(achievement, stats, friendCount, gamesWithFriends)) {
      await unlockAchievement(userId, achievement.id)
    }
  }

  return true
}

export async function finalizeGameResult(gameId: string, winnerId: string) {
  const [game, players] = await Promise.all([getGameState(gameId), getGamePlayers(gameId)])
  if (!game || !players.length) {
    throw new Error('Não foi possível finalizar a partida')
  }

  const playerIds = players.map((player) => player.user_id)
  const loserIds = playerIds.filter((id) => id !== winnerId)
  const [winnerStats, ...loserStats] = await Promise.all([
    ensureUserStats(winnerId),
    ...loserIds.map((id) => ensureUserStats(id)),
  ])

  const loserRatings = loserStats.map((stats) => stats.elo_rating || ELO_SETTINGS.INITIAL_RATING)
  const winnerRating = winnerStats.elo_rating || ELO_SETTINGS.INITIAL_RATING
  const newWinnerRating = game.game_type === 'ranked'
    ? calculateMultiplayerElo(winnerRating, loserRatings, ELO_SETTINGS.K_FACTOR, ELO_SETTINGS.MULTIPLAYER_ADJUSTMENT)
    : winnerRating

  const loserRatingUpdates = loserStats.map((stats) => ({
    user_id: stats.user_id,
    newElo: game.game_type === 'ranked'
      ? calculateLoserElo(stats.elo_rating || ELO_SETTINGS.INITIAL_RATING, winnerRating, ELO_SETTINGS.K_FACTOR, ELO_SETTINGS.MULTIPLAYER_ADJUSTMENT)
      : stats.elo_rating || ELO_SETTINGS.INITIAL_RATING,
  }))

  const winnerUpdate = {
    total_games: winnerStats.total_games + 1,
    wins: winnerStats.wins + 1,
    elo_rating: newWinnerRating,
    casual_points: winnerStats.casual_points + (game.game_type === 'casual' ? 20 : 50),
    win_rate: (winnerStats.wins + 1) / (winnerStats.total_games + 1),
  }

  await supabase.from('user_stats').update(winnerUpdate).eq('user_id', winnerId)
  await supabase.from('users').update({ elo_rank: newWinnerRating, casual_points: winnerUpdate.casual_points }).eq('id', winnerId)

  for (const update of loserRatingUpdates) {
    const loserStat = loserStats.find((stats) => stats.user_id === update.user_id)
    if (!loserStat) continue

    await supabase.from('user_stats').update({
      total_games: loserStat.total_games + 1,
      losses: loserStat.losses + 1,
      elo_rating: update.newElo,
      win_rate: loserStat.wins / (loserStat.total_games + 1),
    }).eq('user_id', update.user_id)

    await supabase.from('users').update({ elo_rank: update.newElo }).eq('id', update.user_id)
  }

  const { data: playerMoves } = await supabase
    .from('game_moves')
    .select('*')
    .eq('game_id', gameId)
    .eq('player_id', winnerId)

  const moves = playerMoves || []
  const wildDraw4Count = moves.filter((move: any) => move.card_played?.value === 'wild_draw4').length
  const actionCardCount = moves.filter((move: any) => ['skip', 'reverse', 'draw2'].includes(move.card_played?.value)).length
  const durationMinutes = game.started_at && game.finished_at ? (new Date(game.finished_at).getTime() - new Date(game.started_at).getTime()) / 60000 : 0
  const endedHour = game.finished_at ? new Date(game.finished_at).getHours() : 0

  await syncStatsAndAchievements(winnerId)

  if (wildDraw4Count >= 3) {
    await unlockAchievement(winnerId, ACHIEVEMENTS.THREE_WILD_DRAW4.id)
  }

  if (actionCardCount >= 5) {
    await unlockAchievement(winnerId, ACHIEVEMENTS.ACTION_MASTER.id)
  }

  if (durationMinutes > 0 && durationMinutes <= 5) {
    await unlockAchievement(winnerId, ACHIEVEMENTS.QUICK_WIN.id)
  }

  if (game.game_type === 'ranked') {
    await unlockAchievement(winnerId, ACHIEVEMENTS.RANKED_WIN.id)
  }

  if ((playerIds.length || 0) >= 10) {
    await unlockAchievement(winnerId, ACHIEVEMENTS.TEN_PLAYER_GAME.id)
  }

  if (endedHour >= 22 || endedHour <= 3) {
    await unlockAchievement(winnerId, ACHIEVEMENTS.NIGHT_OWL.id)
  }

  const friendCount = (await getFriends(winnerId)).length
  if (friendCount >= 10) {
    await unlockAchievement(winnerId, ACHIEVEMENTS.INVITE_10_FRIENDS.id)
  }

  const { count } = await supabase
    .from('user_achievements')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', winnerId)

  if ((count || 0) >= ACHIEVEMENT_LIST.length - 1) {
    await unlockAchievement(winnerId, ACHIEVEMENTS.COLLECTOR.id)
  }

  return true
}
