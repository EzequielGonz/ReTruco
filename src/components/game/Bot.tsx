import { Bot } from 'lucide-react'

interface BotProps {
  username: string
  cardsCount: number
  isActive: boolean
  avatar?: string
  isBot?: boolean
}

export default function BotComponent({ username, cardsCount, isActive, avatar, isBot = true }: BotProps) {
  return (
    <div className={`
      relative p-6 rounded-xl border-2 transition-all duration-200
      ${isActive ? 'border-primary bg-primary/5' : 'border-border bg-background'}
    `}>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
          {avatar ? (
            <img src={avatar} alt={username} className="w-14 h-14 rounded-full" />
          ) : (
            <Bot className="h-7 w-7 text-primary" />
          )}
        </div>
        <div>
          <p className="font-bold text-lg">{username}</p>
          <p className="text-sm text-text-muted">{isBot ? 'Bot' : 'Jugador'}</p>
        </div>
        {isActive && (
          <div className="ml-auto">
            <div className="w-3 h-3 bg-success rounded-full" />
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-center">
        {Array.from({ length: cardsCount }).map((_, i) => (
          <div
            key={i}
            className="w-12 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-lg border-2 border-primary/30 shadow-sm transform rotate-3"
          />
        ))}
      </div>
    </div>
  )
}