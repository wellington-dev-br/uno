'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { Card, GamePlayer, GameState, User, GameMove, CardColor } from '@/lib/types'
import {
  drawCard,
  getGameMoves,
  getGamePlayers,
  getGameState,
  getUser,
  playCard,
  startGame,
} from '@/lib/supabase'
import { isValidMove, getValidMoves, getWildColorOptions } from '@/lib/gameLogic'

export default function GameRoomPage() {
  const params = useParams()
  const router = useRouter()
  const gameId = Array.isArray(params?.gameId) ? params?.gameId[0] : params?.gameId
  const [game, setGame] = useState<GameState | null>(null)
  const [players, setPlayers] = useState<GamePlayer[]>([])
  const [moves, setMoves] = useState<GameMove[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedColor, setSelectedColor] = useState<CardColor>('red')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const currentPlayer = useMemo(() => {
    return players.find((player) => player.user_id === currentUserId) || null
  }, [players, currentUserId])

  const isHost = useMemo(() => {
    return Boolean(game && currentUserId && game.host_id === currentUserId)
  }, [game, currentUserId])

  const isCurrentTurn = useMemo(() => {
    return Boolean(game && currentUserId && game.current_turn === currentUserId)
  }, [game, currentUserId])

  useEffect(() => {
    if (!gameId) {
      router.push('/game')
      return
    }

    const load = async () => {
      await loadCurrentUser()
      await loadGameState()
      await loadMoves()
    }

    load()
  }, [gameId])

  useEffect(() => {
    if (!gameId) return

    let activeChannel: any = null
    const subscribe = async () => {
      activeChannel = await getGameStateSubscription(gameId, async () => {
        await loadGameState()
        await loadMoves()
      })
    }

    subscribe()

    return () => {
      if (activeChannel?.unsubscribe) {
        activeChannel.unsubscribe()
      }
    }
  }, [gameId])

  const loadCurrentUser = async () => {
    try {
      const authUser = await getUser()
      setCurrentUserId(authUser?.id || null)
    } catch (error) {
      console.error('Erro ao carregar usuário atual:', error)
    }
  }

  const loadGameState = async () => {
    if (!gameId) return

    try {
      const state = await getGameState(gameId)
      setGame(state)

      const joinedPlayers = await getGamePlayers(gameId)
      setPlayers(joinedPlayers)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao carregar a sala de jogo.')
    }
  }

  const loadMoves = async () => {
    if (!gameId) return

    try {
      const gameMoves = await getGameMoves(gameId)
      setMoves(gameMoves)
    } catch (error) {
      console.error(error)
    }
  }

  const handleStart = async () => {
    if (!gameId) return
    setLoading(true)
    setMessage(null)

    try {
      await startGame(gameId)
      await loadGameState()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao iniciar a partida.')
    } finally {
      setLoading(false)
    }
  }

  const handlePlay = async (card: Card) => {
    if (!gameId || !currentPlayer) return
    setLoading(true)
    setMessage(null)

    try {
      await playCard(gameId, card, card.color === 'wild' || card.value === 'wild_draw4' ? selectedColor : null)
      await loadGameState()
      await loadMoves()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao jogar a carta.')
    } finally {
      setLoading(false)
    }
  }

  const handleDraw = async () => {
    if (!gameId) return
    setLoading(true)
    setMessage(null)

    try {
      await drawCard(gameId)
      await loadGameState()
      await loadMoves()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao comprar carta.')
    } finally {
      setLoading(false)
    }
  }

  if (!game) {
    return (
      <main className="min-h-screen bg-bga-dark text-white p-6">
        <div className="mx-auto max-w-4xl rounded-3xl border border-gray-700 bg-bga-darker p-8 text-center">
          <p className="text-lg text-gray-300">Carregando partida...</p>
        </div>
      </main>
    )
  }

  const topCard = game.top_card
  const validMoves = currentPlayer?.hand_cards
    ? getValidMoves(currentPlayer.hand_cards, topCard!, game.current_color || null)
    : []
  const currentTurnPlayerName = players.find((player) => player.user_id === game.current_turn)?.user?.username || game.current_turn

  return (
    <main className="min-h-screen bg-bga-dark text-white p-6">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-gray-700 bg-bga-darker p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-bga-accent">Sala de Jogo</h1>
            <p className="mt-2 text-gray-400">ID da partida: {game.id}</p>
            <p className="mt-1 text-gray-400">Status: {game.status}</p>
          </div>
          <Button variant="secondary" onClick={() => router.push('/game')}>
            Voltar para salas
          </Button>
        </div>

        {message && (
          <div className="rounded-2xl border border-gray-700 bg-red-500/10 p-4 text-sm text-red-200">
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-gray-700 bg-bga-darker p-6">
            <h2 className="text-xl font-semibold text-white">Mesa de jogo</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-300">
              <p>Topo do monte: <span className="font-semibold text-white">{topCard?.color} {topCard?.value}</span></p>
              <p>Cor atual: <span className="font-semibold text-white">{game.current_color}</span></p>
              <p>Vez de: <span className="font-semibold text-white">{currentTurnPlayerName}</span></p>
              <p>Direção: <span className="font-semibold text-white">{game.direction}</span></p>
              <p>Rodada: <span className="font-semibold text-white">{game.round_number}</span></p>
            </div>
            {game.status === 'waiting' && isHost && (
              <Button onClick={handleStart} loading={loading} className="mt-6 w-full">
                Iniciar partida
              </Button>
            )}
          </div>

          <div className="rounded-3xl border border-gray-700 bg-bga-darker p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-white">Jogadores</h2>
            <div className="mt-4 grid gap-3">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`rounded-2xl border p-4 ${player.user_id === game.current_turn ? 'border-bga-accent bg-bga-dark' : 'border-gray-700 bg-bga-darker'}`}>
                  <p className="font-semibold text-white">{player.user?.username || player.user_id}</p>
                  <p className="text-sm text-gray-400">Cartas: {player.hand_cards?.length ?? 0}</p>
                  <p className="text-sm text-gray-400">Posição: {player.position}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-gray-700 bg-bga-darker p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-white">Sua mão</h2>
            {!currentPlayer ? (
              <p className="mt-4 text-gray-400">Você ainda não faz parte dessa partida.</p>
            ) : (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {currentPlayer.hand_cards.map((card) => {
                    const canPlay = isValidMove(card, topCard as Card, game.current_color || null)
                    return (
                      <button
                        key={card.id}
                        type="button"
                        disabled={!isCurrentTurn || !canPlay || loading || game.status !== 'playing'}
                        onClick={() => handlePlay(card)}
                        className={`rounded-3xl border p-4 text-left transition ${canPlay ? 'border-bga-accent bg-bga-dark' : 'border-gray-700 bg-bga-darker text-gray-500'} ${!isCurrentTurn || game.status !== 'playing' ? 'cursor-not-allowed opacity-60' : 'hover:border-white'}`}>
                        <p className="font-semibold text-white">{card.color} {card.value}</p>
                        {card.color === 'wild' && (
                          <p className="text-sm text-gray-400">Escolher cor ao jogar</p>
                        )}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button onClick={handleDraw} disabled={!isCurrentTurn || loading || game.status !== 'playing'}>
                    Comprar carta
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Cor do Wild:</span>
                    <select
                      value={selectedColor}
                      onChange={(event) => setSelectedColor(event.target.value as CardColor)}
                      className="rounded-xl border border-gray-700 bg-bga-dark px-3 py-2 text-sm text-white"
                    >
                      {getWildColorOptions().map((color) => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {validMoves.length === 0 && isCurrentTurn && game.status === 'playing' && (
                  <p className="mt-3 text-sm text-gray-400">Nenhuma jogada válida disponível. Você pode comprar uma carta.</p>
                )}
              </>
            )}
          </div>

          <div className="rounded-3xl border border-gray-700 bg-bga-darker p-6">
            <h2 className="text-xl font-semibold text-white">Movimentos recentes</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-300">
              {moves.length === 0 ? (
                <p className="text-gray-400">Nenhuma ação registrada ainda.</p>
              ) : (
                moves.slice(-6).reverse().map((move) => (
                  <div key={move.id} className="rounded-2xl border border-gray-700 bg-bga-dark p-3">
                    <p>{new Date(move.timestamp).toLocaleTimeString()} - {move.move_type} {move.card_played ? `${move.card_played.color} ${move.card_played.value}` : ''}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

async function getGameStateSubscription(gameId: string, callback: () => Promise<void>) {
  return await import('@/lib/supabase').then(({ subscribeToGame }) => subscribeToGame(gameId, () => callback()))
}
