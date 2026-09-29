import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { listConversations, subscribeInbox } from '@/services/messageService'
import type { Conversation } from '@/types/message'
import { useAuth } from '@/hooks/useAuth'
import { usePresence } from '@/hooks/usePresence'
import { timeAgo } from '@/utils/time'
import Avatar from '@/components/ui/Avatar'
import VerifiedBadge from '@/components/ui/VerifiedBadge'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'

export default function Messages() {
  const { user } = useAuth()
  const online = usePresence(user?.id)
  const [convs, setConvs] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const load = useCallback(
    async (silent = false) => {
      if (!user) return
      const id = ++requestId.current
      if (!silent) setLoading(true)
      setError(null)
      try {
        const data = await listConversations()
        if (id === requestId.current) setConvs(data)
      } catch (e) {
        console.error(e)
        if (id === requestId.current && !silent) setError('Não foi possível carregar as conversas.')
      } finally {
        if (id === requestId.current) setLoading(false)
      }
    },
    [user?.id]
  )

  useEffect(() => {
    load()
  }, [load])

  // Tempo real: nova mensagem ou leitura → atualiza a lista (agrupa rajadas num só pedido).
  useEffect(() => {
    if (!user) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const unsub = subscribeInbox(user.id, () => {
      clearTimeout(timer)
      timer = setTimeout(() => load(true), 300)
    })
    return () => {
      clearTimeout(timer)
      unsub()
    }
  }, [user?.id, load])

  return (
    <div className="pb-24 max-w-xl mx-auto">
      <header className="sticky top-0 z-30 bg-base-900/90 backdrop-blur border-b border-base-700 px-4 py-3.5">
        <h1 className="text-lg font-bold">Mensagens</h1>
      </header>

      {loading && <LoadingState />}
      {error && (
        <div className="px-4 pt-4">
          <ErrorState message={error} onRetry={() => load()} />
        </div>
      )}
      {!loading && !error && convs.length === 0 && (
        <div className="px-4 pt-4">
          <EmptyState title="Sem conversas." description="Abre o perfil de um jogador e toca em mensagem para começar." />
        </div>
      )}

      {!loading &&
        convs.map((c) => {
          const name = c.otherNickname ?? c.title ?? 'Conversa'
          const unread = c.unreadCount > 0
          const mine = c.lastSenderId === user?.id
          const isOnline = !!c.otherId && c.otherShowOnline !== false && online.has(c.otherId)
          return (
            <Link
              key={c.id}
              to={`/messages/${c.id}`}
              className="flex items-center gap-3 px-4 py-3 border-b border-base-700 active:bg-base-800"
            >
              <div className="relative shrink-0">
                <Avatar src={c.otherAvatar} name={name} size={52} />
                {isOnline && (
                  <span
                    className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-success border-2 border-base-900"
                    aria-label="Online"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={`truncate text-[15px] ${unread ? 'font-bold' : 'font-medium'}`}>{name}</p>
                  {c.otherVerified && <VerifiedBadge size={14} />}
                  {c.lastMessageAt && (
                    <span className={`ml-auto text-xs shrink-0 ${unread ? 'text-accent' : 'text-white/40'}`}>
                      {timeAgo(c.lastMessageAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <p className={`truncate text-sm flex-1 ${unread ? 'text-white' : 'text-white/45'}`}>
                    {c.lastMessage ? `${mine ? 'Tu: ' : ''}${c.lastMessage}` : 'Sem mensagens'}
                  </p>
                  {unread && (
                    <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center">
                      {c.unreadCount > 99 ? '99+' : c.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
    </div>
  )
}
