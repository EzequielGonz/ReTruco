import { create } from 'zustand'
import type { Card, Player, GameState, GameMessage } from '../types'
import {
  createDeck, shuffleDeck, dealCards,
  calculateEnvido, hasFlor, determineManoWinner,
  getCardPower, getTrucoPoints, getEnvidoPoints,
} from '../utils/trucoRules'
import { sayCall } from '../utils/sounds'

type TrucoLevel = 0 | 1 | 2 | 3
type EnvidoLevel = 0 | 1 | 2 | 3

interface GameStoreState {
  gameState: GameState | null
  isPlaying: boolean
  isDealing: boolean
  startGame: (players: Player[], targetPoints?: number) => void
  playCard: (playerId: string, card: Card) => void
  callTruco: (playerId: string, level: TrucoLevel) => void
  acceptTruco: (playerId: string) => void
  rejectTruco: (playerId: string) => void
  callEnvido: (playerId: string, type: 'envido' | 'real' | 'falta') => void
  callFlor: (playerId: string) => void
  acceptEnvido: (playerId: string) => void
  rejectEnvido: (playerId: string) => void
  announceEnvidoPoints: (playerId: string, isSonBuenas: boolean) => void
  goToDeck: (playerId: string) => void
  resetGame: () => void
  botPlay: () => void
  finishDealing: () => void
  clearBotToast: () => void
  // Reparte la mano nueva pendiente tras mostrar el resultado de la ronda
  continueAfterHandResult: () => void
}

const msg = (type: GameMessage['type'], text: string, playerId?: string): GameMessage => ({
  id: crypto.randomUUID(), type, text, playerId,
})

const toast = (text: string, color: string) => ({ text, color, id: crypto.randomUUID() })

function freshManos(players: Player[]) {
  return [0, 1, 2].map(() => ({
    id: crypto.randomUUID(),
    cards: players.map((p) => ({ playerId: p.userId, card: undefined, played: false })),
  }))
}

function buildHands(players: Player[]) {
  const deck = shuffleDeck(createDeck())
  const { hands, remaining } = dealCards(deck, players)
  return {
    deck: remaining,
    hands: hands.map((h) => [...h].sort((a, b) => getCardPower(a) - getCardPower(b))),
  }
}

/**
 * True si algún jugador tiene flor en la mano. La flor bloquea el envido:
 * no se puede cantar envido en una mano donde hay flor.
 */
function hasFlorInPlay(gs: GameState): boolean {
  return gs.players.some((_, i) => hasFlor(gs.hands[i]))
}

/**
 * Probabilidad aproximada de que un tanto de envido le gane al rival
 * (el rival reparte uniforme entre 4 y 33, figuras valen 0).
 */
function envidoWinProb(value: number): number {
  return Math.min(0.95, Math.max(0.05, (value - 4) / 29))
}

function createInitialState(players: Player[], targetPoints: number): GameState {
  const { deck, hands } = buildHands(players)
  const messages: GameMessage[] = []
  const puntos: Record<string, number> = Object.fromEntries(players.map((p) => [p.userId, 0]))
  return {
    tableId: crypto.randomUUID(),
    players, deck, hands,
    manos: freshManos(players),
    currentManoIndex: 0,
    currentPlayerIndex: 0,       // index of "mano" player (leads first trick)
    preBidPlayerIndex: 0,
    trucoLevel: 0, envidoLevel: 0, envidoAccumulated: 0,
    envidoLastCall: null, envidoNoQuiero: 0,
    trucoCaller: null, envidoCaller: null,
    envidoResolved: false, florSung: false, tricksPlayedThisHand: 0,
    gamePhase: 'playing',
    envidoPointsCall: undefined,
    botToast: undefined,
    currentTurn: players[0].userId,
    puntos,
    targetPoints, winner: null, messages,
  }
}

function dealNewHand(gs: GameState, leaderIndex: number): GameState {
  const { deck, hands } = buildHands(gs.players)
  const messages: GameMessage[] = [...gs.messages, msg('info', '── Nueva mano ──')]
  const puntos = { ...gs.puntos }
  const winner = gs.players.find((p) => (puntos[p.userId] || 0) >= gs.targetPoints)?.userId ?? null
  const next = leaderIndex >= 0 && leaderIndex < gs.players.length ? leaderIndex : 0
  return {
    ...gs, deck, hands, messages, puntos, winner,
    manos: freshManos(gs.players),
    currentManoIndex: 0,
    currentPlayerIndex: next, preBidPlayerIndex: next,
    trucoLevel: 0, envidoLevel: 0, envidoAccumulated: 0,
    envidoLastCall: null, envidoNoQuiero: 0,
    trucoCaller: null, envidoCaller: null,
    envidoResolved: false, florSung: false, tricksPlayedThisHand: 0,
    gamePhase: winner ? 'finished' : 'playing',
    envidoPointsCall: undefined,
    handResult: undefined, pendingDeal: undefined,
    botToast: undefined,
    currentTurn: gs.players[next].userId,
  }
}

/**
 * Evaluate whether the hand is already won based on completed manos.
 *
 * Official rules (2 players / mano a mano):
 * - Win 2 tricks → win the hand immediately (no need to play trick 3)
 * - Parda (tie) trick 1 + win trick 2 → winner of trick 2 wins the hand
 * - Win trick 1 + parda trick 2 → winner of trick 1 wins the hand
 * - Parda trick 1 + parda trick 2 → mano (first player, index 0) wins
 * - Win trick 1 + lose trick 2 → must play trick 3
 *
 * Returns the userId of the hand winner, or null if not decided yet.
 */
function evaluateHandWinner(
  manos: GameState['manos'],
  players: Player[],
  manoPlayerIndex: number,   // index of the "mano" player (first player of the hand)
): string | null {
  const results = manos.map((mn) => mn.winner) // undefined | 'tie' | playerId

  const r0 = results[0]
  const r1 = results[1]
  const r2 = results[2]

  // Neither trick 0 done yet
  if (r0 === undefined) return null

  // After trick 1 only:
  if (r1 === undefined) {
    // Can't decide yet after only 1 trick unless someone won trick 1
    // (we still need trick 2 in all cases)
    return null
  }

  const manoId = players[manoPlayerIndex]?.userId

  // Both trick 0 and trick 1 resolved
  const w0 = r0 === 'tie' ? null : r0
  const w1 = r1 === 'tie' ? null : r1
  const tied0 = r0 === 'tie'
  const tied1 = r1 === 'tie'

  // Case: win trick 1 AND win trick 2 → winner of trick 1 (same person)
  if (w0 && w1 && w0 === w1) return w0

  // Case: parda trick 1, win trick 2 → winner of trick 2 wins hand
  if (tied0 && w1) return w1

  // Case: win trick 1, parda trick 2 → winner of trick 1 wins hand
  if (w0 && tied1) return w0

  // Case: parda trick 1, parda trick 2 → mano wins
  if (tied0 && tied1) return manoId ?? null

  // Case: win trick 1, lose trick 2 (different winners) → play trick 3
  if (w0 && w1 && w0 !== w1) {
    if (r2 === undefined) return null // need trick 3
    const w2 = r2 === 'tie' ? null : r2
    // After trick 3:
    if (w2) return w2
    // All 3 tied → mano wins
    return manoId ?? null
  }

  return null
}

/**
 * Fuerza de una mano para las decisiones de la IA.
 * byStrength: ordenada de más fuerte a más débil (power menor = más fuerte).
 * strongCount: cartas "top" (anchos, 7 de espada/oro, 3 y 2 → power <= 6).
 */
function handStrength(hand: Card[]) {
  const byStrength = [...hand].sort((a, b) => a.power - b.power)
  return {
    best: byStrength[0]?.power ?? 99,
    strongCount: hand.filter((c) => c.power <= 6).length,
    byStrength,
    byWeakness: [...hand].sort((a, b) => b.power - a.power),
  }
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  gameState: null,
  isPlaying: false,
  isDealing: true,

  startGame: (players, targetPoints = 15) => {
    set({ gameState: createInitialState(players, targetPoints), isPlaying: true, isDealing: true })
  },

  finishDealing: () => set({ isDealing: false }),
  resetGame: () => set({ gameState: null, isPlaying: false, isDealing: true }),
  clearBotToast: () => set((s) => s.gameState ? { gameState: { ...s.gameState, botToast: undefined } } : s),

  continueAfterHandResult: () => {
    set((state) => {
      const gs = state.gameState
      if (!gs || gs.gamePhase !== 'hand_result' || !gs.pendingDeal) return state
      const { leaderIndex, gs: base } = gs.pendingDeal
      const nextState = dealNewHand(base, leaderIndex)
      return { gameState: nextState, isDealing: !nextState.winner }
    })
  },

  playCard: (playerId, card) => {
    set((state) => {
      if (!state.gameState) return state
      const gs = state.gameState
      if (gs.currentTurn !== playerId || gs.gamePhase !== 'playing') return state

      const pi = gs.players.findIndex((p) => p.userId === playerId)
      const hi = gs.hands[pi].findIndex((c) => c.suit === card.suit && c.rank === card.rank)
      if (hi === -1) return state

      const newHands = gs.hands.map((h, i) =>
        i === pi ? h.filter((_, j) => j !== hi) : [...h],
      )

      // Mark card as played in current mano
      const newManos = gs.manos.map((mn, i) =>
        i === gs.currentManoIndex
          ? { ...mn, cards: mn.cards.map((c) => c.playerId === playerId ? { ...c, card, played: true } : c) }
          : mn,
      )

      const playedCount = newManos[gs.currentManoIndex].cards.filter((c) => c.played).length
      let manoIdx = gs.currentManoIndex
      const puntos = { ...gs.puntos }
      let winner = gs.winner
      let nextPi = (pi + 1) % gs.players.length   // default: other player goes next
      let tricks = gs.tricksPlayedThisHand
      const msgs: GameMessage[] = [
        ...gs.messages,
        msg('info', `${gs.players[pi].username} jugó ${card.rank} de ${card.suit}`, playerId),
      ]

      // All players have played this trick → resolve it
      if (playedCount === gs.players.length) {
        const playedCards = newManos[manoIdx].cards.filter(
          (c) => c.card && c.played,
        ) as { playerId: string; card: Card }[]

        const trickWinner = determineManoWinner(playedCards)
        newManos[manoIdx] = { ...newManos[manoIdx], winner: trickWinner ?? undefined }
        tricks++

        if (trickWinner && trickWinner !== 'tie') {
          const wName = gs.players.find((p) => p.userId === trickWinner)?.username
          msgs.push(msg('success', `¡${wName} gana la baza ${manoIdx + 1}!`))
          nextPi = gs.players.findIndex((p) => p.userId === trickWinner)
        } else {
          msgs.push(msg('info', `Baza ${manoIdx + 1} parda (empate).`))
          sayCall('¡Parda!')
          // On tie, mano player (preBidPlayerIndex at hand start) leads next trick
          nextPi = gs.preBidPlayerIndex
        }

        // Check if hand is already decided (correct Truco rules)
        const handWinnerId = evaluateHandWinner(newManos, gs.players, gs.preBidPlayerIndex)

        if (handWinnerId) {
          // Hand is decided — award points
          const pts = getTrucoPoints(gs.trucoLevel)
          puntos[handWinnerId] = (puntos[handWinnerId] || 0) + pts
          const wName = gs.players.find((p) => p.userId === handWinnerId)?.username
          msgs.push(msg('success', `¡${wName} gana la mano! (+${pts} pt${pts !== 1 ? 's' : ''})`))
          sayCall(`¡${wName} gana la mano!`, { excited: true })

          if (puntos[handWinnerId] >= gs.targetPoints) {
            winner = handWinnerId
            // Game won
            return {
              gameState: {
                ...gs, hands: newHands, manos: newManos, puntos, winner,
                tricksPlayedThisHand: tricks,
                currentTurn: gs.players[nextPi]?.userId ?? gs.currentTurn,
                gamePhase: 'finished', messages: msgs,
                handResult: undefined, pendingDeal: undefined,
              },
            }
          }

          // La mano terminó: se muestran las cartas ganadoras/perdedoras en la
          // mesa ~2s (fase 'hand_result') y DESPUÉS se reparte la mano nueva.
          const winnerPi = gs.players.findIndex((p) => p.userId === handWinnerId)
          return {
            gameState: {
              ...gs, hands: newHands, manos: newManos, puntos, winner: null,
              tricksPlayedThisHand: tricks,
              currentTurn: '', currentPlayerIndex: winnerPi,
              gamePhase: 'hand_result',
              handResult: { winnerId: handWinnerId, points: pts, reason: 'mano' },
              pendingDeal: {
                leaderIndex: winnerPi,
                gs: { ...gs, hands: newHands, manos: newManos, puntos, messages: msgs },
              },
              messages: msgs,
            },
            isDealing: false,
          }
        }

        // Hand not decided yet → advance to next trick
        manoIdx = Math.min(manoIdx + 1, 2)
      }

      // Normal state update (trick not yet complete, or hand not decided)
      return {
        gameState: {
          ...gs, hands: newHands, manos: newManos,
          currentManoIndex: manoIdx,
          currentPlayerIndex: nextPi,
          puntos, winner,
          tricksPlayedThisHand: tricks,
          currentTurn: gs.players[nextPi]?.userId ?? gs.currentTurn,
          gamePhase: winner ? 'finished' : 'playing',
          messages: msgs,
        },
      }
    })
  },

  callTruco: (playerId, level) => {
    set((state) => {
      if (!state.gameState) return state
      const gs = state.gameState
      const ci = gs.players.findIndex((p) => p.userId === playerId)
      const ri = (ci + 1) % gs.players.length
      const lvl = ['', 'Truco', 'Retruco', '¡Vale Cuatro!'][level]
      sayCall(`¡${lvl}!`, { excited: true })
      return {
        gameState: {
          ...gs,
          trucoLevel: level, trucoCaller: playerId, gamePhase: 'truco',
          currentTurn: gs.players[ri].userId, currentPlayerIndex: ri,
          preBidPlayerIndex: ci,
          botToast: undefined,
          messages: [...gs.messages, msg('warning', `¡${gs.players[ci]?.username} canta ${lvl}!`, playerId)],
        },
      }
    })
  },

  acceptTruco: (playerId) => {
    set((state) => {
      if (!state.gameState) return state
      const gs = state.gameState
      const callerI = gs.trucoCaller
        ? gs.players.findIndex((p) => p.userId === gs.trucoCaller)
        : gs.preBidPlayerIndex
      const resumeI = callerI >= 0 ? callerI : 0
      const acceptorIsBot = gs.players.find((p) => p.userId === playerId)?.isBot
      sayCall('¡Quiero!')
      return {
        gameState: {
          ...gs,
          trucoLevel: gs.trucoLevel || 1, gamePhase: 'playing',
          currentTurn: gs.players[resumeI].userId, currentPlayerIndex: resumeI,
          botToast: acceptorIsBot ? toast('¡Quiero! ⚔️', '#f59e0b') : gs.botToast,
          messages: [...gs.messages, msg('success', `${gs.players.find((p) => p.userId === playerId)?.username}: ¡Quiero!`, playerId)],
        },
      }
    })
  },

  rejectTruco: (playerId) => {
    set((state) => {
      if (!state.gameState) return state
      const gs = state.gameState
      const callerId = gs.trucoCaller
      const puntos = { ...gs.puntos }
      const acceptorIsBot = gs.players.find((p) => p.userId === playerId)?.isBot
      if (callerId) {
        const pts = gs.trucoLevel > 1 ? getTrucoPoints(gs.trucoLevel - 1) : 1
        puntos[callerId] = (puntos[callerId] || 0) + pts
        const callerName = gs.players.find((p) => p.userId === callerId)?.username
        const gw = puntos[callerId] >= gs.targetPoints ? callerId : null
        const logMsg = msg('error',
          `${gs.players.find((p) => p.userId === playerId)?.username}: ¡No Quiero! ${callerName} gana ${pts} pt${pts !== 1 ? 's' : ''}. La ronda termina.`,
          playerId)
        sayCall('¡No quiero!')
        if (gw) {
          return {
            gameState: {
              ...gs, puntos, winner: gw, gamePhase: 'finished',
              botToast: acceptorIsBot ? toast('¡No Quiero! 🚫', '#ef4444') : gs.botToast,
              messages: [...gs.messages, logMsg],
              handResult: undefined, pendingDeal: undefined,
            },
          }
        }
        // Al no querer el truco la RONDA TERMINA: se muestra un instante el
        // resultado y después se reparte la mano nueva, liderada por quien cobró.
        const callerPi = gs.players.findIndex((p) => p.userId === callerId)
        return {
          gameState: {
            ...gs, puntos, winner: null,
            currentTurn: '', currentPlayerIndex: callerPi,
            gamePhase: 'hand_result',
            handResult: { winnerId: callerId, points: pts, reason: 'no-quiero' },
            pendingDeal: {
              leaderIndex: callerPi,
              gs: { ...gs, puntos, messages: [...gs.messages, logMsg] },
            },
            messages: [...gs.messages, logMsg],
            botToast: acceptorIsBot ? toast('¡No Quiero! 🚫', '#ef4444') : gs.botToast,
          },
          isDealing: false,
        }
      }
      return state
    })
  },

  callEnvido: (playerId, type) => {
    set((state) => {
      if (!state.gameState) return state
      const gs = state.gameState
      // El envido solo se puede cantar durante la PRIMERA baza y antes de que
      // se juegue la segunda carta (regla estándar: permitido con 0 o 1 carta
      // en mesa, prohibido una vez que ambos tiraron / la 1ª baza se completó).
      if (gs.envidoResolved || gs.tricksPlayedThisHand > 0 || gs.currentManoIndex > 0) return state
      // Si hay flor en juego, el envido no se puede cantar (la flor lo bloquea)
      if (hasFlorInPlay(gs)) return state
      const ci = gs.players.findIndex((p) => p.userId === playerId)
      const ri = (ci + 1) % gs.players.length
      const isFirst = gs.envidoLevel === 0

      // Montos (querido / no querido) según el canto:
      //  Envido:           2 querido, 1 no querido
      //  Envido repetido:  +2 (doble = 4 querido), 2 no querido
      //  Real Envido:      +3, 1 no querido
      //  Falta Envido:     resto (se calcula al resolver), 1 no querido
      let lvl: EnvidoLevel
      let acc: number
      let noQuiero: number
      let label: string
      if (type === 'falta') {
        lvl = 3
        acc = 0
        noQuiero = 1
        label = 'Falta Envido'
      } else if (type === 'real') {
        lvl = 2
        acc = (isFirst ? 0 : gs.envidoAccumulated) + 3
        noQuiero = 1
        label = 'Real Envido'
      } else if (isFirst) {
        lvl = 1
        acc = 2
        noQuiero = 1
        label = 'Envido'
      } else {
        // Envido repetido (doble envido)
        lvl = Math.max(gs.envidoLevel, 2) as EnvidoLevel
        acc = gs.envidoAccumulated + 2
        noQuiero = 2
        label = 'Envido'
      }

      sayCall(`¡${label}!`, { excited: true })
      return {
        gameState: {
          ...gs,
          envidoLevel: lvl, envidoCaller: playerId, gamePhase: 'envido',
          envidoAccumulated: acc, envidoLastCall: type, envidoNoQuiero: noQuiero,
          currentTurn: gs.players[ri].userId, currentPlayerIndex: ri,
          preBidPlayerIndex: ci,
          botToast: undefined,
          messages: [...gs.messages, msg('warning', `¡${gs.players[ci]?.username} canta ${label}!`, playerId)],
        },
      }
    })
  },

  callFlor: (playerId) => {
    set((state) => {
      if (!state.gameState) return state
      const gs = state.gameState
      const pi = gs.players.findIndex((p) => p.userId === playerId)
      if (pi < 0) return state
      // Solo en el turno propio, durante la primera baza y si aún no se cantó.
      // La flor suma 3 puntos al instante; no hay "quiero / no quiero".
      if (gs.gamePhase !== 'playing' || gs.currentTurn !== playerId || gs.florSung) return state
      if (gs.tricksPlayedThisHand > 0 || gs.currentManoIndex > 0) return state
      if (!hasFlor(gs.hands[pi])) return state
      const puntos = { ...gs.puntos }
      puntos[playerId] = (puntos[playerId] || 0) + 3
      const messages = [...gs.messages, msg('success', `🌸 ¡${gs.players[pi].username} canta Flor! +3 pts`, playerId)]
      sayCall('¡Flor!', { excited: true })
      const winner = gs.players.find((p) => (puntos[p.userId] || 0) >= gs.targetPoints)?.userId ?? null
      return {
        gameState: {
          ...gs, puntos, messages, florSung: true, winner,
          gamePhase: winner ? 'finished' : gs.gamePhase,
        },
      }
    })
  },

  acceptEnvido: (playerId) => {
    set((state) => {
      if (!state.gameState) return state
      const gs = state.gameState
      const callerI = gs.envidoCaller
        ? gs.players.findIndex((p) => p.userId === gs.envidoCaller)
        : gs.preBidPlayerIndex
      const resumeI = callerI >= 0 ? callerI : 0
      const acceptorIsBot = gs.players.find((p) => p.userId === playerId)?.isBot
      sayCall('¡Quiero!')
      return {
        gameState: {
          ...gs, gamePhase: 'envido_points',
          currentTurn: gs.players[resumeI].userId, currentPlayerIndex: resumeI,
          botToast: acceptorIsBot ? toast('¡Quiero! 🃏', '#60a5fa') : gs.botToast,
          messages: [...gs.messages, msg('success', `${gs.players.find((p) => p.userId === playerId)?.username}: ¡Quiero!`, playerId)],
        },
      }
    })
  },

  rejectEnvido: (playerId) => {
    set((state) => {
      if (!state.gameState) return state
      const gs = state.gameState
      const callerId = gs.envidoCaller
      const puntos = { ...gs.puntos }
      const acceptorIsBot = gs.players.find((p) => p.userId === playerId)?.isBot
      if (callerId) {
        // No quiero: el que cantó se lleva el monto "en pie" (envido=1,
        // doble envido=2, real=1, falta=1), calculado al momento del canto
        const pts = gs.envidoNoQuiero || 1
        puntos[callerId] = (puntos[callerId] || 0) + pts
        const callerName = gs.players.find((p) => p.userId === callerId)?.username
        const gw = puntos[callerId] >= gs.targetPoints ? callerId : null
        const resumeI = gs.preBidPlayerIndex
        sayCall('¡No quiero!')
        return {
          gameState: {
            ...gs, puntos, winner: gw, envidoResolved: true,
            gamePhase: gw ? 'finished' : 'playing',
            currentTurn: gs.players[resumeI].userId, currentPlayerIndex: resumeI,
            botToast: acceptorIsBot ? toast('¡No Quiero! 🚫', '#ef4444') : gs.botToast,
            messages: [...gs.messages, msg('error',
              `${gs.players.find((p) => p.userId === playerId)?.username}: ¡No Quiero! ${callerName} +${pts} pt.`,
              playerId)],
          },
        }
      }
      return state
    })
  },

  announceEnvidoPoints: (playerId, isSonBuenas) => {
    set((state) => {
      if (!state.gameState) return state
      const gs = state.gameState
      const pi = gs.players.findIndex((p) => p.userId === playerId)
      const oi = (pi + 1) % gs.players.length
      const myEnvido = calculateEnvido(gs.hands[pi])

      if (gs.envidoPointsCall) {
        // Second player responds
        const callerPts = gs.envidoPointsCall.points
        const myPts = myEnvido.value
        const winnerId = isSonBuenas
          ? gs.envidoPointsCall.playerId
          : (myPts >= callerPts ? playerId : gs.envidoPointsCall.playerId)
        const msgTxt = isSonBuenas
          ? `${gs.players[pi].username}: "Son buenas" (tenía ${myPts})`
          : `${gs.players[pi].username}: "Tengo ${myPts}" — ${myPts >= callerPts ? '¡Gana!' : 'Son buenas las del rival'}`

        const puntos = { ...gs.puntos }
        // Falta envido: vale lo que le falta al que canta para llegar al objetivo
        // (si el cantor va ganando, eso es justo lo que le falta al líder; en ambos
        // casos es target - puntos del cantor). El resto de los niveles usa el monto
        // acumulado por las escaladas (Envido=2, Real Envido=3, y se suman).
        const callerScore = puntos[gs.envidoCaller || ''] || 0
        const pts = gs.envidoLastCall === 'falta'
          ? getEnvidoPoints(3, gs.targetPoints, callerScore)
          : gs.envidoAccumulated
        puntos[winnerId] = (puntos[winnerId] || 0) + pts
        const gw = puntos[winnerId] >= gs.targetPoints ? winnerId : null
        const resumeI = gs.preBidPlayerIndex
        // El que responde canta sus puntos en el mensaje visible ("El Bot: Tengo 27 —
        // ¡Gana!"). El audio anuncia al ganador (cortaría el "Tengo" si se dijera acá).
        sayCall(`¡Gano el envido! +${pts}`, { excited: true })

        return {
          gameState: {
            ...gs, puntos, winner: gw, envidoResolved: true,
            envidoPointsCall: undefined,
            gamePhase: gw ? 'finished' : 'playing',
            currentTurn: gs.players[resumeI].userId, currentPlayerIndex: resumeI,
            messages: [
              ...gs.messages,
              msg('info', msgTxt, playerId),
              msg('success', `${gs.players.find((p) => p.userId === winnerId)?.username} gana el envido (+${pts})`),
            ],
          },
        }
      } else {
        // First player announces
        sayCall(`Tengo ${myEnvido.value}`)
        return {
          gameState: {
            ...gs,
            envidoPointsCall: { playerId, points: myEnvido.value },
            currentTurn: gs.players[oi].userId, currentPlayerIndex: oi,
            messages: [...gs.messages, msg('info', `${gs.players[pi].username}: "Tengo ${myEnvido.value}"`, playerId)],
          },
        }
      }
    })
  },

  goToDeck: (playerId) => {
    set((state) => {
      if (!state.gameState) return state
      const gs = state.gameState
      const name = gs.players.find((p) => p.userId === playerId)?.username || 'Jugador'
      const opp = gs.players.find((p) => p.userId !== playerId)
      const puntos = { ...gs.puntos }
      // El rival se lleva el valor actual de la mano (1 si no se cantó truco)
      const pts = getTrucoPoints(gs.trucoLevel)
      if (opp) puntos[opp.userId] = (puntos[opp.userId] || 0) + pts
      const gw = opp && puntos[opp.userId] >= gs.targetPoints ? opp.userId : null
      const logMsg = msg('info', `${name} se fue al mazo. ${opp?.username ?? ''} +${pts} pt${pts !== 1 ? 's' : ''}.`, playerId)
      if (gw) {
        return {
          gameState: {
            ...gs, puntos, winner: gw, gamePhase: 'finished',
            messages: [...gs.messages, logMsg],
            handResult: undefined, pendingDeal: undefined,
          },
        }
      }
      // El rival se fue al mazo: se muestra el resultado y después se reparte
      // la mano nueva, liderada por quien ganó los puntos.
      const oppPi = opp ? gs.players.findIndex((p) => p.userId === opp.userId) : 0
      return {
        gameState: {
          ...gs, puntos, winner: null,
          currentTurn: '', currentPlayerIndex: oppPi,
          gamePhase: 'hand_result',
          handResult: { winnerId: opp?.userId ?? '', points: pts, reason: 'mazo' },
          pendingDeal: {
            leaderIndex: oppPi,
            gs: { ...gs, puntos, messages: [...gs.messages, logMsg] },
          },
          messages: [...gs.messages, logMsg],
        },
        isDealing: false,
      }
    })
  },

  botPlay: () => {
    const s = get()
    if (!s.gameState || !s.isPlaying || s.isDealing) return

    // Guard: si la partida ya terminó no hay nada que jugar (evita loops de timers)
    const gs = s.gameState
    if (gs.gamePhase === 'finished' || gs.winner) return
    // Fase de resultado de mano: nadie juega hasta repartir la mano nueva
    if (gs.gamePhase === 'hand_result') return

    // Guard: only schedule if the bot is actually the current player right now
    const currentPlayer = gs.players.find((p) => p.userId === gs.currentTurn)
    if (!currentPlayer?.isBot) return

    // Delay visible pero pausado: el humano alcanza a ver el "Pensando..."
    // y la carta del bot antes de que juegue la siguiente.
    const delay = gs.gamePhase === 'playing' ? 1300 : 1000

    setTimeout(() => {
      // Re-read fresh state inside the timeout — stale state from closure is the #1 bug
      const fresh = get()
      if (!fresh.gameState || !fresh.isPlaying || fresh.isDealing) return

      const fgs = fresh.gameState

      // Guard again after delay: verify it's STILL the bot's turn
      const botId = fgs.currentTurn
      const bi = fgs.players.findIndex((p) => p.userId === botId)
      if (!fgs.players[bi]?.isBot) return

      const hand = fgs.hands[bi]
      if (!hand) return
      // OJO: NO se puede salir acá con hand vacía — el bot puede tener que
      // RESPONDER un truco/envido sin cartas (p.ej. el humano canta truco en
      // la baza decisiva cuando el bot ya jugó sus 3 cartas). Solo el branch
      // de 'playing' (jugar carta) necesita cartas.

      const humanId = fgs.players.find((p) => !p.isBot)?.userId ?? ''
      const myScore = fgs.puntos[botId] || 0
      const oppScore = fgs.puntos[humanId] || 0

      // ── envido_points: bot announces or responds ─────────
      if (fgs.gamePhase === 'envido_points') {
        // El bot SIEMPRE anuncia sus puntos ("Tengo 27") — nunca se achica
        // diciendo "Son buenas". Así el rival siempre ve el tanto del bot.
        get().announceEnvidoPoints(botId, false)
      }

      // ── envido: bot responds to human's envido call ──────
      else if (fgs.gamePhase === 'envido') {
        const ev = calculateEnvido(hand)
        const pWin = envidoWinProb(ev.value)
        const callerScore = fgs.puntos[fgs.envidoCaller || ''] || 0
        // Para la falta envido el monto es lo que le falta al que canta;
        // para el resto, los puntos acumulados por las escaladas.
        const stake = fgs.envidoLevel === 3
          ? fgs.targetPoints - callerScore
          : fgs.envidoAccumulated
        const trailing = myScore < oppScore
        const farAhead = myScore >= oppScore + 5

        if (fgs.envidoLevel === 3) {
          // Falta envido: aceptar solo con mano muy buena o monto chico
          if (pWin >= 0.62 || (stake <= 3 && pWin >= 0.5)) get().acceptEnvido(botId)
          else get().rejectEnvido(botId)
        } else if (!farAhead && ev.value >= 26 && Math.random() < 0.5) {
          // Escalada: doble envido (si ya se cantó uno) o real envido
          const raise: 'envido' | 'real' =
            fgs.envidoLevel === 2 ? 'real' : (Math.random() < 0.5 ? 'envido' : 'real')
          get().callEnvido(botId, raise)
        } else {
          // Valor esperado de aceptar = (2P - 1) * monto. Si es positivo
          // (o vamos perdiendo y necesitamos puntos) conviene aceptar.
          const evAccept = (2 * pWin - 1) * stake
          const accept = pWin >= 0.9
            || (evAccept > 0 && (pWin >= 0.5 || trailing))
            || (stake <= 2 && pWin >= 0.5)
          if (accept) get().acceptEnvido(botId)
          else get().rejectEnvido(botId)
        }
      }

      // ── truco: bot responds to human's truco call ────────
      else if (fgs.gamePhase === 'truco') {
        const { best, strongCount } = handStrength(hand)
        const botWins = fgs.manos.filter((m, i) => i < fgs.currentManoIndex && m.winner === botId).length
        const humanWins = fgs.manos.filter((m, i) => i < fgs.currentManoIndex && m.winner === humanId).length
        const rnd = Math.random()
        const leading = myScore >= oppScore + 5
        const trailing = oppScore >= myScore + 5
        if (fgs.trucoLevel < 3 && strongCount >= 2 && best <= 4 && rnd < 0.45) {
          // Mano muy fuerte: subir la apuesta
          get().callTruco(botId, (fgs.trucoLevel + 1) as TrucoLevel)
        } else if (botWins >= 1 || strongCount >= 2 || (trailing && strongCount >= 1)) {
          // Ya ganó una baza, mano fuerte, o va perdiendo con algo de mano: aceptar
          get().acceptTruco(botId)
        } else if (leading && strongCount <= 1) {
          // Va muy arriba: no regalar puntos al rival
          get().rejectTruco(botId)
        } else if (strongCount === 1) {
          // Una carta fuerte: decisión 50/50
          if (rnd < 0.5) get().acceptTruco(botId)
          else get().rejectTruco(botId)
        } else if (humanWins >= 1) {
          // Sin cartas fuertes y el rival ya ganó una baza: rechazar
          get().rejectTruco(botId)
        } else if (rnd < 0.3) {
          get().acceptTruco(botId)
        } else {
          get().rejectTruco(botId)
        }
      }

      // ── playing: bot's turn to play or call ─────────────
      else if (fgs.gamePhase === 'playing') {
        if (hand.length === 0) return // sin cartas no puede jugar (ni cantar)
        const ev = calculateEnvido(hand)
        const { best, strongCount, byStrength, byWeakness } = handStrength(hand)

        // ── Flor: si el bot tiene flor la canta apenas puede (turno propio,
        //    primera baza). Suma 3 pts al instante y bloquea el envido de la mano.
        const sangFlor = !fgs.florSung && fgs.tricksPlayedThisHand === 0 && fgs.currentManoIndex === 0 && hasFlor(hand)
        if (sangFlor) {
          // La flor NO cambia el turno: la cadena de abajo re-dispara botPlay con
          // su delay y el bot juega su carta. El resto (envido/truco/carta) se
          // saltea este tick para que haya pausa entre el canto y la carta.
          get().callFlor(botId)
        }

        // Resto de decisiones: solo si no cantó flor en este tick.
        if (!sangFlor) {
        // Antes de la primera baza: quizá cantar envido (solo si aún se puede
        // y no hay flor en juego)
        if (
          !fgs.envidoResolved &&
          fgs.envidoLevel === 0 &&
          fgs.tricksPlayedThisHand === 0 &&
          !fgs.players.some((_, i) => hasFlor(fgs.hands[i])) &&
          ev.value >= 20
        ) {
          const prob = ev.value >= 28 ? 0.75 : ev.value >= 24 ? 0.55 : 0.3
          let type: 'envido' | 'real' | 'falta' = 'envido'
          // Falta envido solo conviene si vamos perdiendo o empatados (monto grande)
          if (ev.value >= 28 && myScore <= oppScore) type = 'falta'
          else if (ev.value >= 24) type = 'real'
          if (Math.random() < prob) {
            get().callEnvido(botId, type)
            return
          }
        }

        // Quizá cantar Truco: depende de la fuerza de la mano y la posición
        if (fgs.trucoLevel === 0) {
          const botWins = fgs.manos.filter((m, i) => i < fgs.currentManoIndex && m.winner === botId).length
          const closeToWin = myScore >= fgs.targetPoints - 4
          let shouldCall = false
          if (strongCount >= 2) shouldCall = Math.random() < 0.6        // dos cartas top
          else if (best <= 4 && strongCount >= 1) shouldCall = Math.random() < 0.4  // tiene un ancho o 7 de espada
          else if (botWins >= 1 && strongCount >= 1) shouldCall = Math.random() < 0.4  // ya ganó una baza
          else if (closeToWin && strongCount >= 1) shouldCall = Math.random() < 0.4  // a punto de ganar la partida
          if (shouldCall) {
            get().callTruco(botId, 1)
            return
          }
        }

        // ── Card selection ─────────────────────────────────
        const curMano = fgs.manos[fgs.currentManoIndex]
        const playedSoFar = curMano.cards.filter((c) => c.played && c.card)
        const trickIndex = fgs.currentManoIndex  // 0=first trick, 1=second, 2=third

        const botWins = fgs.manos.filter((mn, i) => i < trickIndex && mn.winner === botId).length
        const humanWins = fgs.manos.filter((mn, i) => i < trickIndex && mn.winner === humanId).length

        // Esta baza decide la mano si:
        //  - es la 3ª (solo se llega a ella con 1-1), o
        //  - es la 2ª y la 1ª fue parda ("1ª parda → decide la 2ª")
        const firstTwoWinners = fgs.manos.slice(0, trickIndex).map((m) => m.winner)
        const trickDecidesHand =
          trickIndex === 2 ||
          (trickIndex === 1 && firstTwoWinners[0] === 'tie')

        let cardToPlay: Card

        if (playedSoFar.length > 0) {
          // El humano ya jugó — responder
          const humanCard = playedSoFar.find((c) => c.playerId !== botId)?.card
          if (humanCard) {
            const winningCards = byWeakness.filter((c) => c.power < humanCard.power)
            if (winningCards.length > 0) {
              // Ganar la baza con la carta más débil que alcance (conserva las fuertes)
              cardToPlay = winningCards[0]
            } else {
              // No puede ganar la baza. Si empatar LE DA LA MANO (ganó la 1ª baza
              // y esta es la 2ª: "ganás la 1ª y empatás la 2ª → ganás la mano"),
              // juega la carta del mismo poder para forzar la parda en vez de
              // regalar una carta fuerte.
              const tieCard = hand.find((c) => c.power === humanCard.power)
              const tieWinsHand = botWins >= 1 && trickIndex === 1
              if (tieCard && tieWinsHand) {
                cardToPlay = tieCard
              } else {
                // No puede ganar: tirar la más débil y guardar las fuertes
                cardToPlay = byWeakness[0]
              }
            }
          } else {
            cardToPlay = byWeakness[0]
          }
        } else if (trickDecidesHand) {
          // La baza define la mano: jugar la carta más fuerte
          cardToPlay = byStrength[0]
        } else if (trickIndex === 0) {
          // Primera baza: con mano muy fuerte largar la más débil (conserva el par
          // de cartas top para las bazas 2 y 3); si no, una del medio
          cardToPlay = strongCount >= 2 ? byWeakness[0] : byStrength[Math.min(1, byStrength.length - 1)]
        } else if (humanWins >= 1) {
          // El humano ya ganó una baza: no puede perder esta
          cardToPlay = byStrength[0]
        } else if (botWins >= 1) {
          // Ya va ganando la mano: no arriesgar cartas fuertes
          cardToPlay = byWeakness[0]
        } else {
          cardToPlay = byStrength[Math.min(1, byStrength.length - 1)]
        }

        get().playCard(botId, cardToPlay)
        }
      }

      // ── Chain: si el bot conservó el turno (ganó la baza como segundo y juega
      //    primero la siguiente, o se repartió una mano nueva con el bot como mano),
      //    el useEffect NO se vuelve a disparar porque currentTurn no cambió.
      //    Por eso se re-encadena botPlay acá, con su propio delay.
      const st = get()
      if (!st.gameState || !st.isPlaying || st.isDealing) return
      const stgs = st.gameState
      if (stgs.gamePhase === 'finished' || stgs.winner) return
      const tp = stgs.players.find((p) => p.userId === stgs.currentTurn)
      if (tp?.isBot) get().botPlay()
    }, delay)
  },
}))
