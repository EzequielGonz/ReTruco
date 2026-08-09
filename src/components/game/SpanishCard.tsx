import { memo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Card } from '../../types'
import { getCardPower } from '../../utils/trucoRules'

interface SpanishCardProps {
  card: Card
  onClick?: () => void
  disabled?: boolean
  selected?: boolean
  isPlayable?: boolean
  faceDown?: boolean
  size?: 'tiny' | 'small' | 'medium' | 'large'
  className?: string
  showPower?: boolean
}

// Base URL for real Spanish card images (Baraja española, Industria Argentina style)
// Repo: github.com/mcmd/playingcards.io-spanish.playing.cards (GPL-compatible)
const CDN = 'https://raw.githubusercontent.com/mcmd/playingcards.io-spanish.playing.cards/master/img'

// Maps our rank numbers to the two-digit string used in filenames
const RANK_FILE: Record<number, string> = {
  1: '01', 2: '02', 3: '03', 4: '04', 5: '05',
  6: '06', 7: '07', 10: '10', 11: '11', 12: '12',
}

function cardImageUrl(card: Pick<Card, 'suit' | 'rank'>): string {
  return `${CDN}/${RANK_FILE[card.rank]}-${card.suit}.png`
}

const CARD_BACK_URL = `${CDN}/reverso.png`

// Power badge for the top-4 cards
const SPECIAL_BADGES: Record<string, { label: string; color: string }> = {
  'espadas-1': { label: '★ Ancho E', color: '#1e3a5f' },
  'bastos-1':  { label: '★ Ancho B', color: '#14532d' },
  'espadas-7': { label: '7 Espadas', color: '#1d4ed8' },
  'oros-7':    { label: '7 Oros',    color: '#92400e' },
}

const SIZES = {
  tiny:   { w: 52,  h: 80  },
  small:  { w: 68,  h: 104 },
  medium: { w: 90,  h: 138 },
  large:  { w: 112, h: 172 },
}

// ── Fallback SVG card (shown while image loads or on error) ───
function FallbackCard({ card, w, h }: { card: Pick<Card, 'suit' | 'rank'>; w: number; h: number }) {
  const SUIT_COLORS: Record<string, string> = {
    espadas: '#1e3a5f', oros: '#a0600a', copas: '#991b1b', bastos: '#14532d',
  }
  const RANK_LABEL: Record<number, string> = {
    1:'A', 2:'2', 3:'3', 4:'4', 5:'5', 6:'6', 7:'7', 10:'S', 11:'C', 12:'R',
  }
  const SUIT_CHAR: Record<string, string> = {
    espadas: '⚔', oros: '◉', copas: '♥', bastos: '♣',
  }
  const color = SUIT_COLORS[card.suit] || '#333'
  return (
    <div style={{
      width: w, height: h, borderRadius: 8,
      background: 'linear-gradient(160deg,#fefdf5,#f8f0d8)',
      border: `2px solid ${color}66`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 4,
    }}>
      <span style={{ fontSize: Math.round(w * 0.28), fontWeight: 900, color, fontFamily: 'serif', lineHeight: 1 }}>
        {RANK_LABEL[card.rank]}
      </span>
      <span style={{ fontSize: Math.round(w * 0.22), color, lineHeight: 1 }}>
        {SUIT_CHAR[card.suit]}
      </span>
    </div>
  )
}

// ── Card Back ─────────────────────────────────────────────────
function CardBack({ w, h }: { w: number; h: number }) {
  const [imgOk, setImgOk] = useState(true)
  return (
    <div style={{ width: w, height: h, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
      border: '2px solid rgba(212,175,55,0.5)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
      background: '#0d2016',
    }}>
      {imgOk ? (
        <img
          src={CARD_BACK_URL}
          alt="reverso"
          width={w}
          height={h}
          onError={() => setImgOk(false)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{ width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'rgba(212,175,55,0.4)', fontFamily: 'serif', fontSize: w * 0.3, fontWeight: 900 }}>RT</span>
        </div>
      )}
    </div>
  )
}

// ── Main SpanishCard ──────────────────────────────────────────
const SpanishCard = memo(function SpanishCard({
  card,
  onClick,
  disabled = false,
  selected = false,
  isPlayable = false,
  faceDown = false,
  size = 'medium',
  className = '',
  showPower = false,
}: SpanishCardProps) {
  const { w, h } = SIZES[size]
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const power = getCardPower(card)
  const specialKey = `${card.suit}-${card.rank}`
  const badge = SPECIAL_BADGES[specialKey]
  const isTopPower = power <= 4

  if (faceDown) {
    return (
      <motion.div
        className={`relative select-none ${className}`}
        style={{ flexShrink: 0 }}
        whileHover={{ y: -4, rotateY: 5 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <CardBack w={w} h={h} />
      </motion.div>
    )
  }

  const imgUrl = cardImageUrl(card)

  return (
    <motion.div
      onClick={!disabled ? onClick : undefined}
      className={`relative select-none ${className}`}
      style={{
        width: w, height: h, flexShrink: 0,
        cursor: isPlayable && !disabled ? 'pointer' : disabled ? 'not-allowed' : 'default',
      }}
      whileHover={isPlayable && !disabled ? {
        y: -18, rotateY: -6, rotateX: 4, scale: 1.08,
        filter: 'drop-shadow(0 20px 32px rgba(0,0,0,0.65)) drop-shadow(0 0 12px rgba(212,175,55,0.3))',
      } : {}}
      whileTap={isPlayable && !disabled ? { scale: 0.96, y: -8 } : {}}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
    >
      {/* Image container */}
      <div
        style={{
          width: w, height: h, borderRadius: 8, overflow: 'hidden',
          border: selected
            ? '2px solid #d4af37'
            : isTopPower
            ? '2px solid rgba(212,175,55,0.7)'
            : '2px solid rgba(0,0,0,0.15)',
          boxShadow: selected
            ? '0 0 0 3px rgba(212,175,55,0.5), 0 12px 36px rgba(0,0,0,0.6)'
            : isTopPower
            ? '0 0 16px rgba(212,175,55,0.35), 0 8px 24px rgba(0,0,0,0.5)'
            : '0 4px 16px rgba(0,0,0,0.45)',
          opacity: disabled ? 0.4 : 1,
          transition: 'opacity 0.2s, box-shadow 0.25s',
          position: 'relative',
          background: '#f8f0d8',
        }}
      >
        {/* Skeleton while loading */}
        {!imgLoaded && !imgError && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(110deg,#f0e8d0 30%,#fdf6e3 50%,#f0e8d0 70%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.2s linear infinite',
          }} />
        )}

        {/* Real card image */}
        {!imgError ? (
          <img
            src={imgUrl}
            alt={`${card.rank} de ${card.suit}`}
            width={w}
            height={h}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            style={{
              width: '100%', height: '100%', objectFit: 'fill',
              display: 'block',
              opacity: imgLoaded ? 1 : 0,
              transition: 'opacity 0.25s',
            }}
          />
        ) : (
          <FallbackCard card={card} w={w} h={h} />
        )}

        {/* Shimmer overlay for top-power cards */}
        {isTopPower && imgLoaded && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(125deg,transparent 30%,rgba(255,220,60,0.15) 50%,transparent 70%)', backgroundSize: '250%' }}
            animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Selected pulse */}
        {selected && (
          <motion.div
            className="absolute inset-0 rounded-lg pointer-events-none"
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            style={{ boxShadow: '0 0 0 3px rgba(212,175,55,0.8), 0 0 24px rgba(212,175,55,0.5)', borderRadius: 6 }}
          />
        )}
      </div>

      {/* Special badge */}
      {badge && size !== 'tiny' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
          style={{
            position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
            whiteSpace: 'nowrap', padding: '1px 6px', borderRadius: 99,
            background: badge.color, border: '1px solid rgba(255,255,255,0.25)',
            fontSize: size === 'large' ? 8.5 : 7.5, fontWeight: 800,
            color: '#fff', letterSpacing: '0.05em',
            boxShadow: `0 2px 8px ${badge.color}99`, zIndex: 20,
          }}
        >
          {badge.label}
        </motion.div>
      )}

      {/* Power bubble */}
      {showPower && isPlayable && !disabled && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            position: 'absolute', top: -8, right: -8,
            width: 20, height: 20, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: power <= 4
              ? 'linear-gradient(135deg,#d4af37,#f0d060)'
              : power <= 8
              ? 'linear-gradient(135deg,#60a5fa,#3b82f6)'
              : 'linear-gradient(135deg,#6b7280,#4b5563)',
            color: power <= 4 ? '#1a1000' : '#fff',
            fontSize: 8, fontWeight: 900,
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)', zIndex: 20,
          }}
        >
          {17 - power}
        </motion.div>
      )}
    </motion.div>
  )
})

export default SpanishCard
