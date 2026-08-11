import { useState, useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, RotateCcw, Volume2, VolumeX,
  ChevronDown, ChevronUp,
  CheckCircle, XCircle, Award, MessageSquare,
} from 'lucide-react'
import type { GameMessage } from '../../types'

const msgColors: Record<string,{bg:string;color:string}> = {
  info:    { bg:'rgba(96,165,250,0.1)',  color:'#93c5fd' },
  warning: { bg:'rgba(245,158,11,0.1)', color:'#fcd34d' },
  success: { bg:'rgba(34,197,94,0.1)',  color:'#86efac' },
  error:   { bg:'rgba(196,30,58,0.1)',  color:'#fca5a5' },
}

// ── Event log body (reutilizado por el sidebar y el log flotante móvil) ──
function LogBody({ messages, logRef, maxHeight }: {
  messages: GameMessage[]
  logRef: RefObject<HTMLDivElement | null>
  maxHeight: number
}) {
  return (
    <div ref={logRef} className="p-2 space-y-1 overflow-y-auto" style={{ maxHeight }}>
      {messages.length === 0 && (
        <p className="text-xs text-center py-2" style={{ color:'var(--color-text-muted)' }}>Inicio...</p>
      )}
      <AnimatePresence initial={false}>
        {messages.slice(-20).map((m) => {
          const s = msgColors[m.type] || msgColors.info
          return (
            <motion.div key={m.id}
              initial={{ opacity:0, x:12 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }}
              className="px-2 py-1 rounded-lg text-xs leading-tight"
              style={{ background:s.bg, color:s.color, border:`1px solid ${s.color}22` }}>
              {m.text}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
import { useGameStore } from '../../stores/gameStore'
import { calculateEnvido, getTrucoPoints, hasFlor } from '../../utils/trucoRules'
import { setSoundsEnabled, sayCall } from '../../utils/sounds'
import SpanishCard from '../../components/game/SpanishCard'
import CardHand from '../../components/game/CardHand'
import BotArea from '../../components/game/BotArea'
import type { Card } from '../../types'

// Dimensiones de las cartas (coinciden con SpanishCard) — para escalar por baza
const CARD_DIMS = {
  tiny:   { w: 52, h: 80 },
  small:  { w: 68, h: 104 },
  medium: { w: 90, h: 138 },
} as const

// ── Responsive layout ─────────────────────────────────────────
// isMobile (ancho < 768px): sin sidebar — marcador en el header, log flotante.
// compact (alto bajo o mobile): cartas y espaciados más chicos.
function useResponsive() {
  const [vp, setVp] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1200,
    h: typeof window !== 'undefined' ? window.innerHeight : 800,
  }))
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const isMobile = vp.w < 768
  const compact = isMobile || vp.h < 780
  const short = vp.h < 640
  return {
    isMobile,
    compact,
    short,
  }
}

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

// ── Bid modal (Truco challenge) ────────────────────────────────
function BidModal({ level, callerName, onAccept, onReject, onRaise, canRaise }: {
  level: number; callerName: string
  onAccept: ()=>void; onReject: ()=>void; onRaise?: ()=>void; canRaise?: boolean
}) {
  const labels = ['', 'Truco', 'Retruco', '¡Vale Cuatro!']
  const color = '#f59e0b'
  const label = labels[level] || 'Truco'
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
        className="text-3xl mb-1 relative z-10">⚔️</motion.div>
      <p className="text-xs font-bold tracking-widest mb-0.5 relative z-10"
        style={{ color:`${color}aa`, letterSpacing:'0.18em' }}>
        {callerName.toUpperCase()} CANTÓ
      </p>
      <h3 className="text-xl font-bold mb-1 relative z-10"
        style={{ fontFamily:'Playfair Display,serif', color }}>¡{label}!</h3>
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
            <ChevronUp className="w-3.5 h-3.5" />{labels[level+1] || 'Subir'}
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

// ── Envido bid modal (permite subir con Envido repetido / Real / Falta) ──
function EnvidoBidModal({ level, lastCall, acumulado, callerName, myEnvidoPoints, onAccept, onReject, onRaise }: {
  level: number
  lastCall: 'envido' | 'real' | 'falta' | null
  acumulado: number
  callerName: string
  myEnvidoPoints?: number
  onAccept: ()=>void
  onReject: ()=>void
  onRaise: (type: 'envido' | 'real' | 'falta')=>void
}) {
  const color = '#60a5fa'
  const title = level === 3 || lastCall === 'falta' ? 'Falta Envido'
    : lastCall === 'real' ? 'Real Envido'
    : 'Envido'
  // Escaladas válidas según el canto en curso:
  //  Envido → Envido (doble, +2); Real Envido (+3); Falta Envido (el resto)
  const canDoble = level === 1 && lastCall === 'envido'
  const canReal = level < 3 && lastCall !== 'real'
  const canFalta = level < 3
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
        className="text-3xl mb-1 relative z-10">🃏</motion.div>
      <p className="text-xs font-bold tracking-widest mb-0.5 relative z-10"
        style={{ color:`${color}aa`, letterSpacing:'0.18em' }}>
        {callerName.toUpperCase()} CANTÓ
      </p>
      <h3 className="text-xl font-bold mb-1 relative z-10"
        style={{ fontFamily:'Playfair Display,serif', color }}>¡{title}!</h3>
      {acumulado > 0 && (
        <p className="text-xs mb-1 relative z-10" style={{ color:'var(--color-gold-muted)' }}>
          En juego: <strong style={{ color:'var(--color-gold)' }}>{acumulado} pts</strong>
        </p>
      )}
      {level === 3 && (
        <p className="text-xs mb-1 relative z-10" style={{ color:'var(--color-gold-muted)' }}>
          En juego: <strong style={{ color:'var(--color-gold)' }}>el resto</strong>
        </p>
      )}
      {myEnvidoPoints !== undefined && (
        <p className="text-xs mb-2 relative z-10" style={{ color:'var(--color-text-muted)' }}>
          Tu envido: <strong style={{ color }}>{myEnvidoPoints}</strong>
        </p>
      )}
      <div className="flex flex-col gap-1.5 relative z-10 mt-3">
        <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
          onClick={onAccept} className="btn py-2.5 text-sm font-bold"
          style={{ background:`linear-gradient(135deg,${color}44,${color}18)`, color, border:`1px solid ${color}55` }}>
          <CheckCircle className="w-3.5 h-3.5" />¡Quiero!
        </motion.button>
        {canDoble && (
          <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            onClick={() => onRaise('envido')} className="btn py-2.5 text-sm"
            style={{ background:'rgba(96,165,250,0.12)', color:'#60a5fa', border:'1px solid rgba(96,165,250,0.4)' }}>
            <ChevronUp className="w-3.5 h-3.5" />¡Envido! (doble)
          </motion.button>
        )}
        {canReal && (
          <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            onClick={() => onRaise('real')} className="btn py-2.5 text-sm"
            style={{ background:'rgba(212,175,55,0.1)', color:'var(--color-gold)', border:'1px solid rgba(212,175,55,0.35)' }}>
            <ChevronUp className="w-3.5 h-3.5" />Real Envido
          </motion.button>
        )}
        {canFalta && (
          <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            onClick={() => onRaise('falta')} className="btn py-2.5 text-sm"
            style={{ background:'rgba(192,132,252,0.12)', color:'#c084fc', border:'1px solid rgba(192,132,252,0.4)' }}>
            <ChevronUp className="w-3.5 h-3.5" />Falta Envido
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

// ── Botón de acción principal (estilo Truco Blyts) ─────────────
function MainActionBtn({ label, sub, enabled, color, active, onClick, badge, small }: {
  label: string
  sub?: string
  enabled: boolean
  color: string
  active?: boolean
  onClick?: () => void
  badge?: string
  small?: boolean
}) {
  return (
    <motion.button
      whileHover={enabled ? { scale: 1.04 } : {}}
      whileTap={enabled ? { scale: 0.96 } : {}}
      onClick={enabled ? onClick : undefined}
      className="btn relative flex flex-col items-center justify-center gap-0.5"
      style={{
        minWidth: small ? 60 : 84,
        padding: small ? '7px 7px' : '9px 14px',
        background: enabled
          ? (active ? `linear-gradient(135deg,${color}44,${color}18)` : `linear-gradient(135deg,${color}2e,${color}0d)`)
          : 'rgba(255,255,255,0.02)',
        border: enabled ? `1.5px solid ${color}55` : '1px solid rgba(255,255,255,0.06)',
        color: enabled ? color : 'rgba(255,255,255,0.22)',
        boxShadow: active ? `0 0 18px ${color}22` : 'none',
        cursor: enabled ? 'pointer' : 'not-allowed',
        transition: 'all 0.25s',
      }}>
      <span className={`${small ? 'text-xs' : 'text-sm'} font-bold leading-none`}>{label}</span>
      {sub && <span className="text-[10px] font-semibold opacity-80 leading-none">{sub}</span>}
      {badge && (
        <span className="absolute -top-1.5 -right-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-full"
          style={{ background: color, color: '#0a120c', boxShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
          {badge}
        </span>
      )}
    </motion.button>
  )
}

// ── Opción del submenú (Truco/Retruco/Vale4 · Envido/Real/Falta) ──
function SubActionBtn({ label, enabled, color, onClick }: {
  label: string
  enabled: boolean
  color: string
  onClick: () => void
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.9 }}
      whileHover={enabled ? { scale: 1.05 } : {}}
      whileTap={enabled ? { scale: 0.95 } : {}}
      onClick={enabled ? onClick : undefined}
      className="btn py-2 px-3 text-xs font-bold whitespace-nowrap"
      style={enabled
        ? { background: `linear-gradient(135deg,${color}38,${color}12)`, border: `1.5px solid ${color}70`, color, boxShadow: `0 0 14px ${color}22` }
        : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.22)', cursor: 'not-allowed' }}>
      {label}
    </motion.button>
  )
}

// ── Main GameTable ─────────────────────────────────────────────
export default function GameTable() {
  const navigate = useNavigate()
  const {
    gameState, isPlaying, isDealing, finishDealing, clearBotToast,
    playCard, callTruco, acceptTruco, rejectTruco,
    callEnvido, acceptEnvido, rejectEnvido, announceEnvidoPoints,
    goToDeck, botPlay, resetGame, continueAfterHandResult,
  } = useGameStore()

  const { isMobile, compact, short } = useResponsive()

  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showLog, setShowLog] = useState(false)
  // Submenú abierto de la barra de cantos ('truco' | 'envido' | null)
  const [openMenu, setOpenMenu] = useState<'truco' | 'envido' | null>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const [dealStep, setDealStep] = useState(0)

  const humanPlayer = gameState?.players.find((p) => !p.isBot)
  const botPlayer   = gameState?.players.find((p) => p.isBot)
  const humanIndex  = gameState?.players.findIndex((p) => !p.isBot) ?? 0
  const botIndex    = gameState?.players.findIndex((p) => p.isBot)  ?? 1

  useEffect(() => { if (isDealing) setDealStep(0) }, [isDealing])

  // Toggle de sonido → activa/desactiva la voz de los cantos
  useEffect(() => { setSoundsEnabled(soundEnabled) }, [soundEnabled])

  // Al cambiar turno o fase, se cierra el submenú de cantos
  useEffect(() => {
    setOpenMenu(null)
  }, [gameState?.currentTurn, gameState?.gamePhase])

  // Al terminar la mano/ronda (fase hand_result): se muestra el resultado
  // ~2.6s y DESPUÉS se reparte la mano nueva.
  useEffect(() => {
    if (gameState?.gamePhase !== 'hand_result') return
    const t = setTimeout(() => continueAfterHandResult(), 2600)
    return () => clearTimeout(t)
  }, [gameState?.gamePhase, continueAfterHandResult])

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
  const callerName = (id: string | null) =>
    id ? (gameState.players.find((p) => p.userId === id)?.username ?? 'Rival') : 'Rival'

  const humanCalledTruco  = trucoCaller  === humanPlayer?.userId
  const humanCalledEnvido = envidoCaller === humanPlayer?.userId

  const handResult = gameState.handResult
  const handResultWinnerIsHuman = handResult?.winnerId === humanPlayer?.userId
  const handResultWinnerName = handResult
    ? (gameState.players.find((p) => p.userId === handResult.winnerId)?.username ?? 'Rival')
    : ''
  const handResultReasonText = handResult?.reason === 'mano' ? 'Ganó la mano'
    : handResult?.reason === 'no-quiero' ? 'No quiso el canto'
    : handResult?.reason === 'mazo' ? 'Se fue al mazo'
    : ''

  // Lo que está en juego ahora (visible siempre en el centro de la mesa)
  const stakeLabel = (() => {
    if (gameState.envidoLevel > 0 && !gameState.envidoResolved) {
      return gameState.envidoLevel === 3
        ? '🃏 Falta Envido · el resto'
        : `🃏 Envido · ${gameState.envidoAccumulated} pts`
    }
    if (gameState.trucoLevel > 0) {
      const pts = getTrucoPoints(gameState.trucoLevel)
      return `⚔️ ${['', 'Truco', 'Retruco', 'Vale 4'][gameState.trucoLevel]} · ${pts} pts`
    }
    return '🎴 Mano · 1 pt'
  })()

  const showTrucoModal   = isPhase('truco')         && isMyTurn && !humanCalledTruco
  const showEnvidoModal  = isPhase('envido')         && isMyTurn && !humanCalledEnvido
  const showEnvidoPts    = isPhase('envido_points')  && isMyTurn
  const isFirstAnnouncer = showEnvidoPts && !gameState.envidoPointsCall

  const canCallTruco      = isPhase('playing') && isMyTurn && gameState.trucoLevel === 0
  const canCallRetruco    = isPhase('playing') && isMyTurn && gameState.trucoLevel === 1 && !humanCalledTruco
  const canCallValeCuatro = isPhase('playing') && isMyTurn && gameState.trucoLevel === 2 && !humanCalledTruco
  // El envido solo se puede cantar durante la primera baza (0 o 1 carta en mesa)
  const canCallEnvido     = isPhase('playing') && isMyTurn && gameState.envidoLevel === 0
                            && !gameState.envidoResolved
                            && gameState.tricksPlayedThisHand === 0
                            && gameState.currentManoIndex === 0
  const humanEnvido = humanIndex >= 0 && gameState.hands[humanIndex]
    ? calculateEnvido(gameState.hands[humanIndex])
    : { value: 0, hasEnvido: false }

  const canGoToDeck       = isPhase('playing') && isMyTurn
  const showActionBtns    = isPhase('playing') && isMyTurn
    && (canCallTruco || canCallRetruco || canCallValeCuatro || canCallEnvido || canGoToDeck)

  // Barra de cantos (estilo Truco Blyts)
  const hasFlorThisHand = humanIndex >= 0 && gameState.hands[humanIndex]
    ? hasFlor(gameState.hands[humanIndex])
    : false
  const trucoSub = gameState.trucoLevel > 0
    ? `${['', 'Truco', 'Retruco', 'Vale 4'][gameState.trucoLevel]} · ${getTrucoPoints(gameState.trucoLevel)} pts`
    : undefined
  const envidoSub = gameState.envidoLevel > 0 && !gameState.envidoResolved
    ? `En juego: ${gameState.envidoAccumulated} pts`
    : canCallEnvido ? `Tu envido: ${humanEnvido.value}` : undefined

  // (tableCards unused — table now reads directly from gameState.manos)

  const handlePlayCard = (card: Card) => {
    if (!humanPlayer || !isMyTurn || !isPhase('playing')) return
    playCard(humanPlayer.userId, card)
  }
  const handleNewGame = () => { resetGame(); navigate('/lobby') }

  // ── Main render: fixed-height, no scroll ──────────────────
  return (
    <div className="felt-bg game-table-viewport relative overflow-hidden flex flex-col">

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

        {/* Center: phase + mini scores (mobile) */}
        <div className="flex items-center justify-center gap-2 min-w-0">
          <PhaseBadge phase={gameState.gamePhase} trucoLevel={gameState.trucoLevel} />
          {isMobile && (
            <div className="flex items-center gap-1.5 text-xs font-bold whitespace-nowrap">
              <span style={{ color:'#d4af37' }}>⭐{humanPts}</span>
              <span style={{ color:'rgba(255,255,255,0.3)' }}>/</span>
              <span style={{ color:'#ef4444' }}>🤖{botPts}</span>
            </div>
          )}
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-1">
          {isMobile && (
            <button onClick={() => setShowLog(!showLog)} className="p-1.5 rounded-lg"
              style={{ color: showLog ? 'var(--color-gold)' : 'var(--color-text-muted)' }}>
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-1.5 rounded-lg"
            style={{ color:'var(--color-text-muted)' }}>
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleNewGame} className="p-1.5 rounded-lg" style={{ color:'var(--color-text-muted)' }}>
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Mobile: log flotante (dropdown bajo el header) */}
      {isMobile && showLog && (
        <div className="absolute left-2 right-2 top-14 z-30 rounded-2xl overflow-hidden"
          style={{ background:'rgba(8,20,13,0.98)', border:'1px solid rgba(212,175,55,0.25)', boxShadow:'0 20px 60px rgba(0,0,0,0.7)' }}>
          <LogBody messages={gameState.messages} logRef={logRef} maxHeight={200} />
        </div>
      )}

      {/* ── Main layout: felt table + right sidebar ── */}
      <div className={`relative z-10 flex-1 flex min-h-0 ${isMobile ? 'gap-2 p-2' : 'gap-3 p-3'}`}>

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
            style={{ border:'1px solid rgba(212,175,55,0.08)' }} />          <div className={`relative z-10 flex flex-col h-full ${compact ? 'p-2 gap-1.5' : 'p-3 gap-2'}`}>

            {/* ── BOT AREA (top, compact) ── */}
            <div className="shrink-0 flex justify-center">
              <div className={compact ? 'px-3 py-1.5 rounded-2xl' : 'px-4 py-2.5 rounded-2xl'}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: !isMyTurn ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(255,255,255,0.05)',
                  boxShadow: !isMyTurn ? '0 0 18px rgba(239,68,68,0.12)' : 'none',
                  transition: 'all 0.4s',
                }}>
                <BotArea
                  username={botPlayer?.username || 'Bot'}
                  cardsCount={gameState.hands[botIndex]?.length || 0}
                  isActive={gameState.currentTurn === botPlayer?.userId}
                  compact={compact}
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
            <div className="flex-1 flex flex-col items-center justify-center relative min-h-0 gap-1">
              {/* Decorative oval */}
              <div className="absolute inset-x-8 inset-y-6 rounded-[50%] pointer-events-none"
                style={{ border:'1px solid rgba(212,175,55,0.07)' }} />

              {/* En juego: valor actual de la mano (en flujo, no tapa nada) */}
              <div className="relative z-10 shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                style={{ background:'rgba(8,20,13,0.92)', border:'1px solid rgba(212,175,55,0.32)', color:'var(--color-gold-light)', boxShadow:'0 4px 18px rgba(0,0,0,0.45)' }}>
                {stakeLabel}
              </div>

              {/* 3 baza columns — la baza actual se destaca (más grande, marco dorado)
                  y las cartas se juegan en diagonal como en una mesa real */}
              <div className={`relative z-10 flex-1 flex items-center justify-center w-full px-1 min-h-0 ${compact ? 'gap-1.5' : 'gap-4'}`}>
                {[0,1,2].map((mi) => {
                  const mano = gameState.manos[mi]
                  const botCard   = mano?.cards.find((c) => c.playerId === botPlayer?.userId)
                  const humanCard = mano?.cards.find((c) => c.playerId === humanPlayer?.userId)
                  const isCurrent = mi === gameState.currentManoIndex
                  const isWon     = mano?.winner !== undefined
                  const winnerIsHuman = mano?.winner === humanPlayer?.userId
                  const winnerIsBot   = mano?.winner === botPlayer?.userId
                  const isTie     = mano?.winner === 'tie'
                  const isHandResult = gameState.gamePhase === 'hand_result'
                  const dimmed    = mi > gameState.currentManoIndex && !isWon
                  // Baza activa: la que se está jugando (o la decisiva al mostrar el resultado)
                  const curActive = (isCurrent && !isWon) || (isHandResult && isCurrent)
                  // Tamaño: la baza activa más grande, las pasadas más chicas
                  const colSize  = curActive
                    ? (short ? 'tiny' : isMobile ? 'small' : 'medium')
                    : (isMobile ? 'tiny' : 'small')
                  const colW = CARD_DIMS[colSize].w
                  const colH = CARD_DIMS[colSize].h
                  const cardAreaW = colW * 2 - 26
                  const cardAreaH = colH + 16
                  const showCards = isCurrent || isWon

                  return (
                    <div key={mi} className="flex flex-col items-center gap-1.5 rounded-2xl px-2 py-1.5 transition-all duration-400"
                      style={{
                        opacity: dimmed ? 0.25 : 1,
                        border: curActive ? '1.5px solid rgba(212,175,55,0.38)' : '1.5px solid transparent',
                        boxShadow: curActive
                          ? '0 0 28px rgba(212,175,55,0.14), inset 0 0 34px rgba(212,175,55,0.05)'
                          : 'none',
                      }}>
                      {/* Baza result label */}
                      <div className="text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap"
                        style={{
                          background: isWon
                            ? (isTie ? 'rgba(255,255,255,0.08)' : winnerIsHuman ? 'rgba(212,175,55,0.2)' : 'rgba(239,68,68,0.2)')
                            : curActive ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.05)',
                          color: isWon
                            ? (isTie ? '#9ca3af' : winnerIsHuman ? '#d4af37' : '#ef4444')
                            : curActive ? 'var(--color-gold)' : 'rgba(255,255,255,0.35)',
                          border: curActive ? '1px solid rgba(212,175,55,0.3)' : '1px solid transparent',
                        }}>
                        {isWon
                          ? (isTie ? '🤝 Parda' : winnerIsHuman ? '⭐ Tuya' : '🤖 Bot')
                          : curActive
                            ? '● Baza ' + (mi + 1)
                            : 'Baza ' + (mi + 1)}
                      </div>

                      {showCards ? (
                        /* Cartas jugadas en diagonal (bot arriba-izquierda, vos abajo-derecha) */
                        <div className="relative" style={{ width: cardAreaW, height: cardAreaH }}>
                          {/* Carta del bot */}
                          {botCard?.played && botCard.card ? (
                            <motion.div key={`bot-${mi}-${botCard.card.rank}-${botCard.card.suit}`}
                              className="absolute"
                              style={{
                                top: 0, left: 0, zIndex: 1,
                                filter: isWon
                                  ? `drop-shadow(0 10px 22px rgba(0,0,0,0.65)) drop-shadow(0 0 14px ${winnerIsBot ? 'rgba(239,68,68,0.7)' : isTie ? 'rgba(156,163,175,0.55)' : 'rgba(0,0,0,0)'})`
                                  : 'drop-shadow(0 10px 22px rgba(0,0,0,0.65))',
                              }}
                              initial={{ opacity: 0, y: -42, scale: 0.65, rotate: -14 }}
                              animate={{
                                opacity: 1, y: 0, rotate: -6,
                                scale: isWon && winnerIsBot ? [1, 1.16, 1] : 1,
                              }}
                              exit={{ opacity: 0, scale: 0.85 }}
                              transition={{ type: 'spring', stiffness: 280, damping: 22 }}>
                              <SpanishCard card={botCard.card} size={colSize} />
                            </motion.div>
                          ) : (
                            <div className="absolute" style={{
                              top: 0, left: 0, width: colW, height: colH, borderRadius: 10,
                              border: '1px dashed rgba(239,68,68,0.18)',
                              background: 'rgba(239,68,68,0.02)',
                            }} />
                          )}

                          {/* Carta tuya */}
                          {humanCard?.played && humanCard.card ? (
                            <motion.div key={`human-${mi}-${humanCard.card.rank}-${humanCard.card.suit}`}
                              className="absolute"
                              style={{
                                bottom: 0, right: 0, zIndex: 2,
                                filter: isWon
                                  ? `drop-shadow(0 10px 22px rgba(0,0,0,0.65)) drop-shadow(0 0 14px ${winnerIsHuman ? 'rgba(212,175,55,0.7)' : isTie ? 'rgba(156,163,175,0.55)' : 'rgba(0,0,0,0)'})`
                                  : 'drop-shadow(0 10px 22px rgba(0,0,0,0.65))',
                              }}
                              initial={{ opacity: 0, y: 42, scale: 0.65, rotate: 14 }}
                              animate={{
                                opacity: 1, y: 0, rotate: 6,
                                scale: isWon && winnerIsHuman ? [1, 1.16, 1] : 1,
                              }}
                              exit={{ opacity: 0, scale: 0.85 }}
                              transition={{ type: 'spring', stiffness: 280, damping: 22 }}>
                              <SpanishCard card={humanCard.card} size={colSize} />
                            </motion.div>
                          ) : (
                            <div className="absolute" style={{
                              bottom: 0, right: 0, width: colW, height: colH, borderRadius: 10,
                              border: curActive ? '1px dashed rgba(212,175,55,0.32)' : '1px dashed rgba(212,175,55,0.08)',
                              background: curActive ? 'rgba(212,175,55,0.05)' : 'transparent',
                            }} />
                          )}
                        </div>
                      ) : (
                        /* Baza futura: solo el espacio */
                        <div style={{ width: cardAreaW, height: cardAreaH }} />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Bid & envido-points modals — overlay in center */}
              <AnimatePresence>
                {(showTrucoModal || showEnvidoModal || showEnvidoPts) && (
                  <motion.div
                    initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background:'rgba(6,16,10,0.75)', backdropFilter:'blur(6px)', borderRadius:16, zIndex:10 }}>
                    {showTrucoModal && (
                      <BidModal level={gameState.trucoLevel} callerName={callerName(trucoCaller)}
                        onAccept={() => acceptTruco(humanPlayer!.userId)}
                        onReject={() => rejectTruco(humanPlayer!.userId)}
                        onRaise={gameState.trucoLevel < 3 ? () => callTruco(humanPlayer!.userId, (gameState.trucoLevel+1) as 1|2|3) : undefined}
                        canRaise={gameState.trucoLevel < 3} />
                    )}
                    {showEnvidoModal && (
                      <EnvidoBidModal level={gameState.envidoLevel} lastCall={gameState.envidoLastCall}
                        acumulado={gameState.envidoAccumulated}
                        callerName={callerName(envidoCaller)}
                        myEnvidoPoints={humanEnvido.value}
                        onAccept={() => acceptEnvido(humanPlayer!.userId)}
                        onReject={() => rejectEnvido(humanPlayer!.userId)}
                        onRaise={(type) => callEnvido(humanPlayer!.userId, type)} />
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

              {/* ── HAND RESULT: se muestra quién ganó la mano y los puntos,
                     con las cartas ganadoras/perdedoras a la vista ~2.6s ── */}
              <AnimatePresence>
                {gameState.gamePhase === 'hand_result' && gameState.handResult && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{ background: 'rgba(6,16,10,0.6)', backdropFilter: 'blur(5px)', borderRadius: 16, zIndex: 30 }}>
                    <motion.div
                      initial={{ scale: 0.7, y: 24 }} animate={{ scale: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                      className="rounded-2xl px-8 py-5 text-center"
                      style={{
                        background: 'rgba(8,20,13,0.97)',
                        border: `2px solid ${handResultWinnerIsHuman ? 'rgba(212,175,55,0.6)' : 'rgba(239,68,68,0.5)'}`,
                        boxShadow: `0 0 50px ${handResultWinnerIsHuman ? 'rgba(212,175,55,0.25)' : 'rgba(239,68,68,0.2)'}`,
                      }}>
                      <motion.div className="text-4xl mb-1"
                        animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.9 }}>
                        {handResultWinnerIsHuman ? '🏆' : '🤖'}
                      </motion.div>
                      <p className="text-xs font-bold tracking-widest mb-0.5"
                        style={{ color: 'var(--color-gold-muted)', letterSpacing: '0.18em' }}>
                        {handResultReasonText.toUpperCase()}
                      </p>
                      <h3 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display,serif' }}>
                        <span style={{ color: handResultWinnerIsHuman ? 'var(--color-gold-light)' : '#ef4444' }}>
                          {handResultWinnerName}
                        </span>
                        <span style={{ color: 'var(--color-text-muted)' }}> gana </span>
                        <span style={{ color: 'var(--color-gold)' }}>+{gameState.handResult.points} pt{gameState.handResult.points !== 1 ? 's' : ''}</span>
                      </h3>
                      <div className="flex items-center justify-center gap-1.5 mt-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        <span>Repartiendo</span>
                        {[0, 1, 2].map((i) => (
                          <motion.span key={i} className="inline-block w-1 h-1 rounded-full" style={{ background: 'var(--color-gold)' }}
                            animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
                            transition={{ duration: 0.7, delay: i * 0.18, repeat: Infinity }} />
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── BOTTOM ZONE: action buttons + player hand ── */}
            <div className="shrink-0 flex flex-col gap-2">

              {/* ── Barra de cantos: 4 botones estilo Truco Blyts ── */}
              <AnimatePresence>
                {showActionBtns && (
                  <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:10 }}
                    className="flex flex-col items-center gap-1.5">

                    {/* Submenú: opciones de Truco o Envido al tocar el botón */}
                    <AnimatePresence mode="wait">
                      {openMenu && (
                        <motion.div key={openMenu} className="flex justify-center gap-1.5">
                          {openMenu === 'truco' ? (
                            <>
                              <SubActionBtn label="¡Truco!" enabled={canCallTruco} color="#f59e0b"
                                onClick={() => { callTruco(humanPlayer!.userId, 1); setOpenMenu(null) }} />
                              <SubActionBtn label="Retruco" enabled={canCallRetruco} color="#fbbf24"
                                onClick={() => { callTruco(humanPlayer!.userId, 2); setOpenMenu(null) }} />
                              <SubActionBtn label="¡Vale 4!" enabled={canCallValeCuatro} color="#d4af37"
                                onClick={() => { callTruco(humanPlayer!.userId, 3); setOpenMenu(null) }} />
                            </>
                          ) : (
                            <>
                              <SubActionBtn label="Envido" enabled={canCallEnvido} color="#60a5fa"
                                onClick={() => { callEnvido(humanPlayer!.userId, 'envido'); setOpenMenu(null) }} />
                              <SubActionBtn label="Real Envido" enabled={canCallEnvido} color="#38bdf8"
                                onClick={() => { callEnvido(humanPlayer!.userId, 'real'); setOpenMenu(null) }} />
                              <SubActionBtn label="Falta Envido" enabled={canCallEnvido} color="#c084fc"
                                onClick={() => { callEnvido(humanPlayer!.userId, 'falta'); setOpenMenu(null) }} />
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Los 4 botones: Truco · Envido · Flor · Al mazo */}
                    <div className={`flex justify-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
                      <MainActionBtn label="⚔️ Truco" sub={isMobile ? undefined : trucoSub} small={isMobile}
                        enabled={canCallTruco || canCallRetruco || canCallValeCuatro}
                        color="#f59e0b" active={openMenu === 'truco'}
                        onClick={() => setOpenMenu(openMenu === 'truco' ? null : 'truco')} />
                      <MainActionBtn label="🃏 Envido" sub={isMobile ? undefined : envidoSub} small={isMobile}
                        enabled={canCallEnvido}
                        color="#60a5fa" active={openMenu === 'envido'}
                        badge={canCallEnvido ? String(humanEnvido.value) : undefined}
                        onClick={() => setOpenMenu(openMenu === 'envido' ? null : 'envido')} />
                      <MainActionBtn label="🌸 Flor"
                        sub={isMobile
                          ? (hasFlorThisHand ? '+3 pts' : 'Sin flor')
                          : (hasFlorThisHand ? 'Cantada · +3 pts' : '3 del mismo palo')}
                        small={isMobile}
                        enabled={hasFlorThisHand}
                        color="#ec4899"
                        badge={hasFlorThisHand ? '+3 ✓' : undefined}
                        onClick={() => sayCall('¡Flor!', { excited: true })} />
                      <MainActionBtn label="🛡 Al mazo" small={isMobile}
                        enabled={canGoToDeck}
                        color="#94a3b8"
                        onClick={() => goToDeck(humanPlayer!.userId)} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Turn label — claro quién juega (oculto en pantallas muy bajas
                  para darle lugar a las cartas de la mano) */}
              {!short && (
              <div className="flex justify-center">
                {isMyTurn && isPhase('playing') ? (
                  <motion.div
                    initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold"
                    style={{
                      background: 'linear-gradient(135deg,rgba(212,175,55,0.22),rgba(212,175,55,0.08))',
                      border: '1.5px solid rgba(212,175,55,0.5)',
                      color: 'var(--color-gold-light)',
                      boxShadow: '0 0 22px rgba(212,175,55,0.18)',
                    }}>
                    <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 1.1, repeat: Infinity }}>
                      👇
                    </motion.span>
                    Tu turno — elegí una carta
                  </motion.div>
                ) : isMyTurn ? (
                  <div className="text-sm font-bold px-4 py-1.5 rounded-full"
                    style={{ background: 'rgba(212,175,55,0.12)', border: '1.5px solid rgba(212,175,55,0.4)', color: 'var(--color-gold)' }}>
                    ● Tu turno
                  </div>
                ) : (
                  <div className="text-xs px-3 py-1 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'var(--color-text-muted)' }}>
                    🤖 {botPlayer?.username || 'El Bot'} está pensando...
                  </div>
                )}
              </div>
              )}

              {/* Player hand — sin caja: cartas flotantes y grandes */}
              <CardHand
                cards={gameState.hands[humanIndex] || []}
                playerId={humanPlayer?.userId || ''}
                currentPlayerId={gameState.currentTurn}
                onPlayCard={handlePlayCard}
                isBot={false}
                size={short ? 'medium' : 'large'}
                disabled={!isMyTurn || !isPhase('playing')}
              />
            </div>
          </div>
        </div>

        {/* ═══ RIGHT SIDEBAR (solo desktop) ═══ */}
        {!isMobile && (
        <div className="shrink-0 flex flex-col gap-3" style={{ width: compact ? 128 : 140 }}>

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
                { label:'Envido', value: gameState.envidoResolved ? '✓'
                  : gameState.envidoLevel === 3 ? 'Falta'
                  : gameState.envidoLastCall === 'real' ? 'Real'
                  : gameState.envidoLevel === 2 ? 'Envido x2'
                  : gameState.envidoLevel === 1 ? 'Envido' : '—' },
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
                  <LogBody messages={gameState.messages} logRef={logRef} maxHeight={200} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        )}
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
