import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'
import { listConversations } from '@/services/messageService'
import type { Conversation } from '@/types/message'
import { useAuth } from '@/hooks/useAuth'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'

export default function Messages() {
  const { user } = useAuth()
  const [convs, setConvs] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    listConversations(user.id)
      .then(setConvs)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Mensagens</h1>
      {loading && <LoadingState />}
      {!loading && convs.length === 0 && (
        <EmptyState
          title="Sem conversas."
          description="Contacta um jogador a partir do perfil dele."
        />
      )}
      {!loading && convs.length > 0 && (
        <div className="space-y-2">
          {convs.map((c) => (
            <Link key={c.id} to={`/messages/${c.id}`} className="card !py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-base-700 flex items-center justify-center text-sm font-bold">
                {(c.otherNickname ?? c.title ?? '?').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{c.otherNickname ?? c.title ?? 'Conversa'}</p>
                <p className="text-xs text-white/40 truncate">{c.lastMessage ?? 'Sem mensagens'}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
