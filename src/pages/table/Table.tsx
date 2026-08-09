import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Play, X } from 'lucide-react'
import { useTableStore } from '../../stores/tableStore'
import { useGameStore } from '../../stores/gameStore'
import GameTable from '../../pages/game/GameTable'
import type { Player } from '../../types'

export default function Table() {
  const { tableId } = useParams<{ tableId: string }>()
  const navigate = useNavigate()
  const { tables, leaveTable, currentTable } = useTableStore()
  const { startGame, resetGame, isPlaying } = useGameStore()
  const [showSetup, setShowSetup] = useState(true)

  const table = tables.find((t) => t.id === tableId) || currentTable

  if (!table) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted mb-4">Mesa no encontrada</p>
          <button
            onClick={() => navigate('/lobby')}
            className="text-primary hover:text-primary-dark"
          >
            Volver al lobby
          </button>
        </div>
      </div>
    )
  }

  const handleStartGame = () => {
    const humanPlayer: Player = {
      userId: 'human',
      username: 'Tú',
      chips: 0,
      position: 'south',
      isReady: true,
      isBot: false,
    }
    const botPlayer: Player = {
      userId: 'bot',
      username: 'Bot',
      chips: 0,
      position: 'north',
      isReady: true,
      isBot: true,
    }

    startGame([humanPlayer, botPlayer], 15)
    setShowSetup(false)
  }

  const handleLeaveTable = () => {
    resetGame()
    leaveTable(table.id, 'current-user-id')
    navigate('/lobby')
  }

  if (isPlaying && !showSetup) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleLeaveTable}
            className="flex items-center gap-2 text-text-muted hover:text-danger transition-colors"
          >
            <X className="h-5 w-5" />
            <span className="hidden sm:inline">Abandonar</span>
          </button>
          <h1 className="text-xl font-bold">{table.name}</h1>
          <div className="w-24" />
        </div>
        <GameTable />
      </div>
    )
  }

  return (
    <div className="py-12">
      <div className="container-custom">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleLeaveTable}
            className="flex items-center gap-2 text-text-muted hover:text-text mb-6 transition-colors"
          >
            <X className="h-5 w-5" />
            Volver al lobby
          </button>

          <div className="card p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Play className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Preparados para Jugar</h2>
              <p className="text-text-muted">
                Vas a jugar contra el Bot. El primero en llegar a 15 puntos gana.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-primary/5 p-4 rounded-xl">
                <p className="font-semibold mb-1">Tú</p>
                <p className="text-sm text-text-muted">Jugador humano</p>
              </div>
              <div className="bg-danger/5 p-4 rounded-xl">
                <p className="font-semibold mb-1">Bot</p>
                <p className="text-sm text-text-muted">Oponente automático</p>
              </div>
            </div>

            <button
              onClick={handleStartGame}
              className="btn btn-primary w-full py-4 text-lg"
            >
              Empezar a Jugar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
