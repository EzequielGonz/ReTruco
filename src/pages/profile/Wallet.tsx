import { useState } from 'react'
import { CreditCard, Copy, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

export default function Wallet() {
  const { user, updateBalance } = useAuthStore()
  const [depositAmount, setDepositAmount] = useState('')
  const [copied, setCopied] = useState(false)

  const handleDeposit = async () => {
    if (!depositAmount || Number(depositAmount) <= 0) return
    await updateBalance(Number(depositAmount))
    setDepositAmount('')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="py-12">
      <div className="container-custom">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Billetera</h1>
            <p className="text-text-muted">Gestioná tu saldo y depósitos</p>
          </div>

          <div className="card p-8 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted mb-2 uppercase tracking-wider font-medium">Saldo Disponible</p>
                <p className="text-5xl font-bold">${user?.balance.toFixed(2)}</p>
              </div>
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Depositar Dinero</h2>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Monto ($)</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="input"
                    placeholder="100"
                  />
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={!depositAmount || Number(depositAmount) <= 0}
                  className="btn btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cargar Saldo
                </button>
              </div>

              <div className="bg-background rounded-xl p-6">
                <p className="text-sm font-medium text-text-muted mb-4">Datos para transferencia</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-muted">Nombre:</span>
                    <span className="font-medium text-sm">Ezequiel Gustavo Gonzalez</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-muted">CBU:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">0000000000000000000000</span>
                      <button
                        onClick={() => copyToClipboard('0000000000000000000000')}
                        className="text-primary hover:text-primary-dark"
                      >
                        {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-muted">Alias:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-primary">retruco.mp</span>
                      <button
                        onClick={() => copyToClipboard('retruco.mp')}
                        className="text-primary hover:text-primary-dark"
                      >
                        {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-xl font-bold">Mercado Pago</h2>
              </div>

              <p className="text-text-muted text-sm mb-6">
                Integración con Mercado Pago próximamente. Por ahora, utilizá la transferencia bancaria para cargar saldo.
              </p>

              <button
                disabled
                className="btn btn-secondary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximamente
              </button>
            </div>
          </div>

          <div className="mt-8 card p-8">
            <h3 className="text-xl font-bold mb-4">Historial de Transacciones</h3>
            <p className="text-text-muted text-center py-8">
              No hay transacciones recientes
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
