import { Link } from 'react-router-dom'
import { Coins, Users, Shield, Zap, Play } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { motion } from 'framer-motion'

export default function Home() {
  const { isAuthenticated } = useAuthStore()

  return (
    <div className="min-h-screen">
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-primary mb-8 shadow-2xl shadow-primary/30"
            >
              <Coins className="h-10 w-10 text-white" />
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 gradient-text">
              ReTruco
            </h1>

            <p className="text-xl md:text-2xl text-text-muted mb-10 max-w-3xl mx-auto leading-relaxed">
              La plataforma definitiva para jugar al truco argentino.
              <span className="text-primary font-medium"> Cartas españolas reales</span>,
              reglas oficiales y la mejor experiencia online.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link to="/create-table" className="btn btn-primary text-base px-8 py-4">
                <Play className="h-5 w-5" />
                {isAuthenticated ? 'Jugar Ahora' : 'Empezar a Jugar'}
              </Link>
              {!isAuthenticated && (
                <Link to="/register" className="btn btn-secondary text-base px-8 py-4">
                  Crear Cuenta
                </Link>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="card p-6 text-center card-hover">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Cartas Españolas Reales</h3>
                <p className="text-text-muted text-sm">
                  Mazo de 40 cartas con diseños SVG fieles a las cartas españolas tradicionales.
                </p>
              </div>

              <div className="card p-6 text-center card-hover">
                <div className="w-14 h-14 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-7 w-7 text-success" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Reglas Oficiales</h3>
                <p className="text-text-muted text-sm">
                  Truco, Envido, Flor y todas las reglas del truco argentino implementadas.
                </p>
              </div>

              <div className="card p-6 text-center card-hover">
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-lg font-semibold mb-2">IA Avanzada</h3>
                <p className="text-text-muted text-sm">
                  Juega contra un bot con estrategia realista.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">
            <div className="card p-8 md:p-10">
              <h2 className="text-2xl font-bold mb-6 text-center">Depósitos por Transferencia</h2>
              <p className="text-text-muted text-center mb-8">
                Para depositar fondos en tu cuenta, realizá una transferencia a:
              </p>
              <div className="bg-background rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-text-muted font-medium">Nombre:</span>
                  <span className="font-semibold">Ezequiel Gustavo Gonzalez</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between items-center">
                  <span className="text-text-muted font-medium">CBU:</span>
                  <span className="font-mono text-sm">0000000000000000000000</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between items-center">
                  <span className="text-text-muted font-medium">Alias:</span>
                  <span className="font-mono text-sm text-primary">retruco.mp</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
