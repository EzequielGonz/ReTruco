export interface User {
  id: string
  email: string
  username: string
  avatar?: string
  balance: number
  createdAt: Date
}

export interface Table {
  id: string
  name: string
  hostId: string
  players: Player[]
  minBuyIn: number
  maxPlayers: number
  status: 'waiting' | 'playing' | 'finished'
  createdAt: Date
}

export interface Player {
  userId: string
  username: string
  avatar?: string
  chips: number
  position: 'north' | 'east' | 'south' | 'west'
  isReady: boolean
  isBot?: boolean
}

export interface Card {
  suit: 'oros' | 'copas' | 'espadas' | 'bastos'
  rank: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12
  value: number
  power: number
}

export interface GameState {
  tableId: string
  players: Player[]
  deck: Card[]
  hands: Card[][]
  manos: Mano[]
  currentManoIndex: number
  currentPlayerIndex: number
  // Index of who had the turn before a call interrupted the flow
  preBidPlayerIndex: number
  trucoLevel: 0 | 1 | 2 | 3
  envidoLevel: 0 | 1 | 2 | 3
  florLevel: 0 | 1 | 2
  // Who originally called truco/envido/flor (to show correct modal text)
  trucoCaller: string | null
  envidoCaller: string | null
  florCaller: string | null
  // Whether envido has been resolved already this hand
  envidoResolved: boolean
  // Number of tricks played this hand (to block envido after 1st trick)
  tricksPlayedThisHand: number
  gamePhase: 'truco' | 'envido' | 'envido_points' | 'flor' | 'playing' | 'finished'
  envidoPointsCall?: { playerId: string; points: number }
  // Toast shown when bot responds to a bid (quiero/no quiero)
  botToast?: { text: string; color: string; id: string }
  currentTurn: string
  puntos: { [key: string]: number }
  targetPoints: number
  winner: string | null
  messages: GameMessage[]
}

export interface Mano {
  id: string
  cards: { playerId: string; card?: Card; played: boolean }[]
  winner?: string
}

export interface GameMessage {
  id: string
  type: 'info' | 'warning' | 'success' | 'error'
  text: string
  playerId?: string
}

export interface Payment {
  id: string
  userId: string
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  preferenceId?: string
  createdAt: Date
}

export interface ChatMessage {
  id: string
  userId: string
  username: string
  message: string
  timestamp: Date
}