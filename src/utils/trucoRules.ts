import type { Card } from '../types'

export const SUITS = ['oros', 'copas', 'espadas', 'bastos'] as const
export const RANKS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12] as const

// 1. 1 de espada (ancho)
// 2. 1 de basto (ancho)
// 3. 7 de espada
// 4. 7 de oro
// 5. 3 de copa, 3 de oro, 3 de basto, 3 de espada
// 6. 2 de copa, 2 de oro, 2 de basto, 2 de espada
// 7. 1 de copa, 1 de oro (ancho falso)
// 8. 12 de copa, 12 de oro, 12 de basto, 12 de espada
// 9. 11 de copa, 11 de oro, 11 de basto, 11 de espada
// 10. 10 de copa, 10 de oro, 10 de basto, 10 de espada
// 11. 7 de copa, 7 de basto
// 12. 6 de copa, 6 de oro, 6 de basto, 6 de espada
// 13. 5 de copa, 5 de oro, 5 de basto, 5 de espada
// 14. 4 de copa, 4 oro, 4 de basto, 4 de espada
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
  // Check exact match first
  const exactMatch = JERARQUIA.find(
    (j) => j.suit === card.suit && j.rank === card.rank,
  )
  if (exactMatch) return exactMatch.power

  // Check rank match for any suit
  const rankMatch = JERARQUIA.find(
    (j) => j.suit === null && j.rank === card.rank,
  )
  return rankMatch ? rankMatch.power : 99
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

export function calculateEnvido(hand: Card[]): { value: number; hasEnvido: boolean; cards: Card[] } {
  const suits = new Map<string, Card[]>()

  for (const card of hand) {
    const suitCards = suits.get(card.suit) || []
    suitCards.push(card)
    suits.set(card.suit, suitCards)
  }

  let maxEnvido = 0
  let envidoCards: Card[] = []
  let hasEnvido = false

  // Find best two cards of same suit
  for (const cards of suits.values()) {
    if (cards.length >= 2) {
      // Sort by rank, considering 10,11,12 are worth 0 for envido
      const sorted = [...cards].sort((a, b) => {
        const valA = a.rank >= 10 ? 0 : a.rank
        const valB = b.rank >= 10 ? 0 : b.rank
        return valB - valA
      })
      
      const val0 = sorted[0].rank >= 10 ? 0 : sorted[0].rank
      const val1 = sorted[1].rank >= 10 ? 0 : sorted[1].rank
      const sum = val0 + val1 + 20
      
      if (sum > maxEnvido) {
        maxEnvido = sum
        hasEnvido = true
        envidoCards = [sorted[0], sorted[1]]
      }
    }
  }
  
  // If no envido, the value is just the highest card (or 0 if all are 10,11,12)
  if (!hasEnvido && hand.length > 0) {
    let bestSingle = 0
    let bestCard = hand[0]
    for (const card of hand) {
      const val = card.rank >= 10 ? 0 : card.rank
      if (val >= bestSingle) {
        bestSingle = val
        bestCard = card
      }
    }
    maxEnvido = bestSingle
    envidoCards = [bestCard]
  }

  return { value: maxEnvido, hasEnvido, cards: envidoCards }
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

export function determineManoWinner(cards: { playerId: string; card: Card }[]): 'tie' | string | null {
  if (cards.length === 0) return null

  let winner = cards[0]
  let isTie = false
  for (let i = 1; i < cards.length; i++) {
    const result = compareCards(winner.card, cards[i].card)
    if (result === 'lower') {
      winner = cards[i]
      isTie = false
    } else if (result === 'tie') {
      isTie = true
    }
  }

  return isTie ? 'tie' : winner.playerId
}

export function getTrucoPoints(level: number): number {
  switch (level) {
    case 1: return 2 // Truco = 2 points
    case 2: return 3 // Retruco = 3 points
    case 3: return 4 // Vale cuatro = 4 points
    default: return 1 // Not accepted = 1 point
  }
}

export function getEnvidoPoints(level: number): number {
  switch (level) {
    case 1: return 2 // Envido
    case 2: return 4 // Real Envido or Envido Envido (simplified)
    case 3: return 5 // Falta Envido (simplified for now, usually it's points left to win)
    default: return 1 // Not accepted = 1
  }
}

export function getFlorPoints(level: number): number {
  switch (level) {
    case 1: return 3 // Flor
    case 2: return 6 // Contra Flor
    default: return 3
  }
}
