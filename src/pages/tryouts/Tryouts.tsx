import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'
import { listTryouts } from '@/services/tryoutService'
import type { Tryout } from '@/types/tryout'
import TryoutCard from '@/components/tryouts/TryoutCard'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import { PLAYER_ROLES } from '@/types/user'

export default function Tryouts() {
  const [tryouts, setTryouts] = useState<Tryout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<string>('')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await listTryouts({
        role: roleFilter || undefined,
        status: 'open'
      })
      setTryouts(data)
    } catch (e) {
      console.error(e)
      setError('Não foi possível carregar os Tryouts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [roleFilter])

  return (
    <div className="px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Tryouts</h1>
        <Link to="/teams" className="text-sm text-accent-soft font-medium">
          Ver Teams
        </Link>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setRoleFilter('')}
          className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full ${
            !roleFilter ? 'bg-accent text-white' : 'bg-base-700 text-white/70'
          }`}
        >
          Todas
        </button>
        {PLAYER_ROLES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRoleFilter(r)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full ${
              roleFilter === r ? 'bg-accent text-white' : 'bg-base-700 text-white/70'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {loading && <LoadingState message="A carregar Tryouts..." />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && tryouts.length === 0 && (
        <EmptyState
          title="Ainda não existem Tryouts para esta função."
          description="Quando capitães publicarem vagas, aparecem aqui."
        />
      )}
      {!loading && !error && tryouts.length > 0 && (
        <div className="space-y-3">
          {tryouts.map((t) => (
            <TryoutCard key={t.id} tryout={t} />
          ))}
        </div>
      )}
    </div>
  )
}
