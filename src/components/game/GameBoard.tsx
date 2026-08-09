import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw, Volume2, VolumeX, Trophy } from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'
import Hand from './Hand'
import BotComponent from './Bot'
import type { Card } from '../../types'

export default function GameBoard() {
  const navigate = useNavigate()
  const { gameState, playCard, callTruco, acceptTruco, rejectTruco, goToDeck, botPlay, resetGame, isPlaying } = useGameStore()
  const [soundEnabled, setSoundEnabled] = useState(true)

  const humanPlayer = gameState?.players.find(p => !p.isBot)
  const botPlayer = gameState?.players.find(p => p.isBot)
  const humanIndex = gameState?.players.findIndex(p => !p.isBot) || 0
  const botIndex = gameState?.players.findIndex(p => p.isBot) || 1

  useEffect(() => {
    if (gameState?.currentTurn && gameState?.players[gameState.currentPlayerIndex]?.isBot) {
      botPlay()
    }
  }, [gameState?.currentTurn, gameState?.currentPlayerIndex, botPlay])

  if (!gameState || !isPlaying) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted mb-4">No hay juego en progreso</p>
        <button
          onClick={() => navigate('/lobby')}
          className="text-primary hover:text-primary-dark"
        >
          Volver al lobby
        </button>
      </div>
    )
  }

  const handlePlayCard = (card: Card) => {
    if (gameState.currentTurn !== humanPlayer?.userId) return
    if (gameState.gamePhase !== 'playing') return
    playCard(humanPlayer.userId, card)
  }

  const handleTruco = () => callTruco(humanPlayer!.userId, 1)
  const handleAcceptTruco = () => acceptTruco(humanPlayer!.userId)
  const handleRejectTruco = () => rejectTruco(humanPlayer!.userId)
  const handleGoToDeck = () => goToDeck(humanPlayer!.userId)
  const handleNewGame = () => {
    resetGame()
    navigate('/lobby')
  }

  const isMyTurn = gameState.currentTurn === humanPlayer?.userId && gameState.gamePhase === 'playing'
  const hasTruco = gameState.trucoLevel > 0

  const currentMano = gameState.manos[gameState.currentManoIndex]
  const playedCards = currentMano?.cards.filter(c => c.played) || []

  const trucoLabels = ['', 'Truco', 'Retruco', 'Vale Cuatro']
  const currentTrucoLabel = trucoLabels[gameState.trucoLevel] || ''

  return (
    <div className="py-8">
      <div className="container-custom">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => navigate('/lobby')}
            className="text-text-muted hover:text-danger transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-text-muted hover:text-text transition-colors"
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
            <h1 className="text-2xl font-bold">Truco</h1>
            <button
              onClick={handleNewGame}
              className="text-primary hover:text-primary-dark transition-colors"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="card p-6 md:p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="text-center flex-1">
              <p className="text-sm text-text-muted mb-2 uppercase tracking-wider font-medium">Tú</p>
              <p className="text-4xl md:text-5xl font-bold text-primary">
                {gameState.puntos[humanPlayer!.userId] || 0}
              </p>
            </div>
            <div className="text-center px-6">
              <Trophy className="h-8 w-8 text-accent mx-auto mb-2" />
              <p className="text-sm text-text-muted mb-1">Meta</p>
              <p className="text-2xl font-bold text-accent">{gameState.targetPoints}</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-sm text-text-muted mb-2 uppercase tracking-wider font-medium">Bot</p>
              <p className="text-4xl md:text-5xl font-bold text-danger">
                {gameState.puntos[botPlayer!.userId] || 0}
              </p>
            </div>
          </div>

          <div className="h-2 bg-background rounded-full overflow-hidden">
            <div
              className="h-full gradient-primary transition-all duration-500"
              style={{
                width: `${Math.min(((gameState.puntos[humanPlayer!.userId] || 0) / gameState.targetPoints) * 100, 100)}%`,
              }}
            />
          </div>

          {currentTrucoLabel && (
            <div className="mt-4 text-center">
              <span className="inline-block bg-accent text-black px-6 py-2 rounded-full font-bold text-lg">
                {currentTrucoLabel}!
              </span>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6 md:p-8">
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Bot</h2>
                <BotComponent
                  username={botPlayer!.username}
                  cardsCount={gameState.hands[botIndex]?.length || 0}
                  isActive={gameState.currentTurn === botPlayer?.userId}
                  isBot={botPlayer?.isBot}
                />
              </div>

              {playedCards.length > 0 && (
                <div className="border-t border-border my-6 pt-6">
                  <p className="text-sm text-text-muted mb-3 uppercase tracking-wider font-medium">Cartas jugadas</p>
                  <div className="flex gap-3 flex-wrap">
                    {playedCards.map((pc, i) => (
                      <div
                        key={i}
                        className="w-16 h-24 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center shadow-sm"
                      >
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-800">{pc.card?.rank}</div>
                          <div className="text-xs text-gray-500 capitalize">{pc.card?.suit}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-border my-6" />

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <h2 className="text-xl font-bold">Tu Mano</h2>
                </div>
                <Hand
                  cards={gameState.hands[humanIndex] || []}
                  playerId={humanPlayer!.userId}
                  currentPlayerId={gameState.currentTurn}
                  onPlayCard={handlePlayCard}
                  isBot={false}
                />
              </div>
            </div>

            {gameState.gamePhase === 'playing' && (
              <div className="flex gap-3">
                <button
                  onClick={handleGoToDeck}
                  disabled={!isMyTurn}
                  className="btn btn-secondary flex-1 py-4 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Irse al Mazo
                </button>
                {!hasTruco && isMyTurn && (
                  <button
                    onClick={handleTruco}
                    className="btn flex-1 py-4 bg-accent text-black hover:bg-accent/90 font-semibold"
                  >
                    Truco
                  </button>
                )}
                {hasTruco && isMyTurn && (
                  <>
                    <button
                      onClick={handleAcceptTruco}
                      className="btn btn-primary flex-1 py-4"
                    >
                      Aceptar
                    </button>
                    <button
                      onClick={handleRejectTruco}
                      className="btn flex-1 py-4 bg-danger text-white hover:bg-danger/90"
                    >
                      Rechazar
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="card p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">Mensajes</h3>
              <div className="space-y-2 h-80 overflow-y-auto">
                {gameState.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`
                      p-3 rounded-lg text-sm
                      ${msg.type === 'info' ? 'bg-primary/10 text-primary' : ''}
                      ${msg.type === 'warning' ? 'bg-accent/10 text-accent' : ''}
                      ${msg.type === 'success' ? 'bg-success/10 text-success' : ''}
                      ${msg.type === 'error' ? 'bg-danger/10 text-danger' : ''}
                    `}
                  >
                    {msg.text}
                  </div>
                ))}
                {gameState.messages.length === 0 && (
                  <p className="text-text-muted text-center text-sm py-8">No hay mensajes</p>
                )}
              </div>
            </div>

            {gameState.winner && (
              <div className="card p-8 text-center border-2 border-success/20">
                <Trophy className="h-16 w-16 text-accent mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-3">
                  {gameState.winner === humanPlayer?.userId ? '¡Ganaste!' : '¡Perdiste!'}
                </h3>
                <p className="text-text-muted mb-6">
                  Puntaje final: {gameState.puntos[humanPlayer!.userId]} - {gameState.puntos[botPlayer!.userId]}
                </p>
                <button
                  onClick={handleNewGame}
                  className="btn btn-primary px-8 py-3"
                >
                  Jugar de Nuevo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}