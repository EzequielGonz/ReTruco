import CardComponent from './Card'
import type { Card } from '../../types'

interface HandProps {
  cards: Card[]
  playerId: string
  currentPlayerId: string
  onPlayCard: (card: Card) => void
  size?: 'small' | 'medium' | 'large'
  isBot?: boolean
}

export default function Hand({ cards, playerId, currentPlayerId, onPlayCard, size = 'medium', isBot }: HandProps) {
  const canPlay = currentPlayerId === playerId && !isBot

  return (
    <div className={`flex gap-3 ${isBot ? 'justify-center' : 'justify-start flex-wrap'}`}>
      {cards.map((card, index) => (
        <div key={index} className={isBot ? 'transform -rotate-6 scale-90' : ''}>
          <CardComponent
            card={card}
            onClick={() => canPlay && onPlayCard(card)}
            disabled={!canPlay}
            isPlayable={canPlay}
            size={size}
          />
        </div>
      ))}
    </div>
  )
}