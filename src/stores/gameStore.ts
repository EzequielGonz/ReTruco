import { create } from 'zustand'
import type { Card, Player, GameState, GameMessage } from '../types'
import {
  createDeck, shuffleDeck, dealCards,
  calculateEnvido, hasFlor, determineManoWinner,
  getCardPower, getTrucoPoints, getEnvidoPoints, getEnvidoNoQuieroPoints, getFlorPoints,
} from '../utils/trucoRules'

type TrucoLevel = 0 | 1 | 2 | 3
type EnvidoLevel = 0 | 1 | 2 | 3
type FlorLevel = 0 | 1 | 2

interface GameStoreState {
  gameState: GameState | null
  isPlaying: boolean
  isDealing: boolean
  startGame: (players: Player[], targetPoints?: number) => void
  playCard: (playerId: string, card: Card) => void
  callTruco: (playerId: string, level: TrucoLevel) => void
  acceptTruco: (playerId: string) => void
  rejectTruco: (playerId: string) => void
  callEnvido: (playerId: string, level: EnvidoLevel) => void
  acceptEnvido: (playerId: string) => void
  rejectEnvido: (playerId: string) => void
  announceEnvidoPoints: (playerId: string, isSonBuenas: boolean) => void
  callFlor: (playerId: string, level: FlorLevel) => void
  acceptFlor: (playerId: string) => void
  rejectFlor: (playerId: string) => void
  goToDeck: (playerId: string) => void
  resetGame: () => void
  botPlay: () => void
  finishDealing: () => void
  clearBotToast: () => void
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

function createInitialState(players: Player[], targetPoints: number): GameState {
  const { deck, hands } = buildHands(players)
  const messages: GameMessage[] = []
  players.forEach((p, i) => {
    if (hasFlor(hands[i])) messages.push(msg('info', `¡${p.username} tiene Flor!`))
  })
  return {
    tableId: crypto.randomUUID(),
    players, deck, hands,
    manos: freshManos(players),
    currentManoIndex: 0,
    currentPlayerIndex: 0,       // index of "mano" player (leads first trick)
    preBidPlayerIndex: 0,
    trucoLevel: 0, envidoLevel: 0, florLevel: 0,
    trucoCaller: null, envidoCaller: null, florCaller: null,
    envidoResolved: false, tricksPlayedThisHand: 0,
    gamePhase: 'playing',
    envidoPointsCall: undefined,
    botToast: undefined,
    currentTurn: players[0].userId,
    puntos: Object.fromEntries(players.map((p) => [p.userId, 0])),
    targetPoints, winner: null, messages,
  }
}

function dealNewHand(gs: GameState, leaderIndex: number): GameState {
  const { deck, hands } = buildHands(gs.players)
  const messages: GameMessage[] = [...gs.messages, msg('info', '── Nueva mano ──')]
  gs.players.forEach((p, i) => {
    if (hasFlor(hands[i])) messages.push(msg('info', `¡${p.username} tiene Flor!`))
  })
  const next = leaderIndex >= 0 && leaderIndex < gs.players.length ? leaderIndex : 0
  return {
    ...gs, deck, hands, messages,
    manos: freshManos(gs.players),
    currentManoIndex: 0,
    currentPlayerIndex: next, preBidPlayerIndex: next,
    trucoLevel: 0, envidoLevel: 0, florLevel: 0,
    trucoCaller: null, envidoCaller: null, florCaller: null,
    envidoResolved: false, tricksPlayedThisHand: 0,
    gamePhase: 'playing',
    envidoPointsCall: undefined,
    botToast: undefined,
    currentTurn: gs.players[next].userId,
    winner: null,
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

          if (puntos[handWinnerId] >= gs.targetPoints) {
            winner = handWinnerId
          }

          if (!winner) {
            // Deal new hand — winner of this hand leads next
            const winnerPi = gs.players.findIndex((p) => p.userId === handWinnerId)
            return { gameState: dealNewHand({ ...gs, hands: newHands, manos: newManos, puntos, messages: msgs }, winnerPi) }
          }
          // Game won
          return {
            gameState: {
              ...gs, hands: newHands, manos: newManos, puntos, winner,
              tricksPlayedThisHand: tricks,
              currentTurn: gs.players[nextPi]?.userId ?? gs.currentTurn,
              gamePhase: 'finished', messages: msgs,
            },
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
        const resumeI = gs.preBidPlayerIndex
        return {
          gameState: {
            ...gs, puntos, winner: gw,
            gamePhase: gw ? 'finished' : 'playing',
            currentTurn: gs.players[resumeI].userId, currentPlayerIndex: resumeI,
            botToast: acceptorIsBot ? toast('¡No Quiero! 🚫', '#ef4444') : gs.botToast,
            messages: [...gs.messages, msg('error',
              `${gs.players.find((p) => p.userId === playerId)?.username}: ¡No Quiero! ${callerName} gana ${pts} pt${pts !== 1 ? 's' : ''}.`,
              playerId)],
          },
        }
      }
      return state
    })
  },

  callEnvido: (playerId, level) => {
    set((state) => {
      if (!state.gameState) return state
      const gs = state.gameState
      if (gs.envidoResolved || gs.tricksPlayedThisHand > 0) return state
      const ci = gs.players.findIndex((p) => p.userId === playerId)
      const ri = (ci + 1) % gs.players.length
      const lvl = ['', 'Envido', 'Real Envido', 'Falta Envido'][level]
      return {
        gameState: {
          ...gs,
          envidoLevel: level, envidoCaller: playerId, gamePhase: 'envido',
          currentTurn: gs.players[ri].userId, currentPlayerIndex: ri,
          preBidPlayerIndex: ci,
          botToast: undefined,
          messages: [...gs.messages, msg('warning', `¡${gs.players[ci]?.username} canta ${lvl}!`, playerId)],
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
        const pts = getEnvidoNoQuieroPoints(gs.envidoLevel)
        puntos[callerId] = (puntos[callerId] || 0) + pts
        const callerName = gs.players.find((p) => p.userId === callerId)?.username
        const gw = puntos[callerId] >= gs.targetPoints ? callerId : null
        const resumeI = gs.preBidPlayerIndex
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
        // Falta envido: points = target - loser's current score
        const loserScore = puntos[playerId === winnerId
          ? (gs.envidoPointsCall.playerId)
          : playerId] || 0
        const pts = getEnvidoPoints(gs.envidoLevel || 1, gs.targetPoints, loserScore)
        puntos[winnerId] = (puntos[winnerId] || 0) + pts
        const gw = puntos[winnerId] >= gs.targetPoints ? winnerId : null
        const resumeI = gs.preBidPlayerIndex

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

  callFlor: (playerId, level) => {
    set((state) => {
      if (!state.gameState) return state
      const gs = state.gameState
      const ci = gs.players.findIndex((p) => p.userId === playerId)
      const ri = (ci + 1) % gs.players.length
      const lvl = level === 1 ? 'Flor' : 'Contra Flor'
      return {
        gameState: {
          ...gs, florLevel: level, florCaller: playerId, gamePhase: 'flor',
          currentTurn: gs.players[ri].userId, currentPlayerIndex: ri,
          preBidPlayerIndex: ci, botToast: undefined,
          messages: [...gs.messages, msg('warning', `¡${gs.players[ci]?.username} canta ${lvl}!`, playerId)],
        },
      }
    })
  },

  acceptFlor: (playerId) => {
    set((state) => {
      if (!state.gameState) return state
      const gs = state.gameState
      const pi = gs.players.findIndex((p) => p.userId === playerId)
      const oi = (pi + 1) % gs.players.length
      const hasMyFlor = hasFlor(gs.hands[pi])
      const winnerId = hasMyFlor ? playerId : gs.players[oi].userId
      const puntos = { ...gs.puntos }
      const pts = getFlorPoints(gs.florLevel || 1)
      puntos[winnerId] = (puntos[winnerId] || 0) + pts
      const gw = puntos[winnerId] >= gs.targetPoints ? winnerId : null
      const resumeI = gs.preBidPlayerIndex
      return {
        gameState: {
          ...gs, puntos, winner: gw,
          gamePhase: gw ? 'finished' : 'playing',
          currentTurn: gs.players[resumeI].userId, currentPlayerIndex: resumeI,
          messages: [...gs.messages, msg('success', `¡Flor aceptada! +${pts} pts`, playerId)],
        },
      }
    })
  },

  rejectFlor: (playerId) => {
    set((state) => {
      if (!state.gameState) return state
      const gs = state.gameState
      const callerId = gs.florCaller
      const puntos = { ...gs.puntos }
      if (callerId) {
        const pts = getFlorPoints(gs.florLevel || 1)
        puntos[callerId] = (puntos[callerId] || 0) + pts
      }
      const gw = callerId && puntos[callerId] >= gs.targetPoints ? callerId : null
      const resumeI = gs.preBidPlayerIndex
      return {
        gameState: {
          ...gs, puntos, winner: gw,
          gamePhase: gw ? 'finished' : 'playing',
          currentTurn: gs.players[resumeI].userId, currentPlayerIndex: resumeI,
          messages: [...gs.messages, msg('error', '¡No Quiero! Flor rechazada.', playerId)],
        },
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
      if (opp) puntos[opp.userId] = (puntos[opp.userId] || 0) + 1
      const gw = opp && puntos[opp.userId] >= gs.targetPoints ? opp.userId : null
      return {
        gameState: {
          ...gs, puntos, winner: gw,
          gamePhase: gw ? 'finished' : gs.gamePhase,
          messages: [...gs.messages, msg('info', `${name} se fue al mazo.`, playerId)],
        },
      }
    })
  },

  botPlay: () => {
    const s = get()
    if (!s.gameState || !s.isPlaying || s.isDealing) return

    // Guard: only schedule if the bot is actually the current player right now
    const gs = s.gameState
    const currentPlayer = gs.players.find((p) => p.userId === gs.currentTurn)
    if (!currentPlayer?.isBot) return

    // Use a short but visible delay so the human sees the "Pensando..." state
    const delay = gs.gamePhase === 'playing' ? 900 : 700

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
      if (!hand || hand.length === 0) return

      // ── envido_points: bot announces or responds ─────────
      if (fgs.gamePhase === 'envido_points') {
        const ev = calculateEnvido(hand)
        if (fgs.envidoPointsCall) {
          // Responding: son buenas if my score ≤ caller's score
          get().announceEnvidoPoints(botId, ev.value <= fgs.envidoPointsCall.points)
        } else {
          // Announcing first
          get().announceEnvidoPoints(botId, false)
        }
        return
      }

      // ── envido: bot responds to human's envido call ──────
      if (fgs.gamePhase === 'envido') {
        const ev = calculateEnvido(hand)
        if (ev.value >= 27 && fgs.envidoLevel < 3 && Math.random() > 0.45) {
          // Raise
          get().callEnvido(botId, (fgs.envidoLevel + 1) as EnvidoLevel)
        } else if (ev.value >= 20 && Math.random() > 0.35) {
          get().acceptEnvido(botId)
        } else {
          get().rejectEnvido(botId)
        }
        // Do NOT schedule botPlay here — useEffect will fire on the turn/phase change
        return
      }

      // ── flor: bot responds ───────────────────────────────
      if (fgs.gamePhase === 'flor') {
        if (hasFlor(hand) && Math.random() > 0.4) get().acceptFlor(botId)
        else get().rejectFlor(botId)
        return
      }

      // ── truco: bot responds to human's truco call ────────
      if (fgs.gamePhase === 'truco') {
        const strong = hand.filter((c) => c.power <= 6).length
        const rnd = Math.random()
        if (fgs.trucoLevel < 3 && strong >= 2 && rnd > 0.65) {
          // Raise — turn goes to human; useEffect will NOT re-fire for bot
          get().callTruco(botId, (fgs.trucoLevel + 1) as TrucoLevel)
        } else if (rnd > 0.3) {
          get().acceptTruco(botId)
        } else {
          get().rejectTruco(botId)
        }
        // Do NOT schedule botPlay here — useEffect handles it
        return
      }

      // ── playing: bot's turn to play or call ─────────────
      if (fgs.gamePhase === 'playing') {
        const ev = calculateEnvido(hand)

        // Before first trick: maybe call envido
        if (
          !fgs.envidoResolved &&
          fgs.envidoLevel === 0 &&
          fgs.tricksPlayedThisHand === 0 &&
          ev.value >= 20 &&
          Math.random() > 0.5
        ) {
          const lvl: EnvidoLevel = ev.value >= 28 ? 3 : ev.value >= 24 ? 2 : 1
          get().callEnvido(botId, lvl)
          return
        }

        // Maybe call Flor (before first trick)
        if (hasFlor(hand) && fgs.florLevel === 0 && fgs.tricksPlayedThisHand === 0 && Math.random() > 0.6) {
          get().callFlor(botId, 1)
          return
        }

        // Maybe call Truco (any time during playing)
        if (fgs.trucoLevel === 0 && Math.random() > 0.65) {
          get().callTruco(botId, 1)
          return
        }

        // ── Card selection: smarter strategy ────────────────
        // Sort by power ascending = strongest first (lower power # = stronger)
        const byStrength = [...hand].sort((a, b) => a.power - b.power)  // [0]=strongest
        const byWeakness = [...hand].sort((a, b) => b.power - a.power)  // [0]=weakest

        const curMano = fgs.manos[fgs.currentManoIndex]
        const playedSoFar = curMano.cards.filter((c) => c.played && c.card)
        const trickIndex = fgs.currentManoIndex  // 0=first trick, 1=second, 2=third

        // Evaluate hand position: did bot already win a trick?
        const botWins = fgs.manos.filter((mn, i) => i < trickIndex && mn.winner === botId).length
        const humanId = fgs.players.find((p) => !p.isBot)?.userId
        const humanWins = fgs.manos.filter((mn, i) => i < trickIndex && mn.winner === humanId).length

        let cardToPlay: Card

        if (playedSoFar.length > 0) {
          // Human already played — respond
          const humanCard = playedSoFar.find((c) => c.playerId !== botId)?.card
          if (humanCard) {
            // Find the weakest card that still beats human's card
            const winningCards = byWeakness.filter((c) => c.power < humanCard.power)

            if (winningCards.length > 0) {
              if (botWins >= 1) {
                // Already won one trick — use weakest possible winner (conserve strong cards)
                cardToPlay = winningCards[0]  // weakest winner
              } else {
                // Need this trick — use weakest winner
                cardToPlay = winningCards[0]
              }
            } else {
              // Can't win this trick — throw weakest card (save strong ones)
              cardToPlay = byWeakness[0]
            }
          } else {
            cardToPlay = byWeakness[0]
          }
        } else {
          // Bot plays first this trick
          if (trickIndex === 0) {
            // First trick: play a mid-strength card, save the best
            const mid = Math.min(1, byStrength.length - 1)
            cardToPlay = byStrength[mid]
          } else if (botWins >= 1) {
            // Already winning — play weakest to not waste strong cards
            cardToPlay = byWeakness[0]
          } else if (humanWins >= 1) {
            // Human winning — play strongest to recover
            cardToPlay = byStrength[0]
          } else {
            // Tied — play mid card
            const mid = Math.min(1, byStrength.length - 1)
            cardToPlay = byStrength[mid]
          }
        }

        get().playCard(botId, cardToPlay)
      }
    }, delay)
  },
}))
