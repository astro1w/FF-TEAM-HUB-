import { useEffect, useState } from 'react';
import { listNotifications, markRead, markAllRead, type Notification } from '@/services/notificationService'
import { useAuth } from '@/hooks/useAuth'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'

export default function Notifications() {
  const { user } = useAuth()
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    listNotifications(user.id)
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  async function handleRead(n: Notification) {
    if (n.read) return
    await markRead(n.id)
    setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read: true } : i)))
  }

  async function handleAll() {
    if (!user) return
    await markAllRead(user.id)
    setItems((prev) => prev.map((i) => ({ ...i, read: true })))
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Notificações</h1>
        {items.some((i) => !i.read) && (
          <button type="button" className="text-xs text-accent-soft" onClick={handleAll}>
            Marcar todas
          </button>
        )}
      </div>
      {loading && <LoadingState />}
      {!loading && items.length === 0 && (
        <EmptyState title="Sem notificações." description="Candidaturas e updates aparecem aqui." />
      )}
      {!loading && items.length > 0 && (
        <div className="space-y-2">
          {items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => handleRead(n)}
              className={`card w-full text-left !py-3 ${!n.read ? 'border-accent/30' : ''}`}
            >
              <p className="font-medium text-sm">{n.title}</p>
              {n.body && <p className="text-xs text-white/50 mt-0.5">{n.body}</p>}
              <p className="text-[10px] text-white/30 mt-1">
                {new Date(n.createdAt).toLocaleString('pt-MZ')}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
