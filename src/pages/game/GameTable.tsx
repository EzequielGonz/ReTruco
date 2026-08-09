import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, RotateCcw, Volume2, VolumeX,
  Swords, Zap, Star, Shield, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Award,
} from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'
import { calculateEnvido } from '../../utils/trucoRules'
import SpanishCard from '../../components/game/SpanishCard'
import CardHand from '../../components/game/CardHand'
import BotArea from '../../components/game/BotArea'
import type { Card } from '../../types'

// ── Compact score pill ─────────────────────────────────────────
function ScorePill({
  label, score, total, color, active, isBot,
}: { label: string; score: number; total: number; color: string; active: boolean; isBot?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold truncate max-w-[60px]"
          style={{ color: active ? color : 'var(--color-text-muted)' }}>
          {isBot ? '🤖' : '⭐'} {label}
        </span>
        {active && (
          <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.9, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
        )}
      </div>
      <motion.div key={score}
        initial={{ scale: 1.5 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}
        className="text-3xl font-black leading-none"
        style={{ fontFamily: 'Playfair Display,serif', color }}>
        {score}
      </motion.div>
      {/* Mini progress bar */}
      <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <motion.div className="h-full rounded-full"
          style={{ background: color }}
          animate={{ width: `${Math.min((score / total) * 100, 100)}%` }}
          transition={{ duration: 0.5 }} />
      </div>
      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{score}/{total}</span>
    </div>
  )
}

// ── Phase badge ────────────────────────────────────────────────
function PhaseBadge({ phase, trucoLevel }: { phase: string; trucoLevel: number }) {
  const cfg: Record<string, { label: string; color: string }> = {
    playing:       { label: '🎴 Jugando',       color: '#22c55e' },
    truco:         { label: '⚔️ ' + (['','Truco','Retruco','¡Vale Cuatro!'][trucoLevel] || 'Truco'), color: '#f59e0b' },
    envido:        { label: '🟢 Envido',         color: '#60a5fa' },
    envido_points: { label: '🔢 Puntos Envido',  color: '#38bdf8' },
    flor:          { label: '🌸 Flor',           color: '#c084fc' },
    finished:      { label: '🏆 Terminado',      color: '#d4af37' },
  }
  const c = cfg[phase] ?? cfg.playing
  return (
    <motion.span key={phase + trucoLevel}
      initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
      className="text-xs font-bold px-2.5 py-1 rounded-full"
      style={{ background: `${c.color}18`, border: `1px solid ${c.color}44`, color: c.color }}>
      {c.label}
    </motion.span>
  )
}

// ── Win / Lose Modal ───────────────────────────────────────────
function ResultModal({ winner, humanId, humanPts, botPts, onNewGame }: {
  winner: string; humanId: string; humanPts: number; botPts: number; onNewGame: () => void
}) {
  const isWin = winner === humanId
  return (
    <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(14px)' }}>
      <motion.div
        initial={{ scale: 0.6, y: 60 }} animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        className="relative rounded-3xl p-10 text-center max-w-sm w-full overflow-hidden"
        style={{
          background: isWin ? 'linear-gradient(145deg,rgba(26,58,40,0.98),rgba(13,32,22,0.99))'
                            : 'linear-gradient(145deg,rgba(44,14,14,0.98),rgba(20,8,8,0.99))',
          border: `2px solid ${isWin ? 'rgba(212,175,55,0.55)' : 'rgba(196,30,58,0.45)'}`,
          boxShadow: `0 50px 120px rgba(0,0,0,0.85)`,
        }}>
        {isWin && [0,1,2,3,4,5].map(i => (
          <motion.div key={i} className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
            style={{ background: '#d4af37', left: `${15+i*14}%`, top: '20%' }}
            animate={{ y: [-20,-80], opacity: [1,0], scale: [1,0.3] }}
            transition={{ duration: 1.5, delay: i*0.2, repeat: Infinity, repeatDelay: 1 }} />
        ))}
        <motion.div className="text-7xl mb-4"
          animate={isWin ? { rotate:[0,-10,10,-10,10,0] } : { x:[0,-5,5,-5,5,0] }}
          transition={{ duration: 0.8, delay: 0.3 }}>
          {isWin ? '🏆' : '😔'}
        </motion.div>
        <h2 className="text-3xl font-bold mb-2"
          style={{ fontFamily:'Playfair Display,serif', color: isWin ? 'var(--color-gold-light)' : '#fca5a5' }}>
          {isWin ? '¡GANASTE!' : '¡PERDISTE!'}
        </h2>
        <p className="mb-6 text-sm" style={{ color:'var(--color-text-muted)' }}>
          Puntos: <strong style={{ color: isWin ? 'var(--color-gold)' : '#fca5a5' }}>{humanPts}</strong>
          {' — '}
          <strong style={{ color:'rgba(240,230,211,0.4)' }}>{botPts}</strong>
        </p>
        <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.97 }}
          onClick={onNewGame} className="btn btn-gold w-full py-4">
          <RotateCcw className="w-4 h-4" /> Jugar de Nuevo
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ── Bid modal (Truco / Envido / Flor challenge) ────────────────
function BidModal({ type, level, callerName, myEnvidoPoints, onAccept, onReject, onRaise, canRaise }: {
  type: 'truco'|'envido'|'flor'; level: number; callerName: string; myEnvidoPoints?: number
  onAccept: ()=>void; onReject: ()=>void; onRaise?: ()=>void; canRaise?: boolean
}) {
  const labels: Record<string,string[]> = {
    truco:  ['','Truco','Retruco','¡Vale Cuatro!'],
    envido: ['','Envido','Real Envido','Falta Envido'],
    flor:   ['','Flor','Contra Flor'],
  }
  const colors: Record<string,string> = { truco:'#f59e0b', envido:'#60a5fa', flor:'#c084fc' }
  const icons = { truco:'⚔️', envido:'🃏', flor:'🌸' }
  const label = labels[type]?.[level] || labels[type]?.[1] || ''
  const color = colors[type] || '#d4af37'
  return (
    <motion.div initial={{ opacity:0, scale:0.88, y:16 }} animate={{ opacity:1, scale:1, y:0 }}
      exit={{ opacity:0, scale:0.88, y:16 }}
      transition={{ type:'spring', stiffness:320, damping:26 }}
      className="rounded-2xl p-5 text-center relative overflow-hidden w-full max-w-xs mx-auto"
      style={{ background:'rgba(8,20,13,0.97)', border:`2px solid ${color}55`,
               boxShadow:`0 0 40px ${color}22, 0 20px 50px rgba(0,0,0,0.7)` }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background:`radial-gradient(ellipse at center,${color}0a 0%,transparent 70%)` }} />
      <motion.div animate={{ scale:[1,1.1,1] }} transition={{ duration:0.7, repeat:Infinity, repeatDelay:1.2 }}
        className="text-3xl mb-1 relative z-10">{icons[type]}</motion.div>
      <p className="text-xs font-bold tracking-widest mb-0.5 relative z-10"
        style={{ color:`${color}aa`, letterSpacing:'0.18em' }}>
        {callerName.toUpperCase()} CANTÓ
      </p>
      <h3 className="text-xl font-bold mb-1 relative z-10"
        style={{ fontFamily:'Playfair Display,serif', color }}>¡{label}!</h3>
      {type === 'envido' && myEnvidoPoints !== undefined && (
        <p className="text-xs mb-2 relative z-10" style={{ color:'var(--color-text-muted)' }}>
          Tu envido: <strong style={{ color:'#60a5fa' }}>{myEnvidoPoints}</strong>
        </p>
      )}
      <div className="flex flex-col gap-1.5 relative z-10 mt-3">
        <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
          onClick={onAccept} className="btn py-2.5 text-sm font-bold"
          style={{ background:`linear-gradient(135deg,${color}44,${color}18)`, color, border:`1px solid ${color}55` }}>
          <CheckCircle className="w-3.5 h-3.5" />¡Quiero!
        </motion.button>
        {canRaise && onRaise && (
          <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            onClick={onRaise} className="btn py-2.5 text-sm"
            style={{ background:'rgba(212,175,55,0.1)', color:'var(--color-gold)', border:'1px solid rgba(212,175,55,0.35)' }}>
            <ChevronUp className="w-3.5 h-3.5" />{labels[type]?.[level+1] || 'Subir'}
          </motion.button>
        )}
        <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
          onClick={onReject} className="btn btn-danger py-2.5 text-sm">
          <XCircle className="w-3.5 h-3.5" />¡No Quiero!
        </motion.button>
      </div>
    </motion.div>
  )
}

// ── Envido points modal ────────────────────────────────────────
function EnvidoPointsModal({ myPoints, opponentPoints, isFirstAnnouncer, onAnnounce, onSonBuenas }: {
  myPoints: number; opponentPoints?: number; isFirstAnnouncer: boolean
  onAnnounce: ()=>void; onSonBuenas: ()=>void
}) {
  return (
    <motion.div initial={{ opacity:0, scale:0.88, y:16 }} animate={{ opacity:1, scale:1, y:0 }}
      exit={{ opacity:0, scale:0.88, y:16 }}
      transition={{ type:'spring', stiffness:320, damping:26 }}
      className="rounded-2xl p-5 text-center relative overflow-hidden w-full max-w-xs mx-auto"
      style={{ background:'rgba(8,20,13,0.97)', border:'2px solid rgba(56,189,248,0.45)',
               boxShadow:'0 0 40px rgba(56,189,248,0.18), 0 20px 50px rgba(0,0,0,0.7)' }}>
      <div className="text-3xl mb-1">🔢</div>
      <h3 className="text-lg font-bold mb-1"
        style={{ fontFamily:'Playfair Display,serif', color:'#38bdf8' }}>
        {isFirstAnnouncer ? '¡Cantá tus puntos!' : '¿Son buenas?'}
      </h3>
      <div className="my-3 py-2.5 rounded-xl"
        style={{ background:'rgba(56,189,248,0.1)', border:'1px solid rgba(56,189,248,0.25)' }}>
        <p className="text-xs mb-0.5" style={{ color:'var(--color-text-muted)' }}>TUS PUNTOS</p>
        <p className="text-4xl font-bold" style={{ fontFamily:'Playfair Display,serif', color:'#38bdf8' }}>
          {myPoints}
        </p>
      </div>
      {!isFirstAnnouncer && opponentPoints !== undefined && (
        <p className="text-xs mb-3" style={{ color:'var(--color-text-muted)' }}>
          Rival: <strong style={{ color:'#f59e0b' }}>{opponentPoints}</strong>
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
          onClick={onAnnounce} className="btn py-2.5 text-sm font-bold"
          style={{ background:'linear-gradient(135deg,rgba(56,189,248,0.4),rgba(56,189,248,0.15))', color:'#38bdf8', border:'1px solid rgba(56,189,248,0.5)' }}>
          <Award className="w-3.5 h-3.5" />
          {isFirstAnnouncer ? `Tengo ${myPoints}` : myPoints > (opponentPoints ?? -1) ? `Son mejores: ${myPoints}` : `Tengo ${myPoints}`}
        </motion.button>
        {!isFirstAnnouncer && (
          <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            onClick={onSonBuenas} className="btn py-2.5 text-sm"
            style={{ background:'rgba(245,158,11,0.12)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.35)' }}>
            <CheckCircle className="w-3.5 h-3.5" />Son buenas las tuyas
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

// ── Main GameTable ─────────────────────────────────────────────
export default function GameTable() {
  const navigate = useNavigate()
  const {
    gameState, isPlaying, isDealing, finishDealing, clearBotToast,
    playCard, callTruco, acceptTruco, rejectTruco,
    callEnvido, acceptEnvido, rejectEnvido, announceEnvidoPoints,
    callFlor, acceptFlor, rejectFlor,
    goToDeck, botPlay, resetGame,
  } = useGameStore()

  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showLog, setShowLog] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)
  const [dealStep, setDealStep] = useState(0)

  const humanPlayer = gameState?.players.find((p) => !p.isBot)
  const botPlayer   = gameState?.players.find((p) => p.isBot)
  const humanIndex  = gameState?.players.findIndex((p) => !p.isBot) ?? 0
  const botIndex    = gameState?.players.findIndex((p) => p.isBot)  ?? 1

  useEffect(() => { if (isDealing) setDealStep(0) }, [isDealing])

  useEffect(() => {
    if (!isDealing) return
    if (dealStep < 3) {
      const t = setTimeout(() => setDealStep((s) => s + 1), 350)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => finishDealing(), 600)
      return () => clearTimeout(t)
    }
  }, [isDealing, dealStep, finishDealing])

  useEffect(() => {
    if (!gameState || isDealing) return
    const cur = gameState.players.find((p) => p.userId === gameState.currentTurn)
    if (cur?.isBot) botPlay()
    // Only re-run when currentTurn changes — not on every phase change.
    // botPlay itself re-reads fresh state inside the setTimeout, so it handles
    // all phases correctly as long as currentTurn points to the bot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.currentTurn, isDealing])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [gameState?.messages.length])

  // Auto-clear bot toast after 2.5s
  useEffect(() => {
    if (!gameState?.botToast) return
    const t = setTimeout(() => clearBotToast(), 2500)
    return () => clearTimeout(t)
  }, [gameState?.botToast?.id, clearBotToast])

  if (!gameState || !isPlaying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4" style={{ color:'var(--color-text-muted)' }}>No hay juego en progreso</p>
          <button onClick={() => navigate('/lobby')} className="btn btn-gold">Volver al Lobby</button>
        </div>
      </div>
    )
  }

  // ── Deal animation screen ──────────────────────────────────
  if (isDealing) {
    const hCards = gameState.hands[humanIndex] || []
    return (
      <div className="min-h-screen felt-bg flex flex-col items-center justify-center relative overflow-hidden">
        {['top-0 left-0','top-0 right-0','bottom-0 left-0','bottom-0 right-0'].map(pos => (
          <div key={pos} className={`absolute ${pos} w-40 h-40 pointer-events-none`}
            style={{ background:`radial-gradient(circle at ${pos.includes('left')?'left':'right'} ${pos.includes('top')?'top':'bottom'},rgba(212,175,55,0.08) 0%,transparent 60%)` }} />
        ))}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex flex-col items-center gap-8">
          <motion.h2 initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
            className="text-xl font-bold" style={{ fontFamily:'Playfair Display,serif', color:'var(--color-gold)' }}>
            Repartiendo cartas...
          </motion.h2>
          <div className="flex gap-3 items-end">
            {[0,1,2].map(i => (
              <motion.div key={i}
                initial={{ opacity:0, y:-100, rotate:-15 }}
                animate={dealStep > i ? { opacity:1, y:0, rotate:(i-1)*4 } : {}}
                transition={{ type:'spring', stiffness:260, damping:20 }}>
                <SpanishCard card={{ suit:'espadas', rank:1, value:1, power:1 }} faceDown size="small" />
              </motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity:0 }} animate={{ opacity: dealStep >= 2 ? 1 : 0 }}
            className="text-sm px-4 py-2 rounded-xl"
            style={{ background:'rgba(13,32,22,0.7)', border:'1px solid rgba(212,175,55,0.2)', color:'var(--color-text-muted)' }}>
            {botPlayer?.username || 'Bot'} <span style={{ color:'var(--color-gold-muted)' }}>vs</span> {humanPlayer?.username || 'Vos'}
          </motion.div>
          <div className="flex gap-3 items-end">
            {hCards.map((card, i) => (
              <motion.div key={i}
                initial={{ opacity:0, y:100, rotateY:180 }}
                animate={dealStep > i ? { opacity:1, y:0, rotateY:0, rotate:(i-1)*4 } : {}}
                transition={{ type:'spring', stiffness:240, damping:22, delay:i*0.08 }}
                style={{ perspective:600 }}>
                <SpanishCard card={card} size="medium" />
              </motion.div>
            ))}
          </div>
          <motion.div animate={{ opacity:[0.4,1,0.4] }} transition={{ duration:1, repeat:Infinity }}
            className="flex items-center gap-2 text-xs" style={{ color:'var(--color-text-muted)' }}>
            {[0,1,2].map(i => (
              <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                style={{ background:'currentColor' }}
                animate={{ scale:[0.8,1.4,0.8] }}
                transition={{ duration:0.8, delay:i*0.2, repeat:Infinity }} />
            ))}
            <span>Preparando la mano</span>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // ── Game state derived values ──────────────────────────────
  const isMyTurn  = gameState.currentTurn === humanPlayer?.userId
  const isPhase   = (p: string) => gameState.gamePhase === p
  const humanPts  = gameState.puntos[humanPlayer?.userId || ''] || 0
  const botPts    = gameState.puntos[botPlayer?.userId    || ''] || 0
  const trucoCaller  = gameState.trucoCaller
  const envidoCaller = gameState.envidoCaller
  const florCaller   = gameState.florCaller
  const callerName = (id: string | null) =>
    id ? (gameState.players.find((p) => p.userId === id)?.username ?? 'Rival') : 'Rival'

  const humanCalledTruco  = trucoCaller  === humanPlayer?.userId
  const humanCalledEnvido = envidoCaller === humanPlayer?.userId
  const humanCalledFlor   = florCaller   === humanPlayer?.userId

  const showTrucoModal   = isPhase('truco')         && isMyTurn && !humanCalledTruco
  const showEnvidoModal  = isPhase('envido')         && isMyTurn && !humanCalledEnvido
  const showFlorModal    = isPhase('flor')           && isMyTurn && !humanCalledFlor
  const showEnvidoPts    = isPhase('envido_points')  && isMyTurn
  const isFirstAnnouncer = showEnvidoPts && !gameState.envidoPointsCall

  const canCallTruco      = isPhase('playing') && isMyTurn && gameState.trucoLevel === 0
  const canCallRetruco    = isPhase('playing') && isMyTurn && gameState.trucoLevel === 1 && !humanCalledTruco
  const canCallValeCuatro = isPhase('playing') && isMyTurn && gameState.trucoLevel === 2 && !humanCalledTruco
  const canCallEnvido     = isPhase('playing') && isMyTurn && gameState.envidoLevel === 0
                            && !gameState.envidoResolved && gameState.tricksPlayedThisHand === 0
  const canGoToDeck       = isPhase('playing') && isMyTurn
  const showActionBtns    = isPhase('playing') && isMyTurn
    && (canCallTruco || canCallRetruco || canCallValeCuatro || canCallEnvido || canGoToDeck)

  const humanEnvido = humanIndex >= 0 && gameState.hands[humanIndex]
    ? calculateEnvido(gameState.hands[humanIndex])
    : { value: 0, hasEnvido: false }

  // (tableCards unused — table now reads directly from gameState.manos)

  const handlePlayCard = (card: Card) => {
    if (!humanPlayer || !isMyTurn || !isPhase('playing')) return
    playCard(humanPlayer.userId, card)
  }
  const handleNewGame = () => { resetGame(); navigate('/lobby') }

  const msgColors: Record<string,{bg:string;color:string}> = {
    info:    { bg:'rgba(96,165,250,0.1)',  color:'#93c5fd' },
    warning: { bg:'rgba(245,158,11,0.1)', color:'#fcd34d' },
    success: { bg:'rgba(34,197,94,0.1)',  color:'#86efac' },
    error:   { bg:'rgba(196,30,58,0.1)',  color:'#fca5a5' },
  }

  // ── Main render: fixed-height, no scroll ──────────────────
  return (
    <div className="felt-bg relative overflow-hidden flex flex-col" style={{ height: '100dvh', maxHeight: '100dvh' }}>

      {/* Background vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background:`radial-gradient(ellipse at 50% 0%,rgba(26,58,40,0.55) 0%,transparent 45%),
                   radial-gradient(ellipse at 50% 100%,rgba(26,58,40,0.55) 0%,transparent 45%)`,
      }} />

      {/* ── Header bar ── */}
      <header className="relative z-20 flex items-center justify-between px-3 py-2 shrink-0"
        style={{ background:'rgba(6,13,8,0.9)', backdropFilter:'blur(14px)', borderBottom:'1px solid rgba(212,175,55,0.18)' }}>
        {/* Left: back */}
        <button onClick={() => navigate('/lobby')}
          className="flex items-center gap-1.5 text-xs transition-colors"
          style={{ color:'var(--color-text-muted)' }}
          onMouseEnter={e=>e.currentTarget.style.color='#ef4444'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--color-text-muted)'}>
          <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Salir</span>
        </button>

        {/* Center: phase */}
        <PhaseBadge phase={gameState.gamePhase} trucoLevel={gameState.trucoLevel} />

        {/* Right: controls */}
        <div className="flex items-center gap-1">
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-1.5 rounded-lg"
            style={{ color:'var(--color-text-muted)' }}>
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleNewGame} className="p-1.5 rounded-lg" style={{ color:'var(--color-text-muted)' }}>
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── Main layout: felt table + right sidebar ── */}
      <div className="relative z-10 flex-1 flex gap-3 p-3 min-h-0">

        {/* ═══ FELT TABLE (left, takes all available space) ═══ */}
        <div className="flex-1 flex flex-col min-h-0 rounded-2xl overflow-hidden relative"
          style={{
            background:'linear-gradient(145deg,#0a1a10 0%,#163024 50%,#0a1a10 100%)',
            border:'2px solid rgba(212,175,55,0.28)',
            boxShadow:'0 16px 50px rgba(0,0,0,0.6), inset 0 0 50px rgba(0,0,0,0.4)',
          }}>
          {/* felt grain */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage:'repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,0.006) 4px,rgba(255,255,255,0.006) 8px)' }} />
          {/* inner frame */}
          <div className="absolute inset-2 rounded-xl pointer-events-none"
            style={{ border:'1px solid rgba(212,175,55,0.08)' }} />

          <div className="relative z-10 flex flex-col h-full p-3 gap-2">

            {/* ── BOT AREA (top, compact) ── */}
            <div className="shrink-0 flex justify-center">
              <div className="px-4 py-2.5 rounded-2xl"
                style={{
                  background:'rgba(0,0,0,0.3)',
                  border: !isMyTurn ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(255,255,255,0.05)',
                  boxShadow: !isMyTurn ? '0 0 18px rgba(239,68,68,0.12)' : 'none',
                  transition:'all 0.4s',
                }}>
                <BotArea
                  username={botPlayer?.username || 'Bot'}
                  cardsCount={gameState.hands[botIndex]?.length || 0}
                  isActive={gameState.currentTurn === botPlayer?.userId}
                />
              </div>
            </div>

            {/* ── BOT TOAST (quiero / no quiero response) ── */}
            <AnimatePresence>
              {gameState.botToast && (
                <motion.div
                  key={gameState.botToast.id}
                  initial={{ opacity: 0, y: -16, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                  className="shrink-0 flex justify-center"
                >
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm"
                    style={{
                      background: `${gameState.botToast.color}22`,
                      border: `1.5px solid ${gameState.botToast.color}66`,
                      color: gameState.botToast.color,
                      boxShadow: `0 0 20px ${gameState.botToast.color}33`,
                    }}>
                    <span>🤖</span>
                    <span>{botPlayer?.username || 'Bot'}:</span>
                    <span>{gameState.botToast.text}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── CENTER TABLE: 3-column trick grid ── */}
            <div className="flex-1 flex items-center justify-center relative min-h-0">
              {/* Decorative oval */}
              <div className="absolute inset-x-8 inset-y-4 rounded-[50%] pointer-events-none"
                style={{ border:'1px solid rgba(212,175,55,0.07)' }} />

              {/* 3 baza columns — always rendered, cards appear as played */}
              <div className="flex items-center justify-center gap-5 w-full px-2">
                {[0,1,2].map((mi) => {
                  const mano = gameState.manos[mi]
                  const botCard   = mano?.cards.find((c) => c.playerId === botPlayer?.userId)
                  const humanCard = mano?.cards.find((c) => c.playerId === humanPlayer?.userId)
                  const isCurrent = mi === gameState.currentManoIndex
                  const isWon     = mano?.winner !== undefined
                  const winnerIsHuman = mano?.winner === humanPlayer?.userId
                  const isTie     = mano?.winner === 'tie'
                  const dimmed    = mi > gameState.currentManoIndex && !isWon

                  return (
                    <div key={mi} className="flex flex-col items-center gap-1.5"
                      style={{ opacity: dimmed ? 0.2 : 1, transition: 'opacity 0.3s' }}>
                      {/* Baza result label */}
                      <div className="text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap"
                        style={{
                          background: isWon
                            ? (isTie ? 'rgba(255,255,255,0.08)' : winnerIsHuman ? 'rgba(212,175,55,0.18)' : 'rgba(239,68,68,0.18)')
                            : isCurrent ? 'rgba(255,255,255,0.06)' : 'transparent',
                          color: isWon
                            ? (isTie ? '#9ca3af' : winnerIsHuman ? '#d4af37' : '#ef4444')
                            : isCurrent ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.15)',
                          border: isCurrent && !isWon ? '1px solid rgba(212,175,55,0.18)' : '1px solid transparent',
                        }}>
                        {isWon
                          ? (isTie ? '🤝 Parda' : winnerIsHuman ? '⭐ Tuya' : '🤖 Bot')
                          : `Baza ${mi + 1}`}
                      </div>

                      {/* Bot card slot (medium) */}
                      <div style={{ width: 90, height: 138, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AnimatePresence>
                          {botCard?.played && botCard.card ? (
                            <motion.div key={`bot-${mi}-${botCard.card.rank}-${botCard.card.suit}`}
                              initial={{ opacity: 0, y: -55, rotate: -10, scale: 0.65 }}
                              animate={{ opacity: 1, y: 0, rotate: -3, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.85 }}
                              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                              style={{ filter: 'drop-shadow(0 10px 22px rgba(0,0,0,0.65))' }}>
                              <SpanishCard card={botCard.card} size="medium" />
                            </motion.div>
                          ) : (
                            <div style={{
                              width: 90, height: 138, borderRadius: 10,
                              border: '1px dashed rgba(239,68,68,0.15)',
                              background: 'rgba(239,68,68,0.02)',
                            }} />
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Divider */}
                      <div style={{ width: 52, height: 1, background: 'rgba(212,175,55,0.15)' }} />

                      {/* Human card slot (medium) */}
                      <div style={{ width: 90, height: 138, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AnimatePresence>
                          {humanCard?.played && humanCard.card ? (
                            <motion.div key={`human-${mi}-${humanCard.card.rank}-${humanCard.card.suit}`}
                              initial={{ opacity: 0, y: 55, rotate: 10, scale: 0.65 }}
                              animate={{ opacity: 1, y: 0, rotate: 3, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.85 }}
                              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                              style={{ filter: 'drop-shadow(0 10px 22px rgba(0,0,0,0.65))' }}>
                              <SpanishCard card={humanCard.card} size="medium" />
                            </motion.div>
                          ) : (
                            <div style={{
                              width: 90, height: 138, borderRadius: 10,
                              border: isCurrent ? '1px dashed rgba(212,175,55,0.22)' : '1px dashed rgba(212,175,55,0.07)',
                              background: isCurrent ? 'rgba(212,175,55,0.03)' : 'transparent',
                            }} />
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Bid & envido-points modals — overlay in center */}
              <AnimatePresence>
                {(showTrucoModal || showEnvidoModal || showFlorModal || showEnvidoPts) && (
                  <motion.div
                    initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background:'rgba(6,16,10,0.75)', backdropFilter:'blur(6px)', borderRadius:16, zIndex:10 }}>
                    {showTrucoModal && (
                      <BidModal type="truco" level={gameState.trucoLevel} callerName={callerName(trucoCaller)}
                        onAccept={() => acceptTruco(humanPlayer!.userId)}
                        onReject={() => rejectTruco(humanPlayer!.userId)}
                        onRaise={gameState.trucoLevel < 3 ? () => callTruco(humanPlayer!.userId, (gameState.trucoLevel+1) as 1|2|3) : undefined}
                        canRaise={gameState.trucoLevel < 3} />
                    )}
                    {showEnvidoModal && (
                      <BidModal type="envido" level={gameState.envidoLevel} callerName={callerName(envidoCaller)}
                        myEnvidoPoints={humanEnvido.value}
                        onAccept={() => acceptEnvido(humanPlayer!.userId)}
                        onReject={() => rejectEnvido(humanPlayer!.userId)}
                        onRaise={gameState.envidoLevel < 3 ? () => callEnvido(humanPlayer!.userId, (gameState.envidoLevel+1) as 1|2|3) : undefined}
                        canRaise={gameState.envidoLevel < 3} />
                    )}
                    {showFlorModal && (
                      <BidModal type="flor" level={gameState.florLevel} callerName={callerName(florCaller)}
                        onAccept={() => acceptFlor(humanPlayer!.userId)}
                        onReject={() => rejectFlor(humanPlayer!.userId)}
                        canRaise={false} />
                    )}
                    {showEnvidoPts && (
                      <EnvidoPointsModal myPoints={humanEnvido.value}
                        opponentPoints={gameState.envidoPointsCall?.points}
                        isFirstAnnouncer={isFirstAnnouncer}
                        onAnnounce={() => announceEnvidoPoints(humanPlayer!.userId, false)}
                        onSonBuenas={() => announceEnvidoPoints(humanPlayer!.userId, true)} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── BOTTOM ZONE: action buttons + player hand ── */}
            <div className="shrink-0 flex flex-col gap-2">

              {/* Action buttons row — always visible above hand */}
              <AnimatePresence>
                {showActionBtns && (
                  <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:10 }}
                    className="flex flex-wrap gap-1.5 justify-center">
                    {canCallTruco && (
                      <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                        onClick={() => callTruco(humanPlayer!.userId, 1)}
                        className="btn py-2 px-4 text-xs font-bold flex items-center gap-1.5"
                        style={{ background:'linear-gradient(135deg,rgba(245,158,11,0.25),rgba(245,158,11,0.08))', border:'1px solid rgba(245,158,11,0.5)', color:'#f59e0b' }}>
                        <Swords className="w-3.5 h-3.5" />¡Truco!
                      </motion.button>
                    )}
                    {canCallRetruco && (
                      <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                        onClick={() => callTruco(humanPlayer!.userId, 2)}
                        className="btn py-2 px-4 text-xs font-bold"
                        style={{ background:'linear-gradient(135deg,rgba(245,158,11,0.3),rgba(245,158,11,0.08))', border:'1px solid rgba(245,158,11,0.6)', color:'#fbbf24' }}>
                        ⚔️ ¡Retruco!
                      </motion.button>
                    )}
                    {canCallValeCuatro && (
                      <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                        onClick={() => callTruco(humanPlayer!.userId, 3)}
                        className="btn py-2 px-4 text-xs font-bold"
                        style={{ background:'linear-gradient(135deg,rgba(212,175,55,0.35),rgba(212,175,55,0.08))', border:'1px solid rgba(212,175,55,0.6)', color:'#d4af37' }}>
                        🔥 ¡Vale 4!
                      </motion.button>
                    )}
                    {canCallEnvido && (
                      <>
                        <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                          onClick={() => callEnvido(humanPlayer!.userId, 1)}
                          className="btn py-2 px-3 text-xs flex items-center gap-1"
                          style={{ background:'rgba(96,165,250,0.15)', border:'1px solid rgba(96,165,250,0.4)', color:'#60a5fa' }}>
                          <Zap className="w-3 h-3" />Envido
                        </motion.button>
                        <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                          onClick={() => callEnvido(humanPlayer!.userId, 2)}
                          className="btn py-2 px-3 text-xs flex items-center gap-1"
                          style={{ background:'rgba(96,165,250,0.18)', border:'1px solid rgba(96,165,250,0.5)', color:'#93c5fd' }}>
                          <Star className="w-3 h-3" />Real
                        </motion.button>
                        <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                          onClick={() => callEnvido(humanPlayer!.userId, 3)}
                          className="btn py-2 px-3 text-xs flex items-center gap-1"
                          style={{ background:'rgba(192,132,252,0.15)', border:'1px solid rgba(192,132,252,0.4)', color:'#c084fc' }}>
                          <Shield className="w-3 h-3" />Falta
                        </motion.button>
                      </>
                    )}
                    {canGoToDeck && (
                      <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                        onClick={() => goToDeck(humanPlayer!.userId)}
                        className="btn btn-felt py-2 px-3 text-xs flex items-center gap-1">
                        <ChevronDown className="w-3 h-3" />Al mazo
                      </motion.button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Turn label */}
              <div className="flex justify-center">
                <div className="text-xs px-3 py-1 rounded-full"
                  style={{
                    background: isMyTurn ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isMyTurn ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.07)'}`,
                    color: isMyTurn ? 'var(--color-gold)' : 'var(--color-text-muted)',
                  }}>
                  {isMyTurn && isPhase('playing') ? '● Tu turno — elegí una carta'
                   : isMyTurn ? '● Tu turno'
                   : '○ Esperando...'}
                </div>
              </div>

              {/* Player hand */}
              <div className="px-3 py-3 rounded-2xl"
                style={{
                  background:'rgba(0,0,0,0.28)',
                  border: isMyTurn ? '1px solid rgba(212,175,55,0.25)' : '1px solid rgba(255,255,255,0.05)',
                  boxShadow: isMyTurn ? '0 0 20px rgba(212,175,55,0.08)' : 'none',
                  transition:'all 0.4s',
                }}>
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

        {/* ═══ RIGHT SIDEBAR ═══ */}
        <div className="shrink-0 flex flex-col gap-3" style={{ width: 140 }}>

          {/* Score panel */}
          <div className="rounded-2xl p-4 flex flex-col gap-4"
            style={{ background:'rgba(13,32,22,0.9)', border:'1px solid rgba(212,175,55,0.2)', boxShadow:'0 8px 24px rgba(0,0,0,0.4)' }}>
            {/* Meta */}
            <div className="text-center">
              <div className="text-xs mb-0.5" style={{ color:'var(--color-text-muted)' }}>META</div>
              <div className="text-xl font-black" style={{ fontFamily:'Playfair Display,serif', color:'var(--color-gold)' }}>
                {gameState.targetPoints}
              </div>
            </div>
            <div className="h-px" style={{ background:'rgba(212,175,55,0.15)' }} />
            {/* Human */}
            <ScorePill
              label={humanPlayer?.username || 'Vos'}
              score={humanPts} total={gameState.targetPoints}
              color="#d4af37" active={isMyTurn} isBot={false}
            />
            <div className="text-center text-xs font-bold" style={{ color:'var(--color-text-muted)' }}>VS</div>
            {/* Bot */}
            <ScorePill
              label={botPlayer?.username || 'Bot'}
              score={botPts} total={gameState.targetPoints}
              color="#ef4444" active={!isMyTurn} isBot
            />
          </div>

          {/* Game info mini panel */}
          <div className="rounded-2xl p-3 text-xs flex flex-col gap-2"
            style={{ background:'rgba(13,32,22,0.8)', border:'1px solid rgba(212,175,55,0.12)' }}>
            <div className="flex flex-col gap-1.5">
              {[
                { label:'Baza', value:`${gameState.currentManoIndex+1}/3` },
                { label:'Truco', value:['—','Truco','Retruco','Vale4'][gameState.trucoLevel] },
                { label:'Envido', value: gameState.envidoResolved ? '✓' : ['—','Envido','Real','Falta'][gameState.envidoLevel] },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center gap-1">
                  <span style={{ color:'var(--color-text-muted)' }}>{label}</span>
                  <span className="font-semibold text-right" style={{ color:'var(--color-text)' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Envido hint when relevant */}
            {!gameState.envidoResolved && gameState.tricksPlayedThisHand === 0 && isMyTurn && isPhase('playing') && (
              <div className="pt-1.5 border-t text-center" style={{ borderColor:'rgba(255,255,255,0.08)' }}>
                <span style={{ color:'#60a5fa' }}>Tu envido</span>
                <div className="text-lg font-black" style={{ color:'#38bdf8', fontFamily:'Playfair Display,serif' }}>
                  {humanEnvido.value}
                </div>
              </div>
            )}
          </div>

          {/* Event log toggle */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background:'rgba(13,32,22,0.8)', border:'1px solid rgba(212,175,55,0.12)' }}>
            <button className="w-full flex items-center justify-between px-3 py-2 text-xs"
              style={{ color:'var(--color-gold-muted)' }}
              onClick={() => setShowLog(!showLog)}>
              <span>📋 Log</span>
              {showLog ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <AnimatePresence>
              {showLog && (
                <motion.div initial={{ height:0 }} animate={{ height:'auto' }} exit={{ height:0 }}
                  className="overflow-hidden">
                  <div ref={logRef} className="p-2 space-y-1 overflow-y-auto" style={{ maxHeight:200 }}>
                    {gameState.messages.length === 0 && (
                      <p className="text-xs text-center py-2" style={{ color:'var(--color-text-muted)' }}>Inicio...</p>
                    )}
                    <AnimatePresence initial={false}>
                      {gameState.messages.slice(-20).map((msg) => {
                        const s = msgColors[msg.type] || msgColors.info
                        return (
                          <motion.div key={msg.id}
                            initial={{ opacity:0, x:12 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }}
                            className="px-2 py-1 rounded-lg text-xs leading-tight"
                            style={{ background:s.bg, color:s.color, border:`1px solid ${s.color}22` }}>
                            {msg.text}
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Win/lose modal */}
      <AnimatePresence>
        {gameState.winner && (
          <ResultModal winner={gameState.winner} humanId={humanPlayer?.userId || ''}
            humanPts={humanPts} botPts={botPts} onNewGame={handleNewGame} />
        )}
      </AnimatePresence>
    </div>
  )
}
