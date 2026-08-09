import { Link } from 'react-router-dom'
import { Users, Plus, Trophy } from 'lucide-react'
import { useTableStore } from '../../stores/tableStore'

export default function Lobby() {
  const { tables, currentTable, joinTable, setCurrentTable } = useTableStore()

  const handleJoinTable = (tableId: string) => {
    const username = 'Jugador'
    try {
      joinTable(tableId, 'current-user-id', username)
      setCurrentTable(tables.find((t) => t.id === tableId) || null)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="py-12">
      <div className="container-custom">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Lobby de Mesas</h1>
            <p className="text-text-muted">Unite a una partida o creá tu propia mesa</p>
          </div>
          <Link to="/create-table" className="btn btn-primary">
            <Plus className="h-4 w-4" />
            Crear Mesa
          </Link>
        </div>

        {currentTable && (
          <div className="mb-8">
            <Link
              to={`/table/${currentTable.id}`}
              className="block card p-6 hover:border-primary transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-primary mb-1">Tu Mesa Actual</h2>
                  <p className="text-text-muted">{currentTable.name}</p>
                </div>
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
            </Link>
          </div>
        )}

        {tables.length === 0 ? (
          <div className="text-center py-20">
            <div className="card p-12 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-7 w-7 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2">No hay mesas disponibles</h3>
              <p className="text-text-muted mb-6">
                Creá una nueva mesa para empezar a jugar
              </p>
              <Link to="/create-table" className="btn btn-primary">
                <Plus className="h-4 w-4" />
                Crear Primera Mesa
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((table) => (
              <div key={table.id} className="card p-6 card-hover">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold mb-1">{table.name}</h3>
                    <p className="text-sm text-text-muted">
                      Creada por {table.hostId}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      table.status === 'waiting'
                        ? 'bg-success/10 text-success'
                        : table.status === 'playing'
                        ? 'bg-accent/10 text-accent'
                        : 'bg-text-muted/10 text-text-muted'
                    }`}
                  >
                    {table.status === 'waiting' && 'Esperando'}
                    {table.status === 'playing' && 'Jugando'}
                    {table.status === 'finished' && 'Terminada'}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-4 w-4 text-text-muted" />
                  <span className="text-sm text-text-muted">
                    {table.players.length} / {table.maxPlayers} jugadores
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-text-muted">Buy-in: </span>
                    <span className="font-semibold text-primary">${table.minBuyIn}</span>
                  </div>

                  {table.status === 'waiting' && table.players.length < table.maxPlayers && (
                    <button
                      onClick={() => handleJoinTable(table.id)}
                      className="btn btn-primary text-sm py-2"
                    >
                      Unirse
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
