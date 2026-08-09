import type { Card } from '../../types'
import { getCardPower } from '../../utils/trucoRules'

interface CardProps {
  card: Card
  onClick?: () => void
  disabled?: boolean
  selected?: boolean
  isPlayable?: boolean
  size?: 'small' | 'medium' | 'large'
}

const SUIT_ICONS: Record<Card['suit'], string> = {
  oros: '🟡',
  copas: '❤️',
  espadas: '⚔️',
  bastos: '🌿',
}

const SUIT_COLORS: Record<Card['suit'], string> = {
  oros: 'text-yellow-600',
  copas: 'text-red-600',
  espadas: 'text-gray-800',
  bastos: 'text-green-700',
}

export default function CardComponent({ card, onClick, disabled, selected, isPlayable, size = 'medium' }: CardProps) {
  const sizeClasses = {
    small: 'w-14 h-20 text-xs',
    medium: 'w-20 h-28 text-sm',
    large: 'w-24 h-32 text-base',
  }

  return (
    <div
      onClick={onClick}
      className={`
        relative ${sizeClasses[size]} bg-white border-2 rounded-xl shadow-sm
        flex flex-col items-center justify-center cursor-pointer
        transition-all duration-200 select-none
        ${selected ? 'border-primary shadow-md' : 'border-gray-200'}
        ${isPlayable && !disabled ? 'hover:border-primary hover:shadow-md cursor-pointer' : ''}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
      `}
    >
      <div className={`font-bold ${SUIT_COLORS[card.suit]}`}>
        {card.rank}
      </div>
      <div className="text-2xl">
        {SUIT_ICONS[card.suit]}
      </div>
      <div className={`text-xs font-medium ${SUIT_COLORS[card.suit]} opacity-70 capitalize`}>
        {card.suit}
      </div>
      {isPlayable && !disabled && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-white rounded-full text-xs flex items-center justify-center font-bold">
          {getCardPower(card)}
        </div>
      )}
    </div>
  )
}