import { create } from 'zustand'
import type { Card, Player, GameState, GameMessage } from '../types'
import {
  createDeck,
  shuffleDeck,
  dealCards,
  calculateEnvido,
  hasFlor,
  determineManoWinner,
  getCardPower,
  getTrucoPoints,
  getEnvidoPoints,
  getFlorPoints,
} from '../utils/trucoRules'

type TrucoLevel = 0 | 1 | 2 | 3
type EnvidoLevel = 0 | 1 | 2 | 3
type FlorLevel = 0 | 1 | 2

interface GameStoreState {
  gameState: GameState | null
  isPlaying: boolean

  startGame: (players: Player[], targetPoints?: number) => void
  playCard: (playerId: string, card: Card) => void
  callTruco: (playerId: string, level: TrucoLevel) => void
  acceptTruco: (playerId: string) => void
  rejectTruco: (playerId: string) => void
  callEnvido: (playerId: string, level: EnvidoLevel) => void
  acceptEnvido: (playerId: string) => void
  rejectEnvido: (playerId: string) => void
  callFlor: (playerId: string, level: FlorLevel) => void
  acceptFlor: (playerId: string) => void
  rejectFlor: (playerId: string) => void
  goToDeck: (playerId: string) => void
  resetGame: () => void

  botPlay: () => void
}

const createInitialGameState = (players: Player[], targetPoints: number): GameState => {
  const deck = shuffleDeck(createDeck())
  const { hands, remaining } = dealCards(deck, players)

  const messages: GameMessage[] = []
  if (players.some((_player, index) => hasFlor(hands[index]))) {
    messages.push({
      id: crypto.randomUUID(),
      type: 'info',
      text: 'Alguien tiene flor',
    })
  }

  return {
    tableId: crypto.randomUUID(),
    players,
    deck: remaining,
    hands: hands.map((h) => [...h].sort((a, b) => getCardPower(a) - getCardPower(b))),
    manos: players.map(() => ({
      id: crypto.randomUUID(),
      cards: players.map((player) => ({
        playerId: player.userId,
        card: undefined,
        played: false,
      })),
    })),
    currentManoIndex: 0,
    currentPlayerIndex: 0,
    trucoLevel: 0,
    envidoLevel: 0,
    florLevel: 0,
    gamePhase: 'playing',
    currentTurn: players[0].userId,
    puntos: Object.fromEntries(players.map((p) => [p.userId, 0])),
    targetPoints,
    winner: null,
    messages,
  }
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  gameState: null,
  isPlaying: false,

  startGame: (players: Player[], targetPoints = 15) => {
    set({
      gameState: createInitialGameState(players, targetPoints),
      isPlaying: true,
    })
  },

  playCard: (playerId: string, card: Card) => {
    set((state) => {
      if (!state.gameState) return state
      const { gameState } = state

      if (gameState.currentTurn !== playerId) return state
      if (gameState.gamePhase !== 'playing') return state

      const playerIndex = gameState.players.findIndex((p) => p.userId === playerId)
      const handIndex = gameState.hands[playerIndex].findIndex(
        (c) => c.suit === card.suit && c.rank === card.rank,
      )

      if (handIndex === -1) return state

      const newHands = [...gameState.hands]
      newHands[playerIndex] = gameState.hands[playerIndex].filter((_, i) => i !== handIndex)

      const currentMano = gameState.manos[gameState.currentManoIndex]
      const newManos = [...gameState.manos]
      newManos[gameState.currentManoIndex] = {
        ...currentMano,
        cards: currentMano.cards.map((c) =>
          c.playerId === playerId ? { ...c, card, played: true } : c,
        ),
      }

      const playedCount = newManos[gameState.currentManoIndex].cards.filter((c) => c.played).length
      let newManoIndex = gameState.currentManoIndex
      const puntos = { ...gameState.puntos }
      let winner = gameState.winner
      let nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length

      if (playedCount === gameState.players.length) {
        const playedCards = newManos[newManoIndex].cards.filter(
          (c) => c.card && c.played,
        ) as { playerId: string; card: Card }[]
        const manoWinner = determineManoWinner(playedCards)
        newManos[newManoIndex] = { ...newManos[newManoIndex], winner: manoWinner ?? undefined }

        if (manoWinner) {
          puntos[manoWinner] = (puntos[manoWinner] || 0) + 1
          if (puntos[manoWinner] >= gameState.targetPoints) {
            winner = manoWinner
          }
        }

        newManoIndex++
        nextPlayerIndex = gameState.players.findIndex((p) => p.userId === manoWinner)

        if (newManoIndex >= gameState.players.length && !winner) {
          newManoIndex = 0
        }
      }

      const newMessages: GameMessage[] = [
        ...gameState.messages,
        {
          id: crypto.randomUUID(),
          type: 'info',
          text: `${gameState.players[playerIndex].username} jugó ${card.rank} de ${card.suit}`,
          playerId,
        },
      ]

      return {
        gameState: {
          ...gameState,
          hands: newHands,
          manos: newManos,
          currentManoIndex: newManoIndex,
          currentPlayerIndex: nextPlayerIndex,
          puntos,
          winner,
          currentTurn:
            nextPlayerIndex >= 0
              ? gameState.players[nextPlayerIndex].userId
              : gameState.currentTurn,
          messages: newMessages,
        },
      }
    })
  },

  callTruco: (_playerId: string, level: TrucoLevel) => {
    set((state) => {
      if (!state.gameState) return state
      return {
        gameState: {
          ...state.gameState,
          trucoLevel: level,
          gamePhase: 'truco',
          messages: [
            ...state.gameState.messages,
            {
              id: crypto.randomUUID(),
              type: 'warning',
              text: `Truco al ${level === 1 ? 'Truco' : level === 2 ? 'Retruco' : 'Vale Cuatro'}!`,
            },
          ],
        },
      }
    })
  },

  acceptTruco: (playerId: string) => {
    set((state) => {
      if (!state.gameState) return state
      return {
        gameState: {
          ...state.gameState,
          trucoLevel: state.gameState.trucoLevel > 0 ? state.gameState.trucoLevel : 1,
          gamePhase: 'playing',
          messages: [
            ...state.gameState.messages,
            {
              id: crypto.randomUUID(),
              type: 'success',
              text: `Truco aceptado!`,
              playerId,
            },
          ],
        },
      }
    })
  },

  rejectTruco: (playerId: string) => {
    set((state) => {
      if (!state.gameState) return state
      const winner = state.gameState.players.find((p) => p.userId !== playerId)
      const puntos = { ...state.gameState.puntos }
      if (winner) {
        const points = getTrucoPoints(state.gameState.trucoLevel || 1)
        puntos[winner.userId] = (puntos[winner.userId] || 0) + points
      }

      return {
        gameState: {
          ...state.gameState,
          gamePhase: 'finished',
          puntos,
          winner: winner?.userId || null,
          messages: [
            ...state.gameState.messages,
            {
              id: crypto.randomUUID(),
              type: 'error',
              text: `Truco rechazado!`,
              playerId,
            },
          ],
        },
      }
    })
  },

  callEnvido: (_playerId: string, _level: EnvidoLevel) => {
    set((state) => {
      if (!state.gameState) return state
      return {
        gameState: {
          ...state.gameState,
          envidoLevel: _level,
          gamePhase: 'envido',
          messages: [
            ...state.gameState.messages,
            {
              id: crypto.randomUUID(),
              type: 'warning',
              text: `Envido al ${_level === 1 ? 'Envido' : _level === 2 ? 'Real Envido' : 'Falta Envido'}!`,
            },
          ],
        },
      }
    })
  },

  acceptEnvido: (playerId: string) => {
    set((state) => {
      if (!state.gameState) return state
      const player = state.gameState.players.find((p) => p.userId === playerId)
      const playerIndex = state.gameState.players.findIndex((p) => p.userId === playerId)
      const envidoResult = calculateEnvido(state.gameState.hands[playerIndex])

      if (!envidoResult.hasEnvido) {
        return {
          gameState: {
            ...state.gameState,
            gamePhase: 'playing',
            messages: [
              ...state.gameState.messages,
              {
                id: crypto.randomUUID(),
                type: 'error',
                text: `${player?.username} no tiene envido!`,
                playerId,
              },
            ],
          },
        }
      }

      const opponentIndex = (playerIndex + 1) % state.gameState.players.length
      const opponentEnvido = calculateEnvido(state.gameState.hands[opponentIndex])
      const winnerUserId =
        envidoResult.value > opponentEnvido.value
          ? playerId
          : state.gameState.players[opponentIndex].userId
      const puntos = { ...state.gameState.puntos }
      const envidoPoints = getEnvidoPoints(state.gameState.envidoLevel || 1)
      puntos[winnerUserId] = (puntos[winnerUserId] || 0) + envidoPoints

      return {
        gameState: {
          ...state.gameState,
          gamePhase: 'playing',
          puntos,
          messages: [
            ...state.gameState.messages,
            {
              id: crypto.randomUUID(),
              type: 'success',
              text: `${player?.username}: ${envidoResult.value} - ${state.gameState.players[opponentIndex].username}: ${opponentEnvido.value}`,
            },
          ],
        },
      }
    })
  },

  rejectEnvido: (playerId: string) => {
    set((state) => {
      if (!state.gameState) return state
      const winner = state.gameState.players.find((p) => p.userId !== playerId)
      const puntos = { ...state.gameState.puntos }
      if (winner) {
        const envidoPoints = getEnvidoPoints(state.gameState.envidoLevel || 1)
        puntos[winner.userId] = (puntos[winner.userId] || 0) + envidoPoints
      }

      return {
        gameState: {
          ...state.gameState,
          gamePhase: 'playing',
          puntos,
          messages: [
            ...state.gameState.messages,
            {
              id: crypto.randomUUID(),
              type: 'success',
              text: `Envido rechazado!`,
              playerId,
            },
          ],
        },
      }
    })
  },

  callFlor: (_playerId: string, _level: FlorLevel) => {
    set((state) => {
      if (!state.gameState) return state
      return {
        gameState: {
          ...state.gameState,
          florLevel: _level,
          gamePhase: 'flor',
          messages: [
            ...state.gameState.messages,
            {
              id: crypto.randomUUID(),
              type: 'warning',
              text: `Flor al ${_level === 1 ? 'Flor' : 'Contra Flor'}!`,
            },
          ],
        },
      }
    })
  },

  acceptFlor: (playerId: string) => {
    set((state) => {
      if (!state.gameState) return state
      const player = state.gameState.players.find((p) => p.userId === playerId)
      const playerIndex = state.gameState.players.findIndex((p) => p.userId === playerId)
      const playerFlor = hasFlor(state.gameState.hands[playerIndex])

      if (!playerFlor) {
        return {
          gameState: {
            ...state.gameState,
            gamePhase: 'playing',
            messages: [
              ...state.gameState.messages,
              {
                id: crypto.randomUUID(),
                type: 'error',
                text: `${player?.username} no tiene flor!`,
                playerId,
              },
            ],
          },
        }
      }

      const opponentIndex = (playerIndex + 1) % state.gameState.players.length
      const opponentFlor = hasFlor(state.gameState.hands[opponentIndex])
      const winnerIndex = opponentFlor ? playerIndex : opponentIndex
      const puntos = { ...state.gameState.puntos }
      const florPoints = getFlorPoints(state.gameState.florLevel || 1)
      puntos[state.gameState.players[winnerIndex].userId] =
        (puntos[state.gameState.players[winnerIndex].userId] || 0) + florPoints

      return {
        gameState: {
          ...state.gameState,
          gamePhase: 'playing',
          puntos,
          messages: [
            ...state.gameState.messages,
            {
              id: crypto.randomUUID(),
              type: 'success',
              text: `Flor aceptada!`,
              playerId,
            },
          ],
        },
      }
    })
  },

  rejectFlor: (playerId: string) => {
    set((state) => {
      if (!state.gameState) return state
      const winner = state.gameState.players.find((p) => p.userId !== playerId)
      const puntos = { ...state.gameState.puntos }
      if (winner) {
        const florPoints = getFlorPoints(state.gameState.florLevel || 1)
        puntos[winner.userId] = (puntos[winner.userId] || 0) + florPoints
      }

      return {
        gameState: {
          ...state.gameState,
          gamePhase: 'playing',
          puntos,
          messages: [
            ...state.gameState.messages,
            {
              id: crypto.randomUUID(),
              type: 'success',
              text: `Flor rechazada!`,
              playerId,
            },
          ],
        },
      }
    })
  },

  goToDeck: (playerId: string) => {
    set((state) => {
      if (!state.gameState) return state
      const opponent = state.gameState.players.find((p) => p.userId !== playerId)
      const puntos = { ...state.gameState.puntos }
      if (opponent) {
        puntos[opponent.userId] = (puntos[opponent.userId] || 0) + 1
      }

      return {
        gameState: {
          ...state.gameState,
          puntos,
          messages: [
            ...state.gameState.messages,
            {
              id: crypto.randomUUID(),
              type: 'info',
              text: `${state.gameState.players.find((p) => p.userId === playerId)?.username || 'Jugador'} se fue al mazo!`,
              playerId,
            },
          ],
        },
      }
    })
  },

  resetGame: () => {
    set({ gameState: null, isPlaying: false })
  },

  botPlay: () => {
    const state = get()
    if (!state.gameState || !state.isPlaying) return

    const { gameState } = state
    const currentPlayerIndex = gameState.currentPlayerIndex
    const player = gameState.players[currentPlayerIndex]

    if (!player?.isBot) return

    setTimeout(() => {
      const { gameState } = get()
      if (!gameState || !get().isPlaying) return

      const currentTurn = gameState.currentTurn
      const playerIndex = gameState.players.findIndex((p) => p.userId === currentTurn)
      const currentPlayer = gameState.players[playerIndex]

      if (!currentPlayer?.isBot) return

      const hand = gameState.hands[playerIndex]

      if (gameState.gamePhase === 'truco' || gameState.gamePhase === 'playing') {
        if (gameState.trucoLevel === 0 && Math.random() > 0.7) {
          get().callTruco(currentTurn, 1)
          setTimeout(() => get().botPlay(), 1000)
          return
        }

        if (gameState.trucoLevel === 1) {
          if (Math.random() > 0.5) {
            get().acceptTruco(currentTurn)
          } else {
            get().rejectTruco(currentTurn)
          }
          setTimeout(() => get().botPlay(), 1000)
          return
        }

        if (gameState.trucoLevel === 2) {
          if (Math.random() > 0.6) {
            get().callTruco(currentTurn, 3)
          } else if (Math.random() > 0.4) {
            get().acceptTruco(currentTurn)
          } else {
            get().rejectTruco(currentTurn)
          }
          setTimeout(() => get().botPlay(), 1000)
          return
        }

        if (gameState.gamePhase === 'playing' && hand.length > 0) {
          const sortedHand = [...hand].sort((a, b) => a.power - b.power)
          const currentMano = gameState.manos[gameState.currentManoIndex]
          const playedCards = currentMano.cards.filter((c) => c.played)

          let cardToPlay: Card
          if (playedCards.length > 0) {
            const lastPlayed = playedCards[playedCards.length - 1].card!
            const betterCards = sortedHand.filter((c) => c.power < lastPlayed.power)
            if (betterCards.length > 0 && Math.random() > 0.3) {
              cardToPlay = betterCards[Math.floor(Math.random() * betterCards.length)]
            } else {
              cardToPlay = sortedHand[sortedHand.length - 1]
            }
          } else {
            cardToPlay = sortedHand[Math.floor(Math.random() * sortedHand.length)]
          }

          get().playCard(currentTurn, cardToPlay)
        }
      }

      if (gameState.gamePhase === 'envido') {
        const envidoResult = calculateEnvido(hand)
        if (envidoResult.value >= 25 && Math.random() > 0.3) {
          get().callEnvido(currentTurn, 2)
        } else if (Math.random() > 0.5) {
          get().acceptEnvido(currentTurn)
        } else {
          get().rejectEnvido(currentTurn)
        }
      }

      if (gameState.gamePhase === 'flor') {
        const playerHasFlor = hasFlor(hand)
        if (playerHasFlor) {
          if (Math.random() > 0.5) {
            get().acceptFlor(currentTurn)
          } else {
            get().rejectFlor(currentTurn)
          }
        }
      }
    }, 1200)
  },
}))
