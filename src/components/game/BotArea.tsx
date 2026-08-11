import { motion, AnimatePresence } from 'framer-motion'
import SpanishCard from './SpanishCard'

interface BotAreaProps {
  username: string
  cardsCount: number
  isActive: boolean
  compact?: boolean
}

const DUMMY_CARD = { suit: 'espadas' as const, rank: 1 as const, value: 1, power: 1 }

export default function BotArea({ username, cardsCount, isActive, compact = false }: BotAreaProps) {
  return (
    <div className={`flex flex-col items-center ${compact ? 'gap-1.5' : 'gap-4'}`}>

      {/* Avatar + name row */}
      <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3'}`}>
        <motion.div
          animate={isActive ? {
            boxShadow: [
              '0 0 0 0 rgba(212,175,55,0.5)',
              '0 0 0 10px rgba(212,175,55,0)',
              '0 0 0 0 rgba(212,175,55,0.5)',
            ],
          } : { boxShadow: '0 0 0 0 rgba(0,0,0,0)' }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className={`rounded-full flex items-center justify-center ${compact ? 'w-8 h-8 text-base' : 'w-10 h-10 text-lg'}`}
          style={{
            background: isActive
              ? 'linear-gradient(135deg,#d4af37,#8a7030)'
              : 'rgba(255,255,255,0.08)',
            border: `2px solid ${isActive ? 'var(--color-gold)' : 'rgba(255,255,255,0.12)'}`,
            transition: 'background 0.4s, border-color 0.4s',
          }}
        >
          🤖
        </motion.div>
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {username}
          </div>
          <AnimatePresence mode="wait">
            {isActive ? (
              <motion.div key="thinking"
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                className="text-xs flex items-center gap-1.5"
                style={{ color: 'var(--color-gold)' }}>
                {/* Animated thinking dots */}
                {[0,1,2].map(i => (
                  <motion.span key={i} className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{ background: 'currentColor' }}
                    animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 0.9, delay: i * 0.25, repeat: Infinity }}
                  />
                ))}
                <span className="ml-1">Pensando...</span>
              </motion.div>
            ) : (
              <motion.div key="count"
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {cardsCount} carta{cardsCount !== 1 ? 's' : ''}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Face-down hand fan */}
      {cardsCount > 0 ? (
        <div className="relative flex items-end justify-center" style={{ height: compact ? 52 : 90 }}>
          {Array.from({ length: cardsCount }, (_, i) => {
            const totalSpread = Math.min(compact ? 14 : 20, cardsCount * (compact ? 6 : 8))
            const angle = cardsCount > 1 ? -totalSpread / 2 + i * (totalSpread / (cardsCount - 1)) : 0
            const yOffset = Math.pow(Math.abs(angle) / (totalSpread / 2 + 1), 1.5) * (compact ? 7 : 14)
            return (
              <motion.div key={i}
                initial={{ opacity: 0, y: -50, rotate: angle }}
                animate={{ opacity: 1, y: yOffset, rotate: angle }}
                transition={{ delay: i * 0.08, type: 'spring', stiffness: 280, damping: 22 }}
                style={{
                  marginLeft: i > 0 ? (compact ? -20 : -28) : 0,
                  zIndex: i,
                  transformOrigin: 'bottom center',
                  filter: isActive ? 'drop-shadow(0 4px 12px rgba(212,175,55,0.3))' : 'none',
                  transition: 'filter 0.4s',
                }}>
                <SpanishCard card={DUMMY_CARD} faceDown size={compact ? 'tiny' : 'small'} />
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="text-sm py-5 opacity-50" style={{ color: 'var(--color-text-muted)' }}>
          Sin cartas
        </div>
      )}
    </div>
  )
}
