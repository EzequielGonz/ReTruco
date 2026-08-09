import SpanishCard from './SpanishCard'
import type { Card } from '../../types'

interface CardHandProps {
  cards: Card[]
  playerId: string
  currentPlayerId: string
  onPlayCard: (card: Card) => void
  isBot?: boolean
  size?: 'small' | 'medium' | 'large'
}

export default function CardHand({
  cards,
  playerId,
  currentPlayerId,
  onPlayCard,
  isBot,
  size = 'medium',
}: CardHandProps) {
  const canPlay = currentPlayerId === playerId && !isBot

  const fanAngle = 8
  const totalAngle = (cards.length - 1) * fanAngle
  const startAngle = -totalAngle / 2

  return (
    <div
      className={`
        relative flex items-end justify-center
        ${isBot ? 'h-32' : 'h-40'}
      `}
      style={{ perspective: '1000px' }}
    >
      {cards.map((card, index) => {
        const angle = startAngle + index * fanAngle
        const zIndex = cards.length - index

        return (
          <div
            key={index}
            className={`
              absolute transition-all duration-500 ease-out
              ${isBot ? 'transform -rotate-6 scale-75' : ''}
            `}
            style={{
              transform: isBot
                ? 'rotate(-6deg) scale(0.75)'
                : `rotate(${angle}deg) translateZ(${zIndex * 5}px)`,
              zIndex,
              marginLeft: isBot ? 0 : `${index * 20}px`,
            }}
          >
            <SpanishCard
              card={card}
              onClick={() => canPlay && onPlayCard(card)}
              disabled={!canPlay}
              isPlayable={canPlay}
              size={size}
            />
          </div>
        )
      })}
    </div>
  )
}
