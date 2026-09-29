import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listBlockedPlayers, unblockPlayer } from '@/services/settingsService'
import type { BlockedPlayer } from '@/types/settings'
import { useToast } from '@/components/ui/Toast'
import Avatar from '@/components/ui/Avatar'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import { BackIcon } from '@/components/feed/icons'

export default function BlockedPlayers() {
  const navigate = useNavigate()
  const { toast, show } = useToast()
  const [items, setItems] = useState<BlockedPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await listBlockedPlayers())
    } catch (e) {
      console.error(e)
      setError('Não foi possível carregar a lista.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleUnblock(p: BlockedPlayer) {
    if (!window.confirm(`Desbloquear ${p.nickname}?`)) return
    const prev = items
    setItems((cur) => cur.filter((x) => x.id !== p.id))
    try {
      await unblockPlayer(p.id)
      show('Jogador desbloqueado')
    } catch (e) {
      console.error(e)
      setItems(prev)
      show('Não foi possível desbloquear.')
    }
  }

  return (
    <div className="pb-24 max-w-xl mx-auto">
      {toast}
      <header className="sticky top-0 z-30 bg-base-900/90 backdrop-blur border-b border-base-700 flex items-center gap-2 px-2 py-3">
        <button type="button" onClick={() => navigate('/settings')} aria-label="Voltar" className="p-2">
          <BackIcon size={22} />
        </button>
        <h1 className="font-semibold">Jogadores bloqueados</h1>
      </header>

      {loading && <LoadingState />}
      {error && (
        <div className="px-4 pt-4">
          <ErrorState message={error} onRetry={load} />
        </div>
      )}
      {!loading && !error && items.length === 0 && (
        <div className="px-4 pt-4">
          <EmptyState title="Sem jogadores bloqueados." description="Quem bloqueares aparece aqui." />
        </div>
      )}
      {!loading &&
        items.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-base-700">
            <Link to={`/players/${p.id}`} className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar src={p.avatarUrl} name={p.nickname} size={44} />
              <span className="truncate font-medium">{p.nickname}</span>
            </Link>
            <button
              type="button"
              onClick={() => handleUnblock(p)}
              className="text-xs font-semibold text-accent-soft border border-accent-soft/40 rounded-full px-3 py-1.5 shrink-0"
            >
              Desbloquear
            </button>
          </div>
        ))}
    </div>
  )
}
