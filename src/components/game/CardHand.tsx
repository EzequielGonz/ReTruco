import { motion } from 'framer-motion'
import SpanishCard from './SpanishCard'
import type { Card } from '../../types'

interface CardHandProps {
  cards: Card[]
  playerId: string
  currentPlayerId: string
  onPlayCard: (card: Card) => void
  isBot?: boolean
  size?: 'tiny' | 'small' | 'medium' | 'large'
  disabled?: boolean
}

export default function CardHand({
  cards,
  playerId,
  currentPlayerId,
  onPlayCard,
  isBot = false,
  size = 'medium',
  disabled = false,
}: CardHandProps) {
  const isMyTurn = currentPlayerId === playerId && !isBot

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-20">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Sin cartas
        </p>
      </div>
    )
  }

  // Fan layout: spread cards with overlap
  const count = cards.length
  const spreadDeg = 10 // total spread degrees
  const angleStep = count > 1 ? spreadDeg / (count - 1) : 0

  return (
    <div className="relative flex items-end justify-center" style={{ height: size === 'medium' ? 160 : 120 }}>
      {cards.map((card, i) => {
        const angle = count > 1 ? -spreadDeg / 2 + i * angleStep : 0
        const yOffset = Math.abs(angle) * 1.5

        return (
          <motion.div
            key={`${card.suit}-${card.rank}`}
            initial={{ opacity: 0, y: -60, rotate: angle }}
            animate={{
              opacity: 1,
              y: isMyTurn ? 0 : yOffset,
              rotate: angle,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
              delay: i * 0.08,
            }}
            style={{
              marginLeft: i > 0 ? (size === 'medium' ? -28 : -20) : 0,
              zIndex: i,
              transformOrigin: 'bottom center',
            }}
            whileHover={
              isMyTurn && !disabled
                ? {
                    y: -20,
                    rotate: 0,
                    scale: 1.08,
                    zIndex: 50,
                    transition: { type: 'spring', stiffness: 400, damping: 15 },
                  }
                : {}
            }
          >
            <SpanishCard
              card={card}
              size={size}
              isPlayable={isMyTurn && !disabled}
              disabled={disabled || (!isMyTurn)}
              onClick={() => isMyTurn && !disabled && onPlayCard(card)}
              showPower={isMyTurn}
            />
          </motion.div>
        )
      })}

      {/* "Tu turno" indicator */}
      {isMyTurn && !disabled && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium tracking-wider whitespace-nowrap"
          style={{
            color: 'var(--color-gold)',
            letterSpacing: '0.15em',
          }}
        >
          ▲ ELEGÍ UNA CARTA ▲
        </motion.div>
      )}
    </div>
  )
}
