import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, User, Coins, ChevronDown, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'

export default function Header() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path: string) => location.pathname === path

  const navLinks = isAuthenticated
    ? [
        { href: '/lobby', label: 'Jugar' },
        { href: '/profile', label: 'Perfil' },
      ]
    : []

  return (
    <header
      className="relative z-50 sticky top-0"
      style={{
        background: 'rgba(6, 13, 8, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
      }}
    >
      {/* Top golden line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.6) 50%, transparent 100%)',
        }}
      />

      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.05 }}
              transition={{ duration: 0.4 }}
              className="relative w-10 h-10 flex items-center justify-center rounded-lg"
              style={{
                background: 'linear-gradient(135deg, #d4af37 0%, #8a7030 100%)',
                boxShadow: '0 0 20px rgba(212,175,55,0.4)',
              }}
            >
              <span className="text-xl font-bold" style={{ color: '#1a1000', fontFamily: 'Playfair Display, serif' }}>
                RT
              </span>
              <div
                className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              />
            </motion.div>
            <div className="flex flex-col leading-none">
              <span
                className="text-xl font-bold"
                style={{
                  fontFamily: 'Playfair Display, serif',
                  background: 'linear-gradient(135deg, #f0d060 0%, #d4af37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                ReTruco
              </span>
              <span className="text-xs" style={{ color: 'rgba(212,175,55,0.6)', letterSpacing: '0.15em' }}>
                TRUCO ARGENTINO
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  color: isActive(link.href) ? 'var(--color-gold)' : 'var(--color-text-muted)',
                  background: isActive(link.href) ? 'rgba(212,175,55,0.1)' : 'transparent',
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                {/* Balance */}
                <div
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{
                    background: 'rgba(212,175,55,0.08)',
                    border: '1px solid rgba(212,175,55,0.2)',
                  }}
                >
                  <Coins className="w-4 h-4" style={{ color: 'var(--color-gold)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-gold-light)' }}>
                    ${user.balance.toLocaleString('es-AR')}
                  </span>
                </div>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200"
                    style={{
                      background: menuOpen ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(212,175,55,0.2)',
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: 'linear-gradient(135deg, #d4af37, #8a7030)', color: '#1a1000' }}
                    >
                      {user.username[0].toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {user.username}
                    </span>
                    <ChevronDown
                      className="w-3 h-3 transition-transform"
                      style={{
                        color: 'var(--color-text-muted)',
                        transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </button>

                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden"
                        style={{
                          background: 'rgba(10, 22, 14, 0.98)',
                          border: '1px solid rgba(212,175,55,0.3)',
                          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                        }}
                        onMouseLeave={() => setMenuOpen(false)}
                      >
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-3 text-sm transition-colors"
                          style={{ color: 'var(--color-text-muted)' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-gold)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                          onClick={() => setMenuOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          Mi Perfil
                        </Link>
                        <div className="divider-gold mx-2" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors"
                          style={{ color: '#ef4444' }}
                        >
                          <LogOut className="w-4 h-4" />
                          Cerrar Sesión
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="btn btn-ghost text-sm py-2 px-4"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="btn btn-gold text-xs py-2 px-4"
                >
                  Registrarse
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            {isAuthenticated && (
              <button
                className="md:hidden btn btn-ghost p-2"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <AnimatePresence>
          {menuOpen && isAuthenticated && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden pb-4"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="block px-4 py-3 text-sm rounded-lg mt-1"
                  style={{ color: 'var(--color-text-muted)' }}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
