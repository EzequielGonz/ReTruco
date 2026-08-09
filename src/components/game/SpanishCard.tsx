import { memo } from 'react'
import type { Card } from '../../types'
import { getCardPower } from '../../utils/trucoRules'
import { CARD_SUIT_SYMBOLS, CARD_SUIT_COLORS, RANK_NAMES } from '../../utils/cardAssets'
import { motion } from 'framer-motion'

interface SpanishCardProps {
  card: Card
  onClick?: () => void
  disabled?: boolean
  selected?: boolean
  isPlayable?: boolean
  size?: 'small' | 'medium' | 'large'
  className?: string
}

const SpanishCard = memo(function SpanishCard({
  card,
  onClick,
  disabled,
  selected,
  isPlayable,
  size = 'medium',
  className = '',
}: SpanishCardProps) {
  const sizeClasses = {
    small: 'w-16 h-24',
    medium: 'w-24 h-36',
    large: 'w-32 h-48',
  }

  const fontSize = {
    small: 'text-sm',
    medium: 'text-lg',
    large: 'text-2xl',
  }

  const symbolSize = {
    small: 'text-xl',
    medium: 'text-3xl',
    large: 'text-4xl',
  }

  const suitColor = CARD_SUIT_COLORS[card.suit]
  const rankName = RANK_NAMES[card.rank as keyof typeof RANK_NAMES] || card.rank
  const power = getCardPower(card)

  return (
    <motion.div
      whileHover={isPlayable && !disabled ? { scale: 1.08, y: -12, rotate: 0 } : {}}
      whileTap={isPlayable && !disabled ? { scale: 0.95 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      onClick={onClick}
      className={`
        relative ${sizeClasses[size]} rounded-xl shadow-lg cursor-pointer
        transition-all duration-300 select-none
        ${selected ? 'ring-4 ring-primary/50 scale-105 shadow-2xl' : ''}
        ${isPlayable && !disabled ? 'hover:shadow-2xl hover:border-primary/50' : ''}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
        ${className}
      `}
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: `2px solid ${selected ? 'var(--color-primary)' : '#e2e8f0'}`,
        transform: isPlayable && !disabled ? 'rotate(-2deg)' : 'rotate(0deg)',
      }}
    >
      <div className="absolute inset-0 p-3 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="text-center">
            <div className={`font-bold ${fontSize[size]}`} style={{ color: suitColor }}>
              {card.rank}
            </div>
            <div className={`${symbolSize[size]} leading-none`}>
              {CARD_SUIT_SYMBOLS[card.suit]}
            </div>
          </div>
          <div className="text-center opacity-60">
            <div className={`font-bold ${fontSize[size]}`} style={{ color: suitColor }}>
              {card.rank}
            </div>
            <div className={`${symbolSize[size]} leading-none`}>
              {CARD_SUIT_SYMBOLS[card.suit]}
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className={`font-bold ${fontSize[size]} mb-1`} style={{ color: suitColor }}>
            {rankName}
          </div>
          <div className={`${symbolSize[size]}`}>
            {CARD_SUIT_SYMBOLS[card.suit]}
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div className="text-center rotate-180">
            <div className={`font-bold ${fontSize[size]}`} style={{ color: suitColor }}>
              {card.rank}
            </div>
            <div className={`${symbolSize[size]} leading-none`}>
              {CARD_SUIT_SYMBOLS[card.suit]}
            </div>
          </div>
          <div className="text-center rotate-180 opacity-60">
            <div className={`font-bold ${fontSize[size]}`} style={{ color: suitColor }}>
              {card.rank}
            </div>
            <div className={`${symbolSize[size]} leading-none`}>
              {CARD_SUIT_SYMBOLS[card.suit]}
            </div>
          </div>
        </div>
      </div>

      {isPlayable && !disabled && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white rounded-full text-xs flex items-center justify-center font-bold shadow-lg z-10"
        >
          {power}
        </motion.div>
      )}
    </motion.div>
  )
})

export default SpanishCard