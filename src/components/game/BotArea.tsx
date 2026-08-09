import { Bot } from 'lucide-react'

interface BotAreaProps {
  username: string
  cardsCount: number
  isActive: boolean
}

export default function BotArea({ username, cardsCount, isActive }: BotAreaProps) {
  return (
    <div
      className={`
        relative p-6 rounded-2xl border-2 transition-all duration-300
        ${isActive ? 'border-primary bg-primary/5 shadow-lg' : 'border-border bg-white/50'}
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-lg">{username}</p>
            <p className="text-sm text-text-muted">Bot</p>
          </div>
        </div>
        {isActive && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-sm text-success font-medium">Pensando...</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-center h-24">
        {Array.from({ length: cardsCount }).map((_, i) => (
          <div
            key={i}
            className="w-16 h-24 bg-gradient-to-br from-primary to-primary/80 rounded-lg border-2 border-primary/30 shadow-md transform rotate-3"
          />
        ))}
      </div>
    </div>
  )
}
