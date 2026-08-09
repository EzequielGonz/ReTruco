import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, RotateCcw, Trophy, Volume2, VolumeX,
  Swords, Zap, Star, Shield, ChevronDown, ChevronUp, CheckCircle, XCircle
} from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'
import SpanishCard from '../../components/game/SpanishCard'
import CardHand from '../../components/game/CardHand'
import BotArea from '../../components/game/BotArea'
import type { Card } from '../../types'

// ── Score Tantos Dots ──────────────────────────────────────────
function TantosDots({ current, total, color }: { current: number; total: number; color: string }) {
  return (
    <div className="flex flex-wrap gap-1 justify-center max-w-[120px]">
      {Array.from({ length: Math.min(total, 30) }, (_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.03 }}
          className="w-2.5 h-2.5 rounded-full"
          style={{
            background: i < current ? color : 'rgba(255,255,255,0.08)',
            boxShadow: i < current ? `0 0 6px ${color}88` : 'none',
          }}
        />
      ))}
    </div>
  )
}

// ── Phase Badge ────────────────────────────────────────────────
function PhaseBadge({ phase, trucoLevel }: { phase: string; trucoLevel: number }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    playing: { label: '🎴 Jugando', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    truco: { label: '⚔️ ' + (['', 'Truco', 'Retruco', '¡Vale Cuatro!'][trucoLevel] || 'Truco'), color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    envido: { label: '🟢 Envido', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
    flor: { label: '🌸 Flor', color: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
    finished: { label: '🏆 Terminado', color: '#d4af37', bg: 'rgba(212,175,55,0.12)' },
  }
  const c = config[phase] || config.playing

  return (
    <motion.div
      key={phase + trucoLevel}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold"
      style={{ background: c.bg, border: `1px solid ${c.color}44`, color: c.color }}
    >
      {c.label}
    </motion.div>
  )
}

// ── Win/Lose Modal ─────────────────────────────────────────────
function ResultModal({
  winner,
  humanId,
  humanPoints,
  botPoints,
  onNewGame,
}: {
  winner: string
  humanId: string
  humanPoints: number
  botPoints: number
  onNewGame: () => void
}) {
  const isWin = winner === humanId

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-[100] p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
    >
      <motion.div
        initial={{ scale: 0.7, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="relative rounded-3xl p-10 text-center max-w-sm w-full overflow-hidden"
        style={{
          background: isWin
            ? 'linear-gradient(145deg, rgba(26,58,40,0.98), rgba(13,32,22,0.99))'
            : 'linear-gradient(145deg, rgba(40,15,15,0.98), rgba(20,8,8,0.99))',
          border: `2px solid ${isWin ? 'rgba(212,175,55,0.5)' : 'rgba(196,30,58,0.4)'}`,
          boxShadow: `0 40px 100px rgba(0,0,0,0.8), 0 0 60px ${isWin ? 'rgba(212,175,55,0.15)' : 'rgba(196,30,58,0.15)'}`,
        }}
      >
        {/* Glow BG */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center top, ${isWin ? 'rgba(212,175,55,0.1)' : 'rgba(196,30,58,0.1)'} 0%, transparent 60%)`,
          }}
        />

        {/* Trophy / Broken icon */}
        <motion.div
          animate={isWin ? { rotate: [0, -10, 10, -10, 10, 0] } : { x: [0, -5, 5, -5, 5, 0] }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-7xl mb-4 relative z-10"
        >
          {isWin ? '🏆' : '😔'}
        </motion.div>

        <h2
          className="text-3xl font-bold mb-2 relative z-10"
          style={{
            fontFamily: 'Playfair Display, serif',
            color: isWin ? 'var(--color-gold-light)' : '#fca5a5',
          }}
        >
          {isWin ? '¡GANASTE!' : '¡PERDISTE!'}
        </h2>
        <p className="mb-6 relative z-10" style={{ color: 'var(--color-text-muted)' }}>
          Puntos finales: <strong style={{ color: isWin ? 'var(--color-gold)' : '#fca5a5' }}>{humanPoints}</strong> — <strong style={{ color: 'rgba(240,230,211,0.5)' }}>{botPoints}</strong>
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNewGame}
          className="btn btn-gold w-full py-4 relative z-10"
        >
          <RotateCcw className="w-4 h-4" />
          Jugar de Nuevo
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ── Truco/Envido/Flor Action Modal ─────────────────────────────
function ActionModal({
  type,
  level,
  onAccept,
  onReject,
  onRaise,
  canRaise,
}: {
  type: 'truco' | 'envido' | 'flor'
  level: number
  onAccept: () => void
  onReject: () => void
  onRaise?: () => void
  canRaise?: boolean
}) {
  const labels: Record<string, string[]> = {
    truco: ['', 'Truco', 'Retruco', '¡Vale Cuatro!'],
    envido: ['', 'Envido', 'Real Envido', 'Falta Envido'],
    flor: ['', 'Flor', 'Contra Flor'],
  }
  const colors: Record<string, string> = {
    truco: '#f59e0b',
    envido: '#60a5fa',
    flor: '#c084fc',
  }

  const currentLabel = labels[type]?.[level] || labels[type]?.[1] || ''
  const color = colors[type] || '#d4af37'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="rounded-2xl p-6 text-center"
      style={{
        background: 'rgba(13,32,22,0.98)',
        border: `2px solid ${color}44`,
        boxShadow: `0 0 40px ${color}20, 0 20px 60px rgba(0,0,0,0.6)`,
      }}
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
        className="text-4xl mb-3"
      >
        {type === 'truco' ? '⚔️' : type === 'envido' ? '🃏' : '🌸'}
      </motion.div>
      <p className="text-xs tracking-widest mb-1" style={{ color: `${color}99`, letterSpacing: '0.2em' }}>
        EL BOT CANTÓ
      </p>
      <h3
        className="text-2xl font-bold mb-1"
        style={{ fontFamily: 'Playfair Display, serif', color }}
      >
        ¡{currentLabel}!
      </h3>
      <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
        ¿Qué respondés?
      </p>

      <div className="flex flex-col gap-2">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onAccept}
          className="btn btn-success py-3 text-sm"
          style={{ background: `linear-gradient(135deg, ${color}33, ${color}11)`, color, border: `1px solid ${color}44` }}
        >
          <CheckCircle className="w-4 h-4" />
          ¡Quiero!
        </motion.button>

        {canRaise && onRaise && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onRaise}
            className="btn py-3 text-sm"
            style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--color-gold)', border: '1px solid rgba(212,175,55,0.3)' }}
          >
            <ChevronUp className="w-4 h-4" />
            Subir ({labels[type]?.[level + 1] || 'Más'})
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onReject}
          className="btn btn-danger py-3 text-sm"
        >
          <XCircle className="w-4 h-4" />
          ¡No Quiero!
        </motion.button>
      </div>
    </motion.div>
  )
}

// ── Main Game Table ────────────────────────────────────────────
export default function GameTable() {
  const navigate = useNavigate()
  const {
    gameState, isPlaying,
    playCard, callTruco, acceptTruco, rejectTruco,
    callEnvido, acceptEnvido, rejectEnvido,
    callFlor, acceptFlor, rejectFlor,
    goToDeck, botPlay, resetGame,
  } = useGameStore()

  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showLog, setShowLog] = useState(true)
  const logRef = useRef<HTMLDivElement>(null)

  const humanPlayer = gameState?.players.find((p) => !p.isBot)
  const botPlayer = gameState?.players.find((p) => p.isBot)
  const humanIndex = gameState?.players.findIndex((p) => !p.isBot) ?? 0
  const botIndex = gameState?.players.findIndex((p) => p.isBot) ?? 1

  useEffect(() => {
    if (gameState?.currentTurn && gameState?.players[gameState.currentPlayerIndex]?.isBot) {
      botPlay()
    }
  }, [gameState?.currentTurn, gameState?.currentPlayerIndex, botPlay])

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [gameState?.messages.length])

  if (!gameState || !isPlaying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4" style={{ color: 'var(--color-text-muted)' }}>No hay juego en progreso</p>
          <button onClick={() => navigate('/lobby')} className="btn btn-gold">
            Volver al Lobby
          </button>
        </div>
      </div>
    )
  }

  const handlePlayCard = (card: Card) => {
    if (!humanPlayer) return
    if (gameState.currentTurn !== humanPlayer.userId) return
    if (gameState.gamePhase !== 'playing') return
    playCard(humanPlayer.userId, card)
  }

  const handleNewGame = () => {
    resetGame()
    navigate('/lobby')
  }

  const isMyTurn = gameState.currentTurn === humanPlayer?.userId
  const isPhase = (phase: string) => gameState.gamePhase === phase
  const humanPts = gameState.puntos[humanPlayer?.userId || ''] || 0
  const botPts = gameState.puntos[botPlayer?.userId || ''] || 0

  const currentMano = gameState.manos[gameState.currentManoIndex]
  const playedCards = currentMano?.cards.filter((c) => c.played) || []

  // Determine when to show action modal (bot challenged us)
  const showTrucoModal = isPhase('truco') && isMyTurn && gameState.trucoLevel > 0
  const showEnvidoModal = isPhase('envido') && isMyTurn && gameState.envidoLevel > 0
  const showFlorModal = isPhase('flor') && isMyTurn && gameState.florLevel > 0

  // My action options (when it's my turn and playing phase)
  const canCallTruco = isPhase('playing') && isMyTurn && gameState.trucoLevel === 0
  const canCallRetruco = isPhase('playing') && isMyTurn && gameState.trucoLevel === 1
  const canCallValeCuatro = isPhase('playing') && isMyTurn && gameState.trucoLevel === 2
  const canCallEnvido = isPhase('playing') && isMyTurn && gameState.envidoLevel === 0
  const canGoToDeck = isPhase('playing') && isMyTurn

  const msgColors: Record<string, { bg: string; color: string }> = {
    info: { bg: 'rgba(96,165,250,0.1)', color: '#93c5fd' },
    warning: { bg: 'rgba(245,158,11,0.1)', color: '#fcd34d' },
    success: { bg: 'rgba(34,197,94,0.1)', color: '#86efac' },
    error: { bg: 'rgba(196,30,58,0.1)', color: '#fca5a5' },
  }

  return (
    <div className="min-h-screen felt-bg relative overflow-hidden">
      {/* Felt decorations */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, rgba(26,58,40,0.6) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 100%, rgba(26,58,40,0.6) 0%, transparent 50%),
            radial-gradient(ellipse at 0% 50%, rgba(22,48,36,0.3) 0%, transparent 40%),
            radial-gradient(ellipse at 100% 50%, rgba(22,48,36,0.3) 0%, transparent 40%)
          `,
        }}
      />

      {/* Golden frame corners */}
      {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos) => (
        <div
          key={pos}
          className={`absolute ${pos} w-32 h-32 pointer-events-none`}
          style={{
            background: `radial-gradient(circle at ${pos.includes('left') ? 'left' : 'right'} ${pos.includes('top') ? 'top' : 'bottom'}, rgba(212,175,55,0.06) 0%, transparent 60%)`,
          }}
        />
      ))}

      {/* ── Header ── */}
      <header
        className="relative z-20 flex items-center justify-between px-4 py-3"
        style={{
          background: 'rgba(6,13,8,0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(212,175,55,0.2)',
        }}
      >
        <button
          onClick={() => navigate('/lobby')}
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Salir</span>
        </button>

        <div className="flex items-center gap-3">
          <PhaseBadge phase={gameState.gamePhase} trucoLevel={gameState.trucoLevel} />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={handleNewGame}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-4 grid lg:grid-cols-[1fr_280px] gap-4">
        {/* ── Main Game Area ── */}
        <div className="flex flex-col gap-4">

          {/* ── Score Panel ── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5"
            style={{
              background: 'rgba(13,32,22,0.85)',
              border: '1px solid rgba(212,175,55,0.25)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <div className="flex items-center gap-4">
              {/* Player score */}
              <div className="flex-1 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      background: isMyTurn ? 'linear-gradient(135deg, #d4af37, #8a7030)' : 'rgba(255,255,255,0.08)',
                      border: `2px solid ${isMyTurn ? '#d4af37' : 'transparent'}`,
                      boxShadow: isMyTurn ? '0 0 12px rgba(212,175,55,0.5)' : 'none',
                      color: isMyTurn ? '#1a1000' : 'var(--color-text-muted)',
                      transition: 'all 0.3s',
                    }}
                  >
                    {humanPlayer?.username[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {humanPlayer?.username || 'Vos'}
                  </span>
                  {isMyTurn && <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                </div>
                <motion.div
                  key={humanPts}
                  initial={{ scale: 1.5, color: '#f0d060' }}
                  animate={{ scale: 1, color: '#d4af37' }}
                  transition={{ duration: 0.4 }}
                  className="text-5xl font-bold"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {humanPts}
                </motion.div>
                <div className="mt-2">
                  <TantosDots current={humanPts} total={gameState.targetPoints} color="#d4af37" />
                </div>
              </div>

              {/* Center */}
              <div className="flex flex-col items-center gap-1">
                <Trophy className="w-5 h-5" style={{ color: 'rgba(212,175,55,0.5)' }} />
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>META</span>
                <span className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: 'var(--color-gold)' }}>
                  {gameState.targetPoints}
                </span>
                <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Mano {gameState.currentManoIndex + 1}
                </div>
              </div>

              {/* Bot score */}
              <div className="flex-1 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {botPlayer?.username || 'Bot'}
                  </span>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={{
                      background: !isMyTurn ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)',
                      border: `2px solid ${!isMyTurn ? 'rgba(239,68,68,0.5)' : 'transparent'}`,
                      boxShadow: !isMyTurn ? '0 0 12px rgba(239,68,68,0.3)' : 'none',
                      transition: 'all 0.3s',
                    }}
                  >
                    🤖
                  </div>
                  {!isMyTurn && isPhase('playing') && (
                    <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  )}
                </div>
                <motion.div
                  key={botPts}
                  initial={{ scale: 1.5, color: '#fca5a5' }}
                  animate={{ scale: 1, color: '#ef4444' }}
                  transition={{ duration: 0.4 }}
                  className="text-5xl font-bold"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {botPts}
                </motion.div>
                <div className="mt-2">
                  <TantosDots current={botPts} total={gameState.targetPoints} color="#ef4444" />
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #d4af37, #f0d060)' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((humanPts / gameState.targetPoints) * 100, 100)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>

          {/* ── Game Board / Felt Table ── */}
          <div
            className="rounded-2xl overflow-hidden relative"
            style={{
              background: 'linear-gradient(145deg, #0d2016 0%, #163024 50%, #0d2016 100%)',
              border: '2px solid rgba(212,175,55,0.3)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 0 60px rgba(0,0,0,0.4)',
              minHeight: '520px',
            }}
          >
            {/* Table felt texture */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.008) 4px, rgba(255,255,255,0.008) 8px)`,
              }}
            />

            {/* Inner golden frame */}
            <div
              className="absolute inset-3 rounded-xl pointer-events-none"
              style={{ border: '1px solid rgba(212,175,55,0.12)' }}
            />

            <div className="relative z-10 p-6 flex flex-col h-full min-h-[520px]">
              {/* ── BOT AREA (top) ── */}
              <div className="flex justify-center mb-6">
                <div
                  className="px-6 py-4 rounded-2xl"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: !isMyTurn && isPhase('playing') ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: !isMyTurn && isPhase('playing') ? '0 0 20px rgba(239,68,68,0.15)' : 'none',
                    transition: 'all 0.5s',
                  }}
                >
                  <BotArea
                    username={botPlayer?.username || 'Bot'}
                    cardsCount={gameState.hands[botIndex]?.length || 0}
                    isActive={gameState.currentTurn === botPlayer?.userId}
                  />
                </div>
              </div>

              {/* ── CENTER TABLE (played cards) ── */}
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                {/* Oval table marker */}
                <div
                  className="absolute inset-x-16 inset-y-1/3 rounded-[50%] pointer-events-none"
                  style={{ border: '1px solid rgba(212,175,55,0.08)' }}
                />

                {/* Played cards */}
                <AnimatePresence>
                  {playedCards.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex gap-4 items-center justify-center"
                    >
                      {playedCards.map((pc, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0, rotate: -180, y: -50 }}
                          animate={{
                            scale: 1,
                            rotate: (i % 2 === 0 ? -5 : 5),
                            y: 0,
                          }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: i * 0.1 }}
                        >
                          {pc.card && <SpanishCard card={pc.card} size="small" />}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Empty table hint */}
                {playedCards.length === 0 && (
                  <div className="text-center">
                    <div className="text-5xl mb-2 opacity-10">🃏</div>
                    {isMyTurn && isPhase('playing') && (
                      <p className="text-sm" style={{ color: 'rgba(212,175,55,0.4)' }}>
                        Jugá una carta
                      </p>
                    )}
                  </div>
                )}

                {/* Action modal for bot challenges */}
                <AnimatePresence>
                  {showTrucoModal && (
                    <div className="w-full max-w-xs">
                      <ActionModal
                        type="truco"
                        level={gameState.trucoLevel}
                        onAccept={() => acceptTruco(humanPlayer!.userId)}
                        onReject={() => rejectTruco(humanPlayer!.userId)}
                        onRaise={gameState.trucoLevel < 3 ? () => callTruco(humanPlayer!.userId, (gameState.trucoLevel + 1) as 1 | 2 | 3) : undefined}
                        canRaise={gameState.trucoLevel < 3}
                      />
                    </div>
                  )}
                  {showEnvidoModal && (
                    <div className="w-full max-w-xs">
                      <ActionModal
                        type="envido"
                        level={gameState.envidoLevel}
                        onAccept={() => acceptEnvido(humanPlayer!.userId)}
                        onReject={() => rejectEnvido(humanPlayer!.userId)}
                        onRaise={gameState.envidoLevel < 3 ? () => callEnvido(humanPlayer!.userId, (gameState.envidoLevel + 1) as 1 | 2 | 3) : undefined}
                        canRaise={gameState.envidoLevel < 3}
                      />
                    </div>
                  )}
                  {showFlorModal && (
                    <div className="w-full max-w-xs">
                      <ActionModal
                        type="flor"
                        level={gameState.florLevel}
                        onAccept={() => acceptFlor(humanPlayer!.userId)}
                        onReject={() => rejectFlor(humanPlayer!.userId)}
                        canRaise={false}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── PLAYER HAND (bottom) ── */}
              <div className="flex flex-col items-center gap-6">
                {/* Divider line */}
                <div className="w-full max-w-xs h-px" style={{ background: 'rgba(212,175,55,0.1)' }} />

                {/* Player label */}
                <div className="text-center">
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-3"
                    style={{
                      background: isMyTurn ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isMyTurn ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      color: isMyTurn ? 'var(--color-gold)' : 'var(--color-text-muted)',
                    }}
                  >
                    {isMyTurn ? '● Tu turno' : '○ Esperando...'}
                  </div>
                </div>

                {/* Player's hand */}
                <div
                  className="px-6 py-5 rounded-2xl"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: isMyTurn ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: isMyTurn ? '0 0 20px rgba(212,175,55,0.1)' : 'none',
                    transition: 'all 0.5s',
                  }}
                >
                  <CardHand
                    cards={gameState.hands[humanIndex] || []}
                    playerId={humanPlayer?.userId || ''}
                    currentPlayerId={gameState.currentTurn}
                    onPlayCard={handlePlayCard}
                    isBot={false}
                    size="medium"
                    disabled={!isMyTurn || !isPhase('playing')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Action Buttons Row ── */}
          <AnimatePresence>
            {isPhase('playing') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex flex-wrap gap-2"
              >
                {/* Truco button cascade */}
                {canCallTruco && (
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => callTruco(humanPlayer!.userId, 1)}
                    className="btn flex-1 py-3 flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))',
                      border: '1px solid rgba(245,158,11,0.4)',
                      color: '#f59e0b',
                      fontSize: '0.85rem',
                    }}
                  >
                    <Swords className="w-4 h-4" />
                    ¡Truco!
                  </motion.button>
                )}
                {canCallRetruco && (
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => callTruco(humanPlayer!.userId, 2)}
                    className="btn flex-1 py-3"
                    style={{
                      background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.05))',
                      border: '1px solid rgba(245,158,11,0.5)',
                      color: '#fbbf24',
                      fontSize: '0.85rem',
                    }}
                  >
                    ⚔️ ¡Retruco!
                  </motion.button>
                )}
                {canCallValeCuatro && (
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => callTruco(humanPlayer!.userId, 3)}
                    className="btn flex-1 py-3"
                    style={{
                      background: 'linear-gradient(135deg, rgba(212,175,55,0.3), rgba(212,175,55,0.05))',
                      border: '1px solid rgba(212,175,55,0.5)',
                      color: '#d4af37',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                    }}
                  >
                    🔥 ¡Vale Cuatro!
                  </motion.button>
                )}

                {/* Envido buttons */}
                {canCallEnvido && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => callEnvido(humanPlayer!.userId, 1)}
                      className="btn flex-1 py-3"
                      style={{
                        background: 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(96,165,250,0.03))',
                        border: '1px solid rgba(96,165,250,0.3)',
                        color: '#60a5fa',
                        fontSize: '0.85rem',
                      }}
                    >
                      <Zap className="w-4 h-4" />
                      Envido
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => callEnvido(humanPlayer!.userId, 2)}
                      className="btn flex-1 py-3"
                      style={{
                        background: 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(96,165,250,0.03))',
                        border: '1px solid rgba(96,165,250,0.4)',
                        color: '#93c5fd',
                        fontSize: '0.85rem',
                      }}
                    >
                      <Star className="w-4 h-4" />
                      Real Envido
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => callEnvido(humanPlayer!.userId, 3)}
                      className="btn flex-1 py-3"
                      style={{
                        background: 'linear-gradient(135deg, rgba(192,132,252,0.15), rgba(192,132,252,0.03))',
                        border: '1px solid rgba(192,132,252,0.3)',
                        color: '#c084fc',
                        fontSize: '0.85rem',
                      }}
                    >
                      <Shield className="w-4 h-4" />
                      Falta Envido
                    </motion.button>
                  </>
                )}

                {/* Go to deck */}
                {canGoToDeck && (
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => goToDeck(humanPlayer!.userId)}
                    className="btn btn-felt py-3 flex items-center justify-center gap-2"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <ChevronDown className="w-4 h-4" />
                    Me voy al mazo
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Sidebar: Log ── */}
        <div className="flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(13,32,22,0.85)',
              border: '1px solid rgba(212,175,55,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer"
              style={{ borderBottom: '1px solid rgba(212,175,55,0.15)' }}
              onClick={() => setShowLog(!showLog)}
            >
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-gold-light)' }}>
                📋 Log de Eventos
              </h3>
              <button style={{ color: 'var(--color-text-muted)' }}>
                {showLog ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            <AnimatePresence>
              {showLog && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    ref={logRef}
                    className="p-3 space-y-1.5 overflow-y-auto"
                    style={{ maxHeight: '280px' }}
                  >
                    {gameState.messages.length === 0 && (
                      <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
                        El juego acaba de comenzar...
                      </p>
                    )}
                    <AnimatePresence initial={false}>
                      {gameState.messages.map((msg) => {
                        const style = msgColors[msg.type] || msgColors.info
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-3 py-2 rounded-lg text-xs"
                            style={{ background: style.bg, color: style.color, border: `1px solid ${style.color}22` }}
                          >
                            {msg.text}
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Game info */}
          <div
            className="rounded-2xl p-4 text-xs space-y-2"
            style={{
              background: 'rgba(13,32,22,0.7)',
              border: '1px solid rgba(212,175,55,0.15)',
            }}
          >
            <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--color-gold-muted)', letterSpacing: '0.1em' }}>
              ESTADO DE LA PARTIDA
            </h4>
            {[
              { label: 'Mano actual', value: `Mano ${gameState.currentManoIndex + 1}` },
              { label: 'Truco', value: ['Sin cantar', 'Truco', 'Retruco', 'Vale Cuatro'][gameState.trucoLevel] },
              { label: 'Envido', value: ['Sin cantar', 'Envido', 'Real Envido', 'Falta Envido'][gameState.envidoLevel] },
              { label: 'Turno de', value: gameState.currentTurn === humanPlayer?.userId ? '⭐ Vos' : '🤖 Bot' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Win/Lose Modal ── */}
      <AnimatePresence>
        {gameState.winner && (
          <ResultModal
            winner={gameState.winner}
            humanId={humanPlayer?.userId || ''}
            humanPoints={humanPts}
            botPoints={botPts}
            onNewGame={handleNewGame}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
