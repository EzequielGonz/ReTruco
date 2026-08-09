import { memo } from 'react'
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

// SVG suit icons drawn as paths
function SuitIcon({ suit, size = 16, color }: { suit: string; size?: number; color: string }) {
  const icons: Record<string, React.ReactNode> = {
    espadas: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2L6 10H10L8 16H12M12 2L18 10H14L16 16H12M12 16V22" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 22H16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    oros: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.5" fill={`${color}22`}/>
        <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1" fill={`${color}33`}/>
        <circle cx="12" cy="12" r="2" fill={color}/>
      </svg>
    ),
    copas: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M6 4H18C18 4 20 8 20 11C20 14 18 16 14 16C13 16 12.5 17 12 18.5M8 22H16M12 18.5V22M6 4C6 4 4 8 4 11C4 14 6 16 10 16C11 16 11.5 17 12 18.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    bastos: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 3C12 3 15 6 15 9C15 12 12 12 12 12C12 12 9 12 9 9C9 6 12 3 12 3Z" stroke={color} strokeWidth="1.5" fill={`${color}22`}/>
        <path d="M5 14C5 14 8 11 11 11C11 11 11 14 9 16C7 18 5 14 5 14Z" stroke={color} strokeWidth="1.5" fill={`${color}22`}/>
        <path d="M19 14C19 14 16 11 13 11C13 11 13 14 15 16C17 18 19 14 19 14Z" stroke={color} strokeWidth="1.5" fill={`${color}22`}/>
        <path d="M10 18H14L13 22H11L10 18Z" stroke={color} strokeWidth="1.5" fill={`${color}22`}/>
      </svg>
    ),
  }
  return <>{icons[suit] || null}</>
}

const SUIT_CONFIG: Record<string, { color: string; name: string; label: string }> = {
  espadas: { color: '#2c3e50', name: 'Espadas', label: 'ESP' },
  oros: { color: '#c9920a', name: 'Oros', label: 'ORO' },
  copas: { color: '#c41e3a', name: 'Copas', label: 'COP' },
  bastos: { color: '#1e6b2e', name: 'Bastos', label: 'BAS' },
}

const RANK_LABEL: Record<number, string> = {
  1: 'As', 2: '2', 3: '3', 4: '4', 5: '5',
  6: '6', 7: '7', 10: 'S', 11: 'C', 12: 'R',
}

const RANK_FULL: Record<number, string> = {
  1: 'AS', 2: 'DOS', 3: 'TRES', 4: 'CUATRO', 5: 'CINCO',
  6: 'SEIS', 7: 'SIETE', 10: 'SOTA', 11: 'CABALLO', 12: 'REY',
}

// Power tier badges for special cards
const POWER_SPECIALS: Record<string, { label: string; color: string }> = {
  'espadas-1': { label: '★ El Macho', color: '#d4af37' },
  'bastos-1': { label: '★ El Patrón', color: '#22c55e' },
  'espadas-7': { label: '☆ 7 Esp', color: '#60a5fa' },
  'oros-7': { label: '☆ 7 Oros', color: '#f59e0b' },
}

const SIZES = {
  tiny: { w: 52, h: 78, rankSize: 10, suitSize: 10, centerSize: 22, nameSize: 7 },
  small: { w: 68, h: 102, rankSize: 13, suitSize: 13, centerSize: 28, nameSize: 8 },
  medium: { w: 88, h: 132, rankSize: 16, suitSize: 16, centerSize: 36, nameSize: 10 },
  large: { w: 110, h: 165, rankSize: 20, suitSize: 18, centerSize: 44, nameSize: 12 },
}

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
  const { w, h, rankSize, suitSize, centerSize, nameSize } = SIZES[size]
  const suit = SUIT_CONFIG[card.suit] || { color: '#333', name: '?', label: '?' }
  const power = getCardPower(card)
  const specialKey = `${card.suit}-${card.rank}`
  const special = POWER_SPECIALS[specialKey]
  const isSpecial = !!special
  const isTopCard = power <= 4 // top 4 most powerful cards

  if (faceDown) {
    return (
      <div
        className={`relative rounded-xl select-none ${className}`}
        style={{
          width: w,
          height: h,
          background: 'linear-gradient(145deg, #0d2016 0%, #163024 100%)',
          border: '2px solid rgba(212,175,55,0.4)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
          flexShrink: 0,
        }}
      >
        {/* Back pattern */}
        <div
          className="absolute inset-1 rounded-lg"
          style={{
            background: `
              repeating-linear-gradient(
                45deg,
                rgba(212,175,55,0.07) 0px,
                rgba(212,175,55,0.07) 1px,
                transparent 1px,
                transparent 8px
              ),
              repeating-linear-gradient(
                -45deg,
                rgba(212,175,55,0.07) 0px,
                rgba(212,175,55,0.07) 1px,
                transparent 1px,
                transparent 8px
              )
            `,
            border: '1px solid rgba(212,175,55,0.2)',
          }}
        />
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: rankSize + 4,
            color: 'rgba(212,175,55,0.3)',
            fontWeight: 900,
          }}
        >
          RT
        </div>
      </div>
    )
  }

  return (
    <motion.div
      whileHover={isPlayable && !disabled ? { scale: 1.08, y: -14, rotate: 0 } : {}}
      whileTap={isPlayable && !disabled ? { scale: 0.95 } : {}}
      transition={{ type: 'spring', stiffness: 450, damping: 18 }}
      onClick={!disabled ? onClick : undefined}
      className={`relative select-none ${isPlayable && !disabled ? 'cursor-pointer' : disabled ? 'cursor-not-allowed' : 'cursor-default'} ${className}`}
      style={{
        width: w,
        height: h,
        flexShrink: 0,
        transform: isPlayable && !disabled ? 'rotate(-1deg)' : undefined,
      }}
    >
      {/* Card body */}
      <div
        className="absolute inset-0 rounded-xl flex flex-col overflow-hidden"
        style={{
          background: selected
            ? 'linear-gradient(145deg, #fff8e7 0%, #f5e6c8 100%)'
            : 'linear-gradient(145deg, #fefce8 0%, #fdf6e3 50%, #f5e6c8 100%)',
          border: selected
            ? '2px solid #d4af37'
            : isSpecial
            ? `2px solid ${suit.color}55`
            : '2px solid rgba(212,175,55,0.35)',
          boxShadow: selected
            ? `0 0 0 3px rgba(212,175,55,0.4), 0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(212,175,55,0.25)`
            : isTopCard
            ? `0 0 15px ${suit.color}22, 0 6px 20px rgba(0,0,0,0.4)`
            : '0 4px 16px rgba(0,0,0,0.4)',
          opacity: disabled ? 0.45 : 1,
          transition: 'box-shadow 0.2s, border-color 0.2s',
        }}
      >
        {/* Inner border (traditional card look) */}
        <div
          className="absolute inset-1.5 rounded-lg pointer-events-none"
          style={{
            border: `1px solid ${suit.color}25`,
          }}
        />

        {/* Top-left rank/suit */}
        <div className="absolute top-1.5 left-2 flex flex-col items-center gap-0.5 z-10">
          <span
            style={{
              fontSize: rankSize,
              fontWeight: 800,
              color: suit.color,
              fontFamily: 'Playfair Display, serif',
              lineHeight: 1,
            }}
          >
            {RANK_LABEL[card.rank]}
          </span>
          <SuitIcon suit={card.suit} size={suitSize} color={suit.color} />
        </div>

        {/* Bottom-right rank/suit (rotated) */}
        <div
          className="absolute bottom-1.5 right-2 flex flex-col items-center gap-0.5 z-10"
          style={{ transform: 'rotate(180deg)' }}
        >
          <span
            style={{
              fontSize: rankSize,
              fontWeight: 800,
              color: suit.color,
              fontFamily: 'Playfair Display, serif',
              lineHeight: 1,
            }}
          >
            {RANK_LABEL[card.rank]}
          </span>
          <SuitIcon suit={card.suit} size={suitSize} color={suit.color} />
        </div>

        {/* Center area */}
        <div className="flex-1 flex flex-col items-center justify-center gap-1 pt-6 pb-6">
          {/* Large suit icon */}
          <SuitIcon suit={card.suit} size={centerSize} color={suit.color} />
          {/* Rank name */}
          <span
            style={{
              fontSize: nameSize,
              fontWeight: 600,
              color: `${suit.color}99`,
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {RANK_FULL[card.rank]}
          </span>
        </div>

        {/* Special card shimmer overlay */}
        {isTopCard && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: `linear-gradient(135deg, transparent 30%, ${suit.color}08 50%, transparent 70%)`,
              backgroundSize: '200% 200%',
              animation: 'shimmer 3s linear infinite',
            }}
          />
        )}
      </div>

      {/* Special badge for macho/patrón/7 special */}
      {isSpecial && size !== 'tiny' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full text-center z-20"
          style={{
            background: `linear-gradient(135deg, ${special.color}33, ${special.color}11)`,
            border: `1px solid ${special.color}66`,
            fontSize: 8,
            fontWeight: 700,
            color: special.color,
            letterSpacing: '0.05em',
          }}
        >
          {special.label}
        </motion.div>
      )}

      {/* Power indicator */}
      {showPower && isPlayable && !disabled && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow-lg z-20"
          style={{
            background: 'linear-gradient(135deg, #d4af37, #8a7030)',
            color: '#1a1000',
            fontSize: 9,
          }}
        >
          {16 - power}
        </motion.div>
      )}

      {/* Selection ring glow */}
      {selected && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            boxShadow: '0 0 0 3px rgba(212,175,55,0.6), 0 0 30px rgba(212,175,55,0.3)',
          }}
        />
      )}
    </motion.div>
  )
})

export default SpanishCard