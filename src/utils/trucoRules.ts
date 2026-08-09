import type { Card } from '../types'

export const SUITS = ['oros', 'copas', 'espadas', 'bastos'] as const
export const RANKS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12] as const

export const JERARQUIA = [
  { suit: 'espadas', rank: 1, power: 1 },
  { suit: 'bastos', rank: 1, power: 2 },
  { suit: 'espadas', rank: 7, power: 3 },
  { suit: 'oros', rank: 7, power: 4 },
  { suit: null, rank: 3, power: 5 },
  { suit: null, rank: 2, power: 6 },
  { suit: 'copas', rank: 1, power: 7 },
  { suit: 'oros', rank: 1, power: 8 },
  { suit: null, rank: 12, power: 9 },
  { suit: null, rank: 11, power: 10 },
  { suit: null, rank: 10, power: 11 },
  { suit: 'copas', rank: 7, power: 12 },
  { suit: 'bastos', rank: 7, power: 13 },
  { suit: null, rank: 6, power: 14 },
  { suit: null, rank: 5, power: 15 },
  { suit: null, rank: 4, power: 16 },
] as const

export function getCardPower(card: Pick<Card, 'suit' | 'rank'>): number {
  const index = JERARQUIA.findIndex(
    (j) => j.suit === card.suit && j.rank === card.rank,
  )
  return index === -1 ? 99 : index
}

export function createDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const power = getCardPower({ suit, rank })
      deck.push({ suit, rank, value: rank, power })
    }
  }
  return deck
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function dealCards(deck: Card[], players: { userId: string }[]): { hands: Card[][]; remaining: Card[] } {
  const hands: Card[][] = Array.from({ length: players.length }, () => [])
  let deckIndex = 0

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < players.length; j++) {
      hands[j].push(deck[deckIndex++])
    }
  }

  return { hands, remaining: deck.slice(deckIndex) }
}

export function calculateEnvido(hand: Card[]): { value: number; hasEnvido: boolean } {
  const suits = new Map<string, Card[]>()

  for (const card of hand) {
    if ([10, 11, 12].includes(card.rank)) continue
    const suitCards = suits.get(card.suit) || []
    suitCards.push(card)
    suits.set(card.suit, suitCards)
  }

  let maxEnvido = 0
  let hasEnvido = false

  for (const cards of suits.values()) {
    if (cards.length >= 2) {
      const sorted = [...cards].sort((a, b) => b.rank - a.rank)
      const sum = sorted[0].rank + sorted[1].rank + 20
      if (sum > maxEnvido) {
        maxEnvido = sum
        hasEnvido = true
      }
    }
  }

  return { value: maxEnvido, hasEnvido }
}

export function hasFlor(hand: Card[]): boolean {
  const suits = new Map<string, number>()
  for (const card of hand) {
    suits.set(card.suit, (suits.get(card.suit) || 0) + 1)
  }
  return Array.from(suits.values()).some((count) => count === 3)
}

export function compareCards(card1: Card, card2: Card): 'higher' | 'lower' | 'tie' {
  const power1 = card1.power ?? getCardPower(card1)
  const power2 = card2.power ?? getCardPower(card2)
  if (power1 < power2) return 'higher'
  if (power1 > power2) return 'lower'
  return 'tie'
}

export function determineManoWinner(cards: { playerId: string; card: Card }[]): string | null {
  if (cards.length === 0) return null

  let winner = cards[0]
  for (let i = 1; i < cards.length; i++) {
    const result = compareCards(winner.card, cards[i].card)
    if (result === 'lower') {
      winner = cards[i]
    }
  }

  return winner.playerId
}

export function getTrucoPoints(level: number): number {
  switch (level) {
    case 1: return 1
    case 2: return 2
    case 3: return 3
    default: return 1
  }
}

export function getEnvidoPoints(level: number): number {
  switch (level) {
    case 1: return 2
    case 2: return 4
    case 3: return 5
    default: return 2
  }
}

export function getFlorPoints(level: number): number {
  switch (level) {
    case 1: return 3
    case 2: return 6
    default: return 3
  }
}
