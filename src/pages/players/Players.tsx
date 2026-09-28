import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { listPlayers, type PlayerListItem } from '@/services/playerService'
import { followProfile, unfollowProfile } from '@/services/followService'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import { MOZAMBIQUE_PROVINCES, PLAYER_ROLES, ROLE_LABELS, flagEmoji } from '@/types/user'
import Avatar from '@/components/ui/Avatar'
import VerifiedBadge from '@/components/ui/VerifiedBadge'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'

export default function Players() {
  const { user } = useAuth()
  const { toast, show } = useToast()
  const [items, setItems] = useState<PlayerListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [province, setProvince] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const requestId = useRef(0)

  // Espera o utilizador parar de escrever (poupa pedidos em dados móveis)
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const load = useCallback(
    async (nextPage: number) => {
      if (!user) return
      const myRequest = ++requestId.current
      nextPage === 0 ? setLoading(true) : setLoadingMore(true)
      setError(null)
      try {
        const res = await listPlayers(user.id, { search, role, province, page: nextPage })
        if (myRequest !== requestId.current) return // resposta antiga, ignorar
        setItems((prev) => (nextPage === 0 ? res.items : [...prev, ...res.items]))
        setHasMore(res.hasMore)
        setPage(nextPage)
      } catch (e) {
        console.error(e)
        if (myRequest === requestId.current) setError('Não foi possível carregar os jogadores.')
      } finally {
        if (myRequest === requestId.current) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [user?.id, search, role, province]
  )

  useEffect(() => {
    load(0)
  }, [load])

  async function toggleFollow(targetId: string) {
    if (!user || busyId) return
    const current = items.find((i) => i.profile.id === targetId)
    if (!current) return
    const was = current.isFollowing
    setBusyId(targetId)
    setItems((prev) => prev.map((i) => (i.profile.id === targetId ? { ...i, isFollowing: !was } : i)))
    try {
      if (was) await unfollowProfile(user.id, targetId)
      else await followProfile(user.id, targetId)
    } catch (e) {
      console.error(e)
      setItems((prev) => prev.map((i) => (i.profile.id === targetId ? { ...i, isFollowing: was } : i)))
      show('Não foi possível atualizar. Tenta novamente.')
    } finally {
      setBusyId(null)
    }
  }

  const hasFilters = !!(search || role || province)

  return (
    <div className="px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold">Jogadores</h1>
      <p className="text-sm text-white/50 mt-1 mb-4">Encontra jogadores registados e segue-os.</p>

      <input
        type="search"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Pesquisar por nickname ou ID (FTH-MZ-...)"
        aria-label="Pesquisar jogadores"
        className="w-full bg-base-700 rounded-xl px-4 h-12 text-sm outline-none focus:ring-2 focus:ring-accent"
      />

      <div className="flex gap-2 mt-3">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          aria-label="Filtrar por função"
          className="flex-1 bg-base-700 rounded-xl px-3 h-11 text-sm"
        >
          <option value="">Todas as funções</option>
          {PLAYER_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <select
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          aria-label="Filtrar por província"
          className="flex-1 bg-base-700 rounded-xl px-3 h-11 text-sm"
        >
          <option value="">Todas as províncias</option>
          {MOZAMBIQUE_PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <LoadingState message="A carregar jogadores..." />
        ) : error ? (
          <ErrorState message={error} onRetry={() => load(0)} />
        ) : items.length === 0 ? (
          <EmptyState
            title={hasFilters ? 'Nenhum jogador encontrado.' : 'Ainda não há outros jogadores registados.'}
            description={hasFilters ? 'Tenta mudar a pesquisa ou os filtros.' : 'Convida amigos para se registarem no FF TEAM HUB.'}
          />
        ) : (
          items.map(({ profile: p, isFollowing }) => (
            <div key={p.id} className="card !py-3 flex items-center gap-3">
              <Link to={`/players/${p.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar src={p.avatarUrl} name={p.nickname} size={48} />
                <div className="min-w-0">
                  <p className="font-bold truncate">
                    {p.nickname} {p.isVerified && <VerifiedBadge size={14} />}
                  </p>
                  <p className="text-xs text-white/50 truncate">
                    {flagEmoji(p.countryCode)} {p.province ?? p.country}
                    {p.primaryRole ? ` · ${ROLE_LABELS[p.primaryRole]}` : ''}
                  </p>
                  <p className="text-[11px] text-white/30 font-mono truncate">{p.competitiveId}</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => toggleFollow(p.id)}
                disabled={busyId === p.id}
                className={`shrink-0 h-10 px-4 rounded-full text-sm font-semibold transition-colors ${
                  isFollowing ? 'bg-base-700 text-white/70' : 'bg-accent text-black'
                }`}
              >
                {isFollowing ? 'A seguir' : 'Seguir'}
              </button>
            </div>
          ))
        )}
      </div>

      {!loading && !error && hasMore && (
        <button
          type="button"
          onClick={() => load(page + 1)}
          disabled={loadingMore}
          className="w-full mt-4 h-12 rounded-xl bg-base-700 text-sm font-semibold"
        >
          {loadingMore ? 'A carregar...' : 'Carregar mais'}
        </button>
      )}
      {toast}
    </div>
  )
}
