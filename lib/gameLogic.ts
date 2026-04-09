import { Card, CardColor } from './types'
import { CARD_POINTS, GAME_RULES } from './constants'

/**
 * Validates if a card can be played on another card
 */
export function isValidMove(
  cardToPlay: Card,
  topCard: Card,
  currentColor: string | null
): boolean {
  // Wild cards are always valid
  if (cardToPlay.color === 'wild') {
    return true
  }

  // If no current color set, use top card color
  const activeColor = currentColor || topCard.color

  // Card must match color or number
  return cardToPlay.color === activeColor || cardToPlay.value === topCard.value
}

/**
 * Gets all valid moves from a hand
 */
export function getValidMoves(hand: Card[], topCard: Card, currentColor: string | null): Card[] {
  return hand.filter((card) => isValidMove(card, topCard, currentColor))
}

/**
 * Calculates score at end of round
 */
export function calculateRoundScore(playerHands: Map<string, Card[]>): Map<string, number> {
  const scores = new Map<string, number>()

  playerHands.forEach((hand, playerId) => {
    let score = 0
    for (const card of hand) {
      score += CARD_POINTS[card.value as keyof typeof CARD_POINTS] || 0
    }
    scores.set(playerId, score)
  })

  return scores
}

export function getExpectedScore(playerRating: number, opponentRating: number) {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400))
}

export function calculateEloRating(
  currentRating: number,
  opponentRating: number,
  score: number,
  kFactor: number = 32
) {
  const expected = getExpectedScore(currentRating, opponentRating)
  return Math.round(currentRating + kFactor * (score - expected))
}

export function calculateMultiplayerElo(
  winnerRating: number,
  opponentRatings: number[],
  kFactor: number = 32,
  adjustment: number = 0.8
) {
  if (opponentRatings.length === 0) {
    return winnerRating
  }

  const averageOpponent = opponentRatings.reduce((sum, rating) => sum + rating, 0) / opponentRatings.length
  const expected = getExpectedScore(winnerRating, averageOpponent)
  return Math.round(winnerRating + kFactor * adjustment * (1 - expected))
}

export function calculateLoserElo(
  loserRating: number,
  winnerRating: number,
  kFactor: number = 32,
  adjustment: number = 0.8
) {
  const expected = getExpectedScore(loserRating, winnerRating)
  return Math.round(loserRating + kFactor * adjustment * (0 - expected))
}

/**
 * Determines if UNO should be called
 */
export function shouldCallUno(handSize: number): boolean {
  return handSize === 1
}

/**
 * Handles Wild card color selection
 */
export function getWildColorOptions(): CardColor[] {
  return ['red', 'yellow', 'blue', 'green']
}

export function isWildCard(card: Card): boolean {
  return card.color === 'wild' || card.value === 'wild_draw4'
}

export function dealInitialHands(deck: Card[], playerCount: number, handSize = GAME_RULES.INITIAL_HAND_SIZE) {
  const shuffledDeck = shuffleDeck(deck)
  const hands: Card[][] = Array.from({ length: playerCount }, () => [])

  for (let round = 0; round < handSize; round += 1) {
    for (let index = 0; index < playerCount; index += 1) {
      const card = shuffledDeck.shift()
      if (card) {
        hands[index].push(card)
      }
    }
  }

  return { hands, deck: shuffledDeck }
}

export function getStartingTopCard(deck: Card[]) {
  const cards = [...deck]
  let topCard: Card | undefined

  while (cards.length > 0) {
    const candidate = cards.shift()!
    if (!isWildCard(candidate)) {
      topCard = candidate
      break
    }
    cards.push(candidate)
  }

  if (!topCard) {
    topCard = cards.shift()!
  }

  const currentColor = topCard.color === 'wild' ? 'red' : topCard.color
  return {
    topCard,
    currentColor,
    deck: cards,
  }
}

export function drawCards(deck: Card[], count: number) {
  const drawn: Card[] = []
  const workingDeck = [...deck]

  for (let i = 0; i < count; i += 1) {
    const nextCard = workingDeck.shift()
    if (!nextCard) break
    drawn.push(nextCard)
  }

  return { drawn, deck: workingDeck }
}

/**
 * Determines next player in turn order
 */
export function getNextPlayer(
  currentPlayerIndex: number,
  totalPlayers: number,
  isReverse: boolean = false
): number {
  if (isReverse) {
    return currentPlayerIndex === 0 ? totalPlayers - 1 : currentPlayerIndex - 1
  }
  return (currentPlayerIndex + 1) % totalPlayers
}

/**
 * Determines skip player effect
 */
export function getSkipNextPlayer(
  currentPlayerIndex: number,
  totalPlayers: number,
  isReverse: boolean = false
): number {
  const nextPlayerIndex = getNextPlayer(currentPlayerIndex, totalPlayers, isReverse)
  return getNextPlayer(nextPlayerIndex, totalPlayers, isReverse)
}

/**
 * Validates game state
 */
export function isGameValid(
  players: number,
  totalCards: number
): boolean {
  return (
    players >= GAME_RULES.MIN_PLAYERS &&
    players <= GAME_RULES.MAX_PLAYERS &&
    totalCards === 108
  )
}

/**
 * Generates a standard UNO deck
 */
export function generateUnoDeck(): Card[] {
  const deck: Card[] = []
  let idCounter = 0

  const colors = ['red', 'yellow', 'blue', 'green'] as const
  const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const
  const actions = ['skip', 'reverse', 'draw2'] as const

  // Numbers: 0-9 (4 of each color) - except 0 which has 1 of each
  for (const color of colors) {
    // 0 - 1 of each color
    deck.push({
      id: `card_${idCounter++}`,
      color: color as any,
      value: '0',
    })

    // 1-9 - 2 of each
    for (const number of numbers.slice(1)) {
      deck.push(
        {
          id: `card_${idCounter++}`,
          color: color as any,
          value: number,
        },
        {
          id: `card_${idCounter++}`,
          color: color as any,
          value: number,
        }
      )
    }
  }

  // Action cards: 2 of each (Skip, Reverse, Draw2) per color
  for (const color of colors) {
    for (const action of actions) {
      deck.push(
        {
          id: `card_${idCounter++}`,
          color: color as any,
          value: action as any,
        },
        {
          id: `card_${idCounter++}`,
          color: color as any,
          value: action as any,
        }
      )
    }
  }

  // Wild cards: 4 Wild, 4 Wild Draw4
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `card_${idCounter++}`,
      color: 'wild',
      value: 'wild',
    })

    deck.push({
      id: `card_${idCounter++}`,
      color: 'wild',
      value: 'wild_draw4',
    })
  }

  return deck
}

/**
 * Shuffles array using Fisher-Yates algorithm
 */
export function shuffleDeck<T>(array: T[]): T[] {
  const deck = [...array]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}
