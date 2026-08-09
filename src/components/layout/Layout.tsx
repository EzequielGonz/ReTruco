import { Outlet } from 'react-router-dom'
import Header from './Header'

// Floating particle component
function Particles() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${5 + (i * 8.3)}%`,
    delay: `${i * 0.7}s`,
    duration: `${8 + (i % 4) * 3}s`,
    size: i % 3 === 0 ? 6 : i % 3 === 1 ? 4 : 3,
    symbol: ['♠', '♣', '♥', '♦', '🃏'][i % 5],
  }))

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute bottom-0 opacity-0 select-none"
          style={{
            left: p.left,
            fontSize: `${p.size}px`,
            color: p.id % 2 === 0 ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)',
            animation: `particle-float ${p.duration} ${p.delay} ease-in-out infinite`,
          }}
        >
          {p.symbol}
        </div>
      ))}
    </div>
  )
}

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: 'var(--color-background)' }}>
      {/* Global felt-like background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 10%, rgba(26,58,40,0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 90%, rgba(22,48,36,0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(13,32,22,0.8) 0%, transparent 80%),
            var(--color-background)
          `,
        }}
      />

      {/* Subtle gold corner accents */}
      <div
        className="fixed top-0 left-0 w-64 h-64 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle at top left, rgba(212,175,55,0.06) 0%, transparent 60%)',
        }}
      />
      <div
        className="fixed bottom-0 right-0 w-64 h-64 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle at bottom right, rgba(212,175,55,0.06) 0%, transparent 60%)',
        }}
      />

      <Particles />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
