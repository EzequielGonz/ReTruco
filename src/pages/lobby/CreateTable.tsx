import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useTableStore } from '../../stores/tableStore'
import { ArrowLeft } from 'lucide-react'

interface CreateTableForm {
  name: string
  minBuyIn: number
  maxPlayers: number
}

export default function CreateTable() {
  const navigate = useNavigate()
  const { createTable } = useTableStore()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTableForm>({
    defaultValues: {
      name: '',
      minBuyIn: 100,
      maxPlayers: 4,
    },
  })

  const onSubmit = (data: CreateTableForm) => {
    try {
      const table = createTable(data.name, data.minBuyIn)
      navigate(`/table/${table.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear mesa')
    }
  }

  return (
    <div className="py-12">
      <div className="container-custom">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/lobby')}
            className="flex items-center gap-2 text-text-muted hover:text-text mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver al lobby
          </button>

          <div className="card p-8">
            <h1 className="text-3xl font-bold mb-6">Crear Nueva Mesa</h1>

            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nombre de la Mesa</label>
                <input
                  {...register('name', {
                    required: 'Nombre requerido',
                    minLength: { value: 3, message: 'Mínimo 3 caracteres' },
                  })}
                  type="text"
                  className="input"
                  placeholder="Ej: Mesa de Carlos"
                />
                {errors.name && (
                  <p className="text-danger text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Buy-in Mínimo ($)</label>
                <input
                  {...register('minBuyIn', {
                    required: 'Buy-in requerido',
                    min: { value: 10, message: 'Mínimo $10' },
                  })}
                  type="number"
                  className="input"
                  placeholder="100"
                />
                {errors.minBuyIn && (
                  <p className="text-danger text-sm mt-1">{errors.minBuyIn.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Cantidad de Jugadores</label>
                <select
                  {...register('maxPlayers', { required: 'Cantidad requerida' })}
                  className="input"
                >
                  <option value="2">2 jugadores</option>
                  <option value="4">4 jugadores</option>
                </select>
                {errors.maxPlayers && (
                  <p className="text-danger text-sm mt-1">{errors.maxPlayers.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/lobby')}
                  className="btn btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Crear Mesa
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
