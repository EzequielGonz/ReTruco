import { Link } from 'react-router-dom'
import { Coins, User } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

export default function Header() {
  const { user, isAuthenticated, logout } = useAuthStore()

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Coins className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">ReTruco</span>
            </Link>

            {isAuthenticated && (
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  to="/lobby"
                  className="text-sm font-medium text-text-muted hover:text-text transition-colors"
                >
                  Lobby
                </Link>
                <Link
                  to="/create-table"
                  className="text-sm font-medium text-text-muted hover:text-text transition-colors"
                >
                  Crear Mesa
                </Link>
                <Link
                  to="/wallet"
                  className="text-sm font-medium text-text-muted hover:text-text transition-colors"
                >
                  Billetera
                </Link>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                <div className="hidden md:flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg">
                  <Coins className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">
                    ${user.balance.toFixed(2)}
                  </span>
                </div>

                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text transition-colors"
                >
                  <User className="h-4 w-4" />
                  {user.username}
                </Link>

                <button
                  onClick={logout}
                  className="text-sm font-medium text-danger hover:text-danger/80 transition-colors"
                >
                  Salir
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-text-muted hover:text-text transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
