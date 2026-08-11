import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../../stores/gameStore'
import { useAuthStore } from '../../stores/authStore'
import { Plus, Bot, Play, WifiOff } from 'lucide-react'
import type { Player } from '../../types'

export default function Lobby() {
  const navigate = useNavigate()
  const { startGame } = useGameStore()
  const { user } = useAuthStore()

  const handlePlayBot = () => {
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
    startGame([humanPlayer, botPlayer], 15)
    navigate('/game')
  }

  return (
    <div className="min-h-screen py-10">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10"
        >
          <div>
            <h1
              className="text-3xl md:text-4xl mb-1"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              <span className="text-gradient-gold">Lobby</span> de Mesas
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Elegí una mesa o creá la tuya para jugar
            </p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={handlePlayBot}
              className="btn btn-felt flex items-center gap-2"
              style={{ fontSize: '0.85rem' }}
            >
              <Bot className="w-4 h-4" />
              Jugar vs Bot
            </motion.button>
            <Link
              to="/create-table"
              className="btn btn-gold flex items-center gap-2"
              style={{ fontSize: '0.85rem' }}
            >
              <Plus className="w-4 h-4" />
              Crear Mesa
            </Link>
          </div>
        </motion.div>

        {/* Quick play vs bot card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={handlePlayBot}
          className="mb-6 p-6 rounded-2xl cursor-pointer group"
          style={{
            background: 'linear-gradient(135deg, rgba(26,58,40,0.8) 0%, rgba(13,32,22,0.9) 100%)',
            border: '1px solid rgba(212,175,55,0.3)',
            transition: 'all 0.3s ease',
          }}
          whileHover={{
            borderColor: 'rgba(212,175,55,0.6)',
            boxShadow: '0 0 40px rgba(212,175,55,0.1)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))' }}
              >
                🤖
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Juego Rápido vs Bot
                  </h3>
                  <span className="badge badge-gold">GRATIS</span>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Practicá con nuestra IA táctica. Sin apuestas, sin registro especial.
                </p>
              </div>
            </div>
            <motion.div
              whileHover={{ x: 4 }}
              className="btn btn-gold flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Jugar
            </motion.div>
          </div>
        </motion.div>

        {/* Online tables — coming soon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl text-center"
          style={{
            background: 'rgba(13,32,22,0.6)',
            border: '1px dashed rgba(212,175,55,0.25)',
          }}
        >
          <div
            className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}
          >
            <WifiOff className="w-5 h-5" style={{ color: 'var(--color-gold)' }} />
          </div>
          <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
            Mesas online — próximamente
          </h3>
          <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--color-text-muted)' }}>
            Todavía no hay mesas públicas activas. Estamos conectando el multijugador
            en tiempo real; mientras tanto, desafíá a la IA en el juego rápido.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
