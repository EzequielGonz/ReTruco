export const SUITS = {
  oros: 'oros',
  copas: 'copas',
  espadas: 'espadas',
  bastos: 'bastos',
} as const

export const RANKS = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  ten: 10,
  eleven: 11,
  twelve: 12,
} as const

export type Suit = typeof SUITS[keyof typeof SUITS]
export type Rank = typeof RANKS[keyof typeof RANKS]

export const CARD_SUIT_SYMBOLS: Record<Suit, string> = {
  oros: '🟡',
  copas: '❤️',
  espadas: '⚔️',
  bastos: '🌿',
}

export const CARD_SUIT_COLORS: Record<Suit, string> = {
  oros: '#f59e0b',
  copas: '#ef4444',
  espadas: '#1e293b',
  bastos: '#10b981',
}

export const RANK_NAMES: Record<Rank, string> = {
  1: 'As',
  2: 'Dos',
  3: 'Tres',
  4: 'Cuatro',
  5: 'Cinco',
  6: 'Seis',
  7: 'Siete',
  10: 'Sota',
  11: 'Caballo',
  12: 'Rey',
}
