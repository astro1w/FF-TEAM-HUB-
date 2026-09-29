import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  listNotifications,
  markRead,
  markAllRead,
  subscribeNotifications,
  type Notification
} from '@/services/notificationService'
import { timeAgo } from '@/utils/time'
import { useAuth } from '@/hooks/useAuth'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'

const ICONS: Partial<Record<Notification['type'], string>> = {
  application_received: '📝',
  application_accepted: '✅',
  application_rejected: '❌',
  tryout_created: '🎯',
  scrim_invitation: '⚔️',
  tournament_update: '🏆',
  match_reminder: '⏰',
  message_received: '💬',
  team_update: '👥',
  new_follower: '➕',
  post_reply: '↩️'
}

export default function Notifications() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      setItems(await listNotifications(user.id))
    } catch (e) {
      console.error(e)
      setError('Não foi possível carregar as notificações.')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!user) return
    return subscribeNotifications(user.id, load)
  }, [user?.id, load])

  async function handleOpen(n: Notification) {
    if (!n.read) {
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read: true } : i)))
      markRead(n.id).catch(console.error)
    }
    if (n.link) navigate(n.link)
  }

  async function handleAll() {
    if (!user) return
    const prev = items
    setItems((cur) => cur.map((i) => ({ ...i, read: true })))
    try {
      await markAllRead(user.id)
    } catch (e) {
      console.error(e)
      setItems(prev)
    }
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
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && (
        <EmptyState title="Sem notificações." description="Interações, candidaturas e updates aparecem aqui." />
      )}
      {!loading && !error && items.length > 0 && (
        <div className="space-y-2">
          {items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => handleOpen(n)}
              className={`card w-full text-left !py-3 flex gap-3 ${!n.read ? 'border-accent/30' : ''}`}
            >
              <span className="text-xl leading-none shrink-0" aria-hidden="true">
                {ICONS[n.type] ?? '🔔'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{n.title}</p>
                {n.body && <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{n.body}</p>}
                <p className="text-[10px] text-white/30 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.read && <span className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
