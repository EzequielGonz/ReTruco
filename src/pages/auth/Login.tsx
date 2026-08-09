import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, Mail, Lock } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/lobby')
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(26,58,40,0.4) 0%, transparent 60%),
            radial-gradient(ellipse at 70% 80%, rgba(212,175,55,0.08) 0%, transparent 50%)
          `,
        }}
      />
      <div
        className="absolute -top-32 -right-32 w-96 h-96 pointer-events-none opacity-50"
        style={{
          background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Form container */}
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(13,32,22,0.85)',
              border: '1px solid rgba(212,175,55,0.25)',
              boxShadow: '0 30px 60px rgba(0,0,0,0.6), 0 0 40px rgba(212,175,55,0.05)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Header */}
            <div className="px-8 pt-10 pb-6 text-center">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, #d4af37, #8a7030)',
                  boxShadow: '0 10px 30px rgba(212,175,55,0.3)',
                }}
              >
                🃏
              </div>
              <h1
                className="text-3xl font-bold mb-2"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Bienvenido de vuelta
              </h1>
              <p style={{ color: 'var(--color-text-muted)' }}>
                Ingresá tus credenciales para jugar
              </p>
            </div>

            {/* Form */}
            <div className="px-8 pb-10">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3 rounded-xl text-sm text-center"
                    style={{
                      background: 'rgba(196,30,58,0.1)',
                      border: '1px solid rgba(196,30,58,0.3)',
                      color: '#fca5a5',
                    }}
                  >
                    {error}
                  </motion.div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-gold-light)' }}>
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                    <input
                      type="email"
                      required
                      className="input pl-10"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-gold-light)' }}>
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                    <input
                      type="password"
                      required
                      className="input pl-10"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="btn btn-gold w-full py-3.5 mt-4"
                  style={{ borderRadius: '0.75rem', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? (
                    <div
                      className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                      style={{ animation: 'spin 0.8s linear infinite' }}
                    />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Iniciar Sesión
                    </>
                  )}
                </motion.button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  ¿No tenés cuenta?{' '}
                  <Link
                    to="/register"
                    className="font-medium hover:underline transition-all"
                    style={{ color: 'var(--color-gold-light)' }}
                  >
                    Registrate acá
                  </Link>
                </p>
                <div className="mt-6 pt-6 border-t border-white/5">
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Para probar la plataforma premium: <br />
                    <span style={{ color: 'var(--color-gold)' }}>premium@retruco.com / premium123</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
