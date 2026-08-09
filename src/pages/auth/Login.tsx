import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../../stores/authStore'
import { Eye, EyeOff, Coins } from 'lucide-react'

interface LoginForm {
  email: string
  password: string
}

export default function Login() {
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError('')

    try {
      await login(data.email, data.password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
              <Coins className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Iniciar Sesión</h1>
            <p className="text-text-muted">Bienvenido a ReTruco</p>
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                {...register('email', { required: 'Email requerido' })}
                type="email"
                className="input"
                placeholder="tu@email.com"
              />
              {errors.email && (
                <p className="text-danger text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  {...register('password', { required: 'Contraseña requerida' })}
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-danger text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3"
            >
              {loading ? 'Cargando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-text-muted text-center">
              ¿No tenés cuenta?{' '}
              <Link to="/register" className="text-primary hover:text-primary-dark font-medium">
                Registrate
              </Link>
            </p>
            <div className="mt-4 p-3 bg-background rounded-lg">
              <p className="text-xs text-text-muted text-center">
                <span className="font-medium">Credencial Premium:</span><br />
                premium@retruco.com / premium123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
