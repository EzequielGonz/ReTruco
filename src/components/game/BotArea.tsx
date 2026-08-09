import { motion } from 'framer-motion'
import SpanishCard from './SpanishCard'

interface BotAreaProps {
  username: string
  cardsCount: number
  isActive: boolean
}

export default function BotArea({ username, cardsCount, isActive }: BotAreaProps) {
  // Create placeholder facedown cards based on count
  const faceDownCards = Array.from({ length: cardsCount }, (_, i) => ({
    suit: 'espadas' as const,
    rank: 1 as const,
    value: 1,
    power: 1,
    id: i,
  }))

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Bot avatar/name */}
      <div className="flex items-center gap-3">
        <motion.div
          animate={isActive ? {
            boxShadow: ['0 0 0 0 rgba(212,175,55,0.4)', '0 0 0 12px rgba(212,175,55,0)', '0 0 0 0 rgba(212,175,55,0.4)']
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
          style={{
            background: isActive
              ? 'linear-gradient(135deg, #d4af37, #8a7030)'
              : 'rgba(255,255,255,0.08)',
            border: `2px solid ${isActive ? 'var(--color-gold)' : 'rgba(255,255,255,0.1)'}`,
          }}
        >
          🤖
        </motion.div>
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {username}
          </div>
          {isActive ? (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-xs flex items-center gap-1"
              style={{ color: 'var(--color-gold)' }}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Pensando...
            </motion.div>
          ) : (
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {cardsCount} carta{cardsCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Face-down cards fanned */}
      {cardsCount > 0 ? (
        <div className="relative flex items-center justify-center" style={{ height: 80 }}>
          {faceDownCards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 300 }}
              style={{
                marginLeft: i > 0 ? -30 : 0,
                rotate: `${(i - (cardsCount - 1) / 2) * 8}deg`,
                zIndex: i,
              }}
            >
              <SpanishCard card={card} faceDown size="small" />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-sm py-4" style={{ color: 'var(--color-text-muted)' }}>
          Sin cartas
        </div>
      )}
    </div>
  )
}
