import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../stores/authStore'
import {
  Zap, Users, Shield, Trophy, ArrowRight, Copy, CheckCircle,
  Star, TrendingUp, Clock
} from 'lucide-react'
import { useState } from 'react'

// Floating card component
function FloatingCard({
  rank,
  suit,
  style,
  delay = 0,
}: {
  rank: string
  suit: string
  color: string
  style?: React.CSSProperties
  delay?: number
}) {
  const suitSymbols: Record<string, string> = {
    espadas: '⚔',
    oros: '●',
    copas: '♥',
    bastos: '§',
  }
  const suitColors: Record<string, string> = {
    espadas: '#1a2a3a',
    oros: '#d4af37',
    copas: '#c41e3a',
    bastos: '#2d5a27',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: 'easeOut' }}
      style={{
        ...style,
        animation: `float ${4 + delay}s ease-in-out ${delay}s infinite`,
      }}
      className="absolute select-none pointer-events-none"
    >
      <div
        className="rounded-xl shadow-2xl flex flex-col justify-between"
        style={{
          width: '70px',
          height: '105px',
          background: 'linear-gradient(145deg, #fdf6e3 0%, #f5e6c8 100%)',
          border: '2px solid rgba(212,175,55,0.5)',
          padding: '8px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(212,175,55,0.15)',
        }}
      >
        <div style={{ color: suitColors[suit], fontWeight: 800, fontSize: '18px', fontFamily: 'Playfair Display, serif' }}>
          {rank}
        </div>
        <div className="text-center" style={{ fontSize: '28px', color: suitColors[suit] }}>
          {suitSymbols[suit]}
        </div>
        <div
          className="self-end"
          style={{ color: suitColors[suit], fontWeight: 800, fontSize: '18px', transform: 'rotate(180deg)', fontFamily: 'Playfair Display, serif' }}
        >
          {rank}
        </div>
      </div>
    </motion.div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1.5 rounded-md transition-all"
      style={{
        background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(212,175,55,0.1)',
        color: copied ? '#22c55e' : 'var(--color-gold)',
        border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(212,175,55,0.2)'}`,
      }}
    >
      {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

const stats = [
  { label: 'Jugadores en línea', value: '847', icon: Users, color: '#22c55e' },
  { label: 'Mesas activas', value: '124', icon: Trophy, color: '#d4af37' },
  { label: 'Partidas hoy', value: '3.2K', icon: TrendingUp, color: '#c084fc' },
  { label: 'Tiempo promedio', value: '18 min', icon: Clock, color: '#60a5fa' },
]

const features = [
  {
    icon: Shield,
    title: 'Reglas Oficiales',
    desc: 'Truco, Retruco, Vale Cuatro, Envido, Real Envido, Falta Envido y Flor — implementados al 100%.',
    color: '#d4af37',
  },
  {
    icon: Users,
    title: 'Multijugador Online',
    desc: 'Creá mesas privadas o públicas y jugá contra otros jugadores de Argentina en tiempo real.',
    color: '#22c55e',
  },
  {
    icon: Zap,
    title: 'IA Táctica',
    desc: 'Practicá contra nuestro bot con estrategia avanzada inspirada en jugadores reales.',
    color: '#60a5fa',
  },
  {
    icon: Star,
    title: 'Cartas Españolas',
    desc: 'Mazo de 40 cartas español tradicional con diseños fieles y animaciones fluidas.',
    color: '#c084fc',
  },
]

export default function Home() {
  const { isAuthenticated } = useAuthStore()

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ── */}
      <section className="relative min-h-[calc(100vh-64px)] flex items-center overflow-hidden">
        {/* Background decorations */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 30% 50%, rgba(26,58,40,0.5) 0%, transparent 60%),
              radial-gradient(ellipse at 70% 30%, rgba(212,175,55,0.08) 0%, transparent 50%)
            `,
          }}
        />

        {/* Floating cards */}
        <FloatingCard rank="1" suit="espadas" color="#1a2a3a" style={{ top: '12%', right: '12%' }} delay={0} />
        <FloatingCard rank="3" suit="oros" color="#d4af37" style={{ top: '55%', right: '6%' }} delay={0.5} />
        <FloatingCard rank="7" suit="copas" color="#c41e3a" style={{ top: '20%', right: '28%' }} delay={1} />
        <FloatingCard rank="1" suit="bastos" color="#2d5a27" style={{ bottom: '18%', right: '18%' }} delay={1.5} />
        <FloatingCard rank="3" suit="espadas" color="#1a2a3a" style={{ top: '8%', right: '42%' }} delay={2} />

        <div className="container-custom relative z-10 py-20">
          <div className="max-w-2xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-6"
            >
              <span className="badge badge-gold">
                <Star className="w-3 h-3" />
                Truco Argentino Online
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6"
              style={{
                fontSize: 'clamp(3rem, 8vw, 5.5rem)',
                fontFamily: 'Playfair Display, serif',
                fontWeight: 900,
                lineHeight: 1.05,
                color: 'var(--color-text)',
              }}
            >
              Jugá al{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #f0d060 0%, #d4af37 50%, #a08820 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  display: 'inline-block',
                }}
              >
                Truco
              </span>
              <br />
              como los grandes
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg mb-10 max-w-xl leading-relaxed"
              style={{ color: 'rgba(240,230,211,0.7)' }}
            >
              La plataforma de truco argentino más completa. Jugá con reglas reales,
              cartas españolas y la emoción de apostar con{' '}
              <span style={{ color: 'var(--color-gold)', fontWeight: 600 }}>pesos argentinos</span>.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4 mb-16"
            >
              <Link
                to={isAuthenticated ? '/lobby' : '/register'}
                className="btn btn-gold text-sm px-8 py-4 flex items-center gap-2"
                style={{ fontSize: '0.9rem', borderRadius: '0.75rem' }}
              >
                Jugar Ahora
                <ArrowRight className="w-4 h-4" />
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="btn btn-felt px-8 py-4"
                  style={{ fontSize: '0.9rem', borderRadius: '0.75rem' }}
                >
                  Ya tengo cuenta
                </Link>
              )}
            </motion.div>

            {/* Live stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="px-4 py-3 rounded-xl"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(212,175,55,0.12)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                  </div>
                  <div className="text-xl font-bold" style={{ color: s.color, fontFamily: 'Playfair Display, serif' }}>
                    {s.value}
                  </div>
                  <div className="text-xs" style={{ color: 'rgba(138,158,138,0.8)' }}>{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ color: 'rgba(212,175,55,0.4)' }}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs tracking-widest" style={{ color: 'rgba(138,158,138,0.6)', letterSpacing: '0.2em' }}>
              SCROLL
            </span>
            <div className="w-px h-8" style={{ background: 'linear-gradient(180deg, rgba(212,175,55,0.4), transparent)' }} />
          </div>
        </motion.div>
      </section>

      {/* ── Deposit Banner ── */}
      <section className="py-16 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(26,58,40,0.4) 100%)',
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-px divider-gold" />
        <div className="absolute bottom-0 left-0 right-0 h-px divider-gold" />

        <div className="container-custom relative z-10">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {/* Header */}
              <div className="text-center mb-10">
                <span className="badge badge-gold mb-4">
                  💳 Depósito por Transferencia
                </span>
                <h2
                  className="text-3xl md:text-4xl mb-3"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  Cargá{' '}
                  <span className="text-gradient-gold">saldo</span>
                  {' '}y jugá
                </h2>
                <p style={{ color: 'var(--color-text-muted)' }}>
                  Transferí a nuestra cuenta y te acreditamos los puntos automáticamente
                </p>
              </div>

              {/* Card */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(13,32,22,0.8)',
                  border: '1px solid rgba(212,175,55,0.35)',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 60px rgba(212,175,55,0.05)',
                }}
              >
                {/* Card header */}
                <div
                  className="px-8 py-5 flex items-center gap-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)',
                    borderBottom: '1px solid rgba(212,175,55,0.2)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: 'linear-gradient(135deg, #d4af37, #8a7030)' }}
                  >
                    🏦
                  </div>
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--color-gold-light)' }}>
                      Datos Bancarios
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Transferencia bancaria / CBU / Alias
                    </div>
                  </div>
                </div>

                {/* Data rows */}
                <div className="px-8 py-6 space-y-0">
                  {[
                    { label: 'Titular', value: 'Ezequiel Gustavo Gonzalez', mono: false },
                    { label: 'CBU', value: '0000000000000000000000', mono: true },
                    { label: 'Alias', value: 'retruco.mp', mono: true, highlight: true },
                    { label: 'Banco', value: 'Mercado Pago', mono: false },
                  ].map((row, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between py-4">
                        <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)', minWidth: '80px' }}>
                          {row.label}
                        </span>
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <span
                            className={`text-sm ${row.mono ? 'font-mono' : 'font-medium'}`}
                            style={{
                              color: row.highlight ? 'var(--color-gold-light)' : 'var(--color-text)',
                              letterSpacing: row.mono ? '0.05em' : 'normal',
                            }}
                          >
                            {row.value}
                          </span>
                          {row.mono && <CopyButton text={row.value} />}
                        </div>
                      </div>
                      {i < 3 && (
                        <div style={{ height: '1px', background: 'rgba(212,175,55,0.1)' }} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer note */}
                <div
                  className="px-8 py-5"
                  style={{
                    background: 'rgba(34,197,94,0.06)',
                    borderTop: '1px solid rgba(34,197,94,0.15)',
                  }}
                >
                  <p className="text-sm flex items-start gap-2" style={{ color: 'rgba(134,239,172,0.8)' }}>
                    <span className="text-base mt-0.5">✓</span>
                    Después de transferir, envianos el comprobante por WhatsApp o email y acreditamos tu saldo en menos de 24hs.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2
              className="text-3xl md:text-5xl mb-4"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              La experiencia{' '}
              <span className="text-gradient-gold">definitiva</span>
            </h2>
            <p style={{ color: 'var(--color-text-muted)', maxWidth: '500px', margin: '0 auto' }}>
              Todo lo que necesitás para disfrutar el mejor truco argentino online
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="p-6 rounded-2xl group cursor-default"
                style={{
                  background: 'rgba(13,32,22,0.6)',
                  border: '1px solid rgba(212,175,55,0.15)',
                  transition: 'all 0.3s ease',
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${f.color}1a`, border: `1px solid ${f.color}33` }}
                >
                  <f.icon className="w-6 h-6" style={{ color: f.color }} />
                </div>
                <h3
                  className="text-lg mb-2"
                  style={{ fontFamily: 'Playfair Display, serif', color: 'var(--color-text)' }}
                >
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="py-20">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center rounded-3xl py-20 px-8 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(26,58,40,0.8) 0%, rgba(13,32,22,0.9) 100%)',
              border: '1px solid rgba(212,175,55,0.3)',
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.06) 0%, transparent 60%)',
                pointerEvents: 'none',
              }}
            />
            <h2
              className="text-3xl md:text-5xl mb-6 relative z-10"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              ¿Estás listo para{' '}
              <span className="text-gradient-gold">¡TRUCO!</span>?
            </h2>
            <p className="mb-10 text-lg relative z-10" style={{ color: 'rgba(240,230,211,0.6)' }}>
              Unite a miles de jugadores y demostrá que sos el mejor
            </p>
            <Link
              to={isAuthenticated ? '/lobby' : '/register'}
              className="btn btn-gold px-12 py-5 text-base relative z-10 inline-flex items-center gap-3"
              style={{ borderRadius: '1rem' }}
            >
              {isAuthenticated ? 'Ir al Lobby' : 'Crear Cuenta Gratis'}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
