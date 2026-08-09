import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGameStore } from '../../stores/gameStore'
import { useAuthStore } from '../../stores/authStore'
import { ArrowLeft, Users, Coins, Target, Bot, Zap } from 'lucide-react'
import type { Player } from '../../types'

export default function CreateTable() {
  const navigate = useNavigate()
  const { startGame } = useGameStore()
  const { user } = useAuthStore()
  const [tableName, setTableName] = useState('')
  const [buyIn, setBuyIn] = useState(100)
  const [targetPoints, setTargetPoints] = useState(15)
  const [loading, setLoading] = useState(false)

  const buyInOptions = [50, 100, 250, 500, 1000]
  const pointsOptions = [15, 30]

  const handleCreate = () => {
    setLoading(true)
    setTimeout(() => {
      const humanPlayer: Player = {
        userId: user?.id || 'human-1',
        username: user?.username || 'Vos',
        chips: user?.balance || 1000,
        position: 'south',
        isReady: true,
        isBot: false,
      }
      const botPlayer: Player = {
        userId: 'bot-1',
        username: 'El Bot',
        chips: 1000,
        position: 'north',
        isReady: true,
        isBot: true,
      }
      startGame([humanPlayer, botPlayer], targetPoints)
      navigate('/game')
    }, 800)
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Back button */}
          <button
            onClick={() => navigate('/lobby')}
            className="flex items-center gap-2 text-sm mb-8 transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-gold)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al lobby
          </button>

          {/* Title */}
          <div className="mb-8">
            <h1
              className="text-3xl md:text-4xl mb-2"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Crear{' '}
              <span className="text-gradient-gold">Mesa</span>
            </h1>
            <p style={{ color: 'var(--color-text-muted)' }}>
              Configurá tu mesa y esperá a un oponente
            </p>
          </div>

          {/* Form */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(13,32,22,0.9)',
              border: '1px solid rgba(212,175,55,0.25)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
            }}
          >
            <div className="p-8 space-y-7">
              {/* Table name */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-gold-light)' }}>
                  Nombre de la Mesa
                </label>
                <input
                  className="input"
                  placeholder="Mesa del Barrio..."
                  value={tableName}
                  onChange={e => setTableName(e.target.value)}
                />
              </div>

              {/* Buy-in */}
              <div>
                <label className="block text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--color-gold-light)' }}>
                  <Coins className="w-4 h-4" />
                  Buy-in (ARS)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {buyInOptions.map(amount => (
                    <button
                      key={amount}
                      onClick={() => setBuyIn(amount)}
                      className="py-3 rounded-xl text-sm font-bold transition-all"
                      style={{
                        background: buyIn === amount
                          ? 'linear-gradient(135deg, #d4af37, #8a7030)'
                          : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${buyIn === amount ? '#d4af37' : 'rgba(212,175,55,0.2)'}`,
                        color: buyIn === amount ? '#1a1000' : 'var(--color-text-muted)',
                        transform: buyIn === amount ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target points */}
              <div>
                <label className="block text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--color-gold-light)' }}>
                  <Target className="w-4 h-4" />
                  Puntos para ganar
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {pointsOptions.map(pts => (
                    <button
                      key={pts}
                      onClick={() => setTargetPoints(pts)}
                      className="py-4 rounded-xl text-center transition-all"
                      style={{
                        background: targetPoints === pts
                          ? 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))'
                          : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${targetPoints === pts ? 'rgba(212,175,55,0.6)' : 'rgba(212,175,55,0.15)'}`,
                      }}
                    >
                      <div
                        className="text-2xl font-bold mb-1"
                        style={{
                          fontFamily: 'Playfair Display, serif',
                          color: targetPoints === pts ? 'var(--color-gold-light)' : 'var(--color-text-muted)',
                        }}
                      >
                        {pts}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {pts === 15 ? 'Partida corta (~15 min)' : 'Partida larga (~30 min)'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode */}
              <div>
                <label className="block text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--color-gold-light)' }}>
                  <Users className="w-4 h-4" />
                  Modo de juego
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="p-4 rounded-xl cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.03))',
                      border: '1px solid rgba(212,175,55,0.4)',
                    }}
                    onClick={handleCreate}
                  >
                    <Bot className="w-5 h-5 mb-2" style={{ color: 'var(--color-gold)' }} />
                    <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                      vs Bot
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Jugar solo
                    </div>
                  </div>
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(212,175,55,0.12)',
                      opacity: 0.5,
                    }}
                  >
                    <Users className="w-5 h-5 mb-2" style={{ color: 'var(--color-text-muted)' }} />
                    <div className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                      Multijugador
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Próximamente
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action bar */}
            <div
              className="px-8 py-5"
              style={{
                background: 'rgba(212,175,55,0.04)',
                borderTop: '1px solid rgba(212,175,55,0.15)',
              }}
            >
              <motion.button
                onClick={handleCreate}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full btn btn-gold py-4 text-sm flex items-center justify-center gap-3"
                style={{ borderRadius: '0.75rem', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? (
                  <>
                    <div
                      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                      style={{ animation: 'spin 0.8s linear infinite' }}
                    />
                    Creando mesa...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Crear Mesa y Jugar
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
