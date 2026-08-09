import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../../stores/gameStore'
import { useAuthStore } from '../../stores/authStore'
import {
  Plus, Users, Clock, Coins, Play, Bot,
  Trophy, Zap, RefreshCw
} from 'lucide-react'
import type { Player } from '../../types'

// Mock table data for display
const mockTables = [
  {
    id: '1',
    name: 'Mesa de los Campeones',
    host: 'El Flaco',
    players: 1,
    maxPlayers: 2,
    buyIn: 500,
    status: 'waiting',
    timeAgo: '2 min',
  },
  {
    id: '2',
    name: 'Mesa del Barrio',
    host: 'Cachito',
    players: 2,
    maxPlayers: 2,
    buyIn: 100,
    status: 'playing',
    timeAgo: '8 min',
  },
  {
    id: '3',
    name: 'Truco Rápido',
    host: 'La Tana',
    players: 1,
    maxPlayers: 2,
    buyIn: 250,
    status: 'waiting',
    timeAgo: '1 min',
  },
  {
    id: '4',
    name: 'Mesa VIP',
    host: 'Don Pedro',
    players: 1,
    maxPlayers: 2,
    buyIn: 1000,
    status: 'waiting',
    timeAgo: '5 min',
  },
  {
    id: '5',
    name: 'El Clásico',
    host: 'Marito',
    players: 2,
    maxPlayers: 2,
    buyIn: 200,
    status: 'playing',
    timeAgo: '15 min',
  },
  {
    id: '6',
    name: 'Truco Familiar',
    host: 'Beto',
    players: 1,
    maxPlayers: 2,
    buyIn: 50,
    status: 'waiting',
    timeAgo: '30 seg',
  },
]

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

        {/* Live stats bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-6 mb-8 px-5 py-4 rounded-xl"
          style={{
            background: 'rgba(212,175,55,0.05)',
            border: '1px solid rgba(212,175,55,0.15)',
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              <span className="font-semibold" style={{ color: '#22c55e' }}>124</span> mesas activas
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5" style={{ color: 'var(--color-gold)' }} />
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              <span className="font-semibold" style={{ color: 'var(--color-gold)' }}>847</span> jugadores online
            </span>
          </div>
          <button
            className="ml-auto flex items-center gap-1.5 text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar
          </button>
        </motion.div>

        {/* Quick play vs bot card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
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

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="divider-gold flex-1" />
          <span className="text-xs tracking-widest" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.2em' }}>
            MESAS PÚBLICAS
          </span>
          <div className="divider-gold flex-1" />
        </div>

        {/* Tables grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {mockTables.map((table, i) => (
            <motion.div
              key={table.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl overflow-hidden group cursor-pointer"
              style={{
                background: 'rgba(13,32,22,0.7)',
                border: `1px solid ${table.status === 'waiting' ? 'rgba(212,175,55,0.2)' : 'rgba(34,197,94,0.2)'}`,
                transition: 'all 0.3s ease',
              }}
            >
              {/* Table card header */}
              <div
                className="px-5 py-4"
                style={{
                  background: table.status === 'waiting'
                    ? 'rgba(212,175,55,0.05)'
                    : 'rgba(34,197,94,0.05)',
                  borderBottom: `1px solid ${table.status === 'waiting' ? 'rgba(212,175,55,0.15)' : 'rgba(34,197,94,0.15)'}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <h3
                    className="font-bold text-base truncate"
                    style={{ fontFamily: 'Playfair Display, serif', color: 'var(--color-text)' }}
                  >
                    {table.name}
                  </h3>
                  <span
                    className={`badge ${table.status === 'waiting' ? 'badge-gold' : 'badge-green'}`}
                  >
                    {table.status === 'waiting' ? '⏳ Esperando' : '🎴 Jugando'}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Hosteada por <span style={{ color: 'var(--color-gold-light)' }}>{table.host}</span>
                </p>
              </div>

              {/* Table card body */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {table.players}/{table.maxPlayers}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {table.timeAgo}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4" style={{ color: 'var(--color-gold)' }} />
                    <span className="font-bold" style={{ color: 'var(--color-gold-light)', fontSize: '1rem' }}>
                      ${table.buyIn.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>

                {table.status === 'waiting' ? (
                  <button
                    className="w-full btn btn-gold py-3 text-xs"
                    onClick={handlePlayBot}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Unirse a la Mesa
                  </button>
                ) : (
                  <button
                    className="w-full btn btn-felt py-3 text-xs"
                    disabled
                    style={{ opacity: 0.5, cursor: 'not-allowed' }}
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    Partida en Curso
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination / load more */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 text-center"
        >
          <button
            className="btn btn-felt px-8"
          >
            <RefreshCw className="w-4 h-4" />
            Cargar más mesas
          </button>
        </motion.div>
      </div>
    </div>
  )
}
