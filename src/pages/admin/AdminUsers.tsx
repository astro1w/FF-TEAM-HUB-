import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { listUsers, setUserStatus, setUserRole } from '@/services/adminService'
import LoadingState from '@/components/ui/LoadingState'
import Button from '@/components/ui/Button'

export default function AdminUsers() {
  const { profile, user } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  async function load(q?: string) {
    setLoading(true)
    try {
      setUsers(await listUsers(q))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (profile && profile.role !== 'admin') return <Navigate to="/home" replace />

  return (
    <div className="px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Utilizadores</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          load(search)
        }}
        className="mb-4"
      >
        <input
          className="input-field"
          placeholder="Pesquisar nickname..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>
      {loading && <LoadingState />}
      {!loading && (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="card !py-3">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-medium">{u.nickname}</p>
                  <p className="text-xs text-white/40">
                    {u.role} · {u.status} · {u.country}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {u.status === 'active' ? (
                  <Button
                    className="!py-1 !px-2 text-xs"
                    variant="secondary"
                    onClick={async () => {
                      await setUserStatus(u.id, 'suspended', 'Moderação', user?.id)
                      load(search)
                    }}
                  >
                    Suspender
                  </Button>
                ) : (
                  <Button
                    className="!py-1 !px-2 text-xs"
                    variant="secondary"
                    onClick={async () => {
                      await setUserStatus(u.id, 'active', undefined, user?.id)
                      load(search)
                    }}
                  >
                    Reativar
                  </Button>
                )}
                <Button
                  className="!py-1 !px-2 text-xs"
                  variant="secondary"
                  onClick={async () => {
                    await setUserStatus(u.id, 'banned', 'Ban', user?.id)
                    load(search)
                  }}
                >
                  Banir
                </Button>
                {profile?.role === 'admin' && u.role !== 'admin' && (
                  <select
                    className="input-field !py-1 !px-2 text-xs w-auto"
                    value={u.role}
                    onChange={async (e) => {
                      await setUserRole(u.id, e.target.value, user!.id)
                      load(search)
                    }}
                  >
                    {['player', 'captain', 'organizer', 'moderator', 'admin'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
