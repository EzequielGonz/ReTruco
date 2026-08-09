import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Volume2, VolumeX, ArrowLeft, RotateCcw, Swords } from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'
import SpanishCard from '../../components/game/SpanishCard'
import CardHand from '../../components/game/CardHand'
import BotArea from '../../components/game/BotArea'
import type { Card } from '../../types'

export default function GameTable() {
  const navigate = useNavigate()
  const {
    gameState,
    playCard,
    callTruco,
    acceptTruco,
    rejectTruco,
    goToDeck,
    botPlay,
    resetGame,
    isPlaying,
  } = useGameStore()
  const [soundEnabled, setSoundEnabled] = useState(true)

  const humanPlayer = gameState?.players.find((p) => !p.isBot)
  const botPlayer = gameState?.players.find((p) => p.isBot)
  const humanIndex = gameState?.players.findIndex((p) => !p.isBot) || 0
  const botIndex = gameState?.players.findIndex((p) => p.isBot) || 1

  useEffect(() => {
    if (
      gameState?.currentTurn &&
      gameState?.players[gameState.currentPlayerIndex]?.isBot
    ) {
      botPlay()
    }
  }, [gameState?.currentTurn, gameState?.currentPlayerIndex, botPlay])

  if (!gameState || !isPlaying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted mb-4">No hay juego en progreso</p>
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
  const playedCards = currentMano?.cards.filter((c) => c.played) || []

  const trucoLabels = ['', 'Truco', 'Retruco', 'Vale Cuatro']
  const currentTrucoLabel = trucoLabels[gameState.trucoLevel] || ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-dark via-background to-background-dark">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <header className="border-b border-border/50 backdrop-blur-sm bg-white/5">
          <div className="container-custom">
            <div className="flex justify-between items-center h-16">
              <button
                onClick={() => navigate('/lobby')}
                className="flex items-center gap-2 text-text-muted hover:text-danger transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden sm:inline">Salir</span>
              </button>

              <h1 className="text-2xl font-bold gradient-text">Truco</h1>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </button>
                <button
                  onClick={handleNewGame}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="container-custom py-8">
          <div className="max-w-6xl mx-auto">
            <div className="card p-6 md:p-8 mb-8">
              <div className="flex justify-between items-center mb-6">
                <div className="text-center flex-1">
                  <p className="text-sm text-text-muted mb-2 uppercase tracking-wider font-medium">Tú</p>
                  <motion.p
                    key={gameState.puntos[humanPlayer!.userId] || 0}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="text-4xl md:text-5xl font-bold text-primary"
                  >
                    {gameState.puntos[humanPlayer!.userId] || 0}
                  </motion.p>
                </div>
                <div className="text-center px-6">
                  <Trophy className="h-8 w-8 text-accent mx-auto mb-2" />
                  <p className="text-sm text-text-muted mb-1">Meta</p>
                  <p className="text-2xl font-bold text-accent">{gameState.targetPoints}</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-sm text-text-muted mb-2 uppercase tracking-wider font-medium">Bot</p>
                  <motion.p
                    key={gameState.puntos[botPlayer!.userId] || 0}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="text-4xl md:text-5xl font-bold text-danger"
                  >
                    {gameState.puntos[botPlayer!.userId] || 0}
                  </motion.p>
                </div>
              </div>

              <div className="h-3 bg-background rounded-full overflow-hidden">
                <motion.div
                  className="h-full gradient-primary"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(((gameState.puntos[humanPlayer!.userId] || 0) / gameState.targetPoints) * 100, 100)}%`,
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <AnimatePresence>
                {currentTrucoLabel && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-center"
                  >
                    <span className="inline-block bg-accent text-black px-6 py-2 rounded-full font-bold text-lg shadow-lg">
                      {currentTrucoLabel}!
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="card p-6 md:p-8">
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <Swords className="h-6 w-6 text-danger" />
                      <h2 className="text-2xl font-bold">Bot</h2>
                    </div>
                    <BotArea
                      username={botPlayer!.username}
                      cardsCount={gameState.hands[botIndex]?.length || 0}
                      isActive={gameState.currentTurn === botPlayer?.userId}
                    />
                  </div>

                  <AnimatePresence>
                    {playedCards.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-border my-6 pt-6"
                      >
                        <p className="text-sm text-text-muted mb-3 uppercase tracking-wider font-medium">
                          Cartas jugadas
                        </p>
                        <div className="flex gap-3 flex-wrap">
                          {playedCards.map((pc, i) => (
                            <motion.div
                              key={i}
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ delay: i * 0.1 }}
                            >
                              <SpanishCard card={pc.card!} size="small" />
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="border-t border-border my-6" />

                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <h2 className="text-2xl font-bold">Tu Mano</h2>
                    </div>
                    <CardHand
                      cards={gameState.hands[humanIndex] || []}
                      playerId={humanPlayer!.userId}
                      currentPlayerId={gameState.currentTurn}
                      onPlayCard={handlePlayCard}
                      isBot={false}
                      size="medium"
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {gameState.gamePhase === 'playing' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex gap-3"
                    >
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <div className="card p-6 mb-6">
                  <h3 className="text-lg font-bold mb-4">Mensajes</h3>
                  <div className="space-y-2 h-80 overflow-y-auto">
                    <AnimatePresence>
                      {gameState.messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className={`
                            p-3 rounded-lg text-sm
                            ${msg.type === 'info' ? 'bg-primary/10 text-primary' : ''}
                            ${msg.type === 'warning' ? 'bg-accent/10 text-accent' : ''}
                            ${msg.type === 'success' ? 'bg-success/10 text-success' : ''}
                            ${msg.type === 'error' ? 'bg-danger/10 text-danger' : ''}
                          `}
                        >
                          {msg.text}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {gameState.messages.length === 0 && (
                      <p className="text-text-muted text-center text-sm py-8">No hay mensajes</p>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {gameState.winner && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="card p-8 text-center border-2 border-success/20"
                    >
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, repeat: 2 }}
                      >
                        <Trophy className="h-16 w-16 text-accent mx-auto mb-4" />
                      </motion.div>
                      <h3 className="text-2xl font-bold mb-3 gradient-text">
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
