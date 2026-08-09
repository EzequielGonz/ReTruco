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
  const canPlay   = isMyTurn && !disabled

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Sin cartas</p>
      </div>
    )
  }

  const count = cards.length
  // Fan spread: wider for more cards, tighter for fewer
  const totalSpread = Math.min(18, count * 7)
  const angleStep   = count > 1 ? totalSpread / (count - 1) : 0
  // Overlap: tighter on mobile via size
  const overlapPx = size === 'medium' ? 30 : size === 'large' ? 38 : 22
  // Height of the fan container
  const containerH = size === 'medium' ? 170 : size === 'large' ? 210 : 130

  return (
    <div className="relative flex items-end justify-center" style={{ height: containerH + 20 }}>
      {cards.map((card, i) => {
        const angle = count > 1 ? -totalSpread / 2 + i * angleStep : 0
        // Cards at the extremes dip lower to simulate a held fan
        const yOffset = Math.pow(Math.abs(angle) / (totalSpread / 2 + 1), 1.6) * 18

        return (
          <motion.div
            key={`${card.suit}-${card.rank}`}
            initial={{ opacity: 0, y: -70, rotate: angle, scale: 0.8 }}
            animate={{ opacity: 1, y: yOffset, rotate: angle, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22, delay: i * 0.07 }}
            style={{
              marginLeft: i > 0 ? -overlapPx : 0,
              zIndex: i,
              transformOrigin: 'bottom center',
              // 3-D perspective for the whole fan
              perspective: 800,
            }}
            whileHover={canPlay ? {
              y: -30,
              rotate: 0,
              scale: 1.1,
              zIndex: 60,
              filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.65))',
              transition: { type: 'spring', stiffness: 380, damping: 16 },
            } : {}}
          >
            <SpanishCard
              card={card}
              size={size}
              isPlayable={canPlay}
              disabled={disabled || !isMyTurn}
              onClick={() => canPlay && onPlayCard(card)}
              showPower={canPlay}
            />
          </motion.div>
        )
      })}

      {/* "Tu turno" floating indicator */}
      {canPlay && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs font-semibold tracking-widest whitespace-nowrap pointer-events-none"
          style={{ color: 'var(--color-gold)', letterSpacing: '0.18em' }}
        >
          <motion.span
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          >
            ▲ ELEGÍ UNA CARTA ▲
          </motion.span>
        </motion.div>
      )}
    </div>
  )
}
