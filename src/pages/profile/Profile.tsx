import { Link } from 'react-router-dom'
import { User, Wallet, Trophy, Gamepad2 } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

export default function Profile() {
  const { user } = useAuthStore()

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted mb-4">Iniciá sesión para ver tu perfil</p>
        <Link to="/login" className="text-primary hover:text-primary-dark font-medium">
          Iniciar Sesión
        </Link>
      </div>
    )
  }

  const stats = [
    { icon: Gamepad2, label: 'Partidas Jugadas', value: '0' },
    { icon: Trophy, label: 'Victorias', value: '0' },
    { icon: Wallet, label: 'Saldo', value: `$${user.balance.toFixed(2)}` },
  ]

  return (
    <div className="py-12">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <div className="card p-8 mb-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center">
                <User className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">{user.username}</h1>
                <p className="text-text-muted">{user.email}</p>
                <p className="text-sm text-text-muted mt-1">
                  Miembro desde {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="card p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-sm font-medium text-text-muted mb-1">{stat.label}</h3>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>

          <Link
            to="/wallet"
            className="block card p-6 hover:border-primary transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">Administrar Billetera</h3>
                <p className="text-text-muted">Depositá fondos y gestioná tu saldo</p>
              </div>
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                <Wallet className="h-5 w-5 text-white" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
