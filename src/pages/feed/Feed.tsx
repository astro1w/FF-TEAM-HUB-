import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPost, listTimeline, PAGE_SIZE, subscribeNewTopLevelPosts, type TimelineTab } from '@/services/feedService'
import { uploadImage, IMAGE_PRESETS } from '@/services/storageService'
import type { Post } from '@/types/post'
import { useAuth } from '@/hooks/useAuth'
import { usePostActions } from '@/hooks/usePostActions'
import Composer from '@/components/feed/Composer'
import PostItem from '@/components/feed/PostItem'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import { useNavigate } from 'react-router-dom'

const TABS: { id: TimelineTab; label: string }[] = [
  { id: 'foryou', label: 'Para ti' },
  { id: 'following', label: 'A seguir' }
]

export default function Feed() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<TimelineTab>('foryou')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasNew, setHasNew] = useState(false)
  const request = useRef(0)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const posRef = useRef(posts)
  posRef.current = posts
  const actions = usePostActions(setPosts)

  const load = useCallback(async () => {
    if (!user) return
    const id = ++request.current
    setLoading(true)
    setError(null)
    setHasNew(false)
    try {
      const data = await listTimeline({ userId: user.id, tab })
      if (id !== request.current) return // resposta antiga (mudaste de separador)
      setPosts(data)
      setHasMore(data.length === PAGE_SIZE)
    } catch (e) {
      console.error(e)
      if (id === request.current) setError('Não foi possível carregar o feed.')
    } finally {
      if (id === request.current) setLoading(false)
    }
  }, [user?.id, tab])

  useEffect(() => {
    load()
  }, [load])

  // Avisa de novas publicações sem nunca reordenar/apagar o que já está na tela.
  useEffect(() => {
    if (!user) return
    return subscribeNewTopLevelPosts(() => {
      const isAtTop = window.scrollY < 80
      if (isAtTop) load()
      else setHasNew(true)
    })
  }, [user?.id, load])

  const loadMore = useCallback(async () => {
    if (!user || posts.length === 0 || loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const data = await listTimeline({ userId: user.id, tab, before: posts[posts.length - 1].createdAt })
      setPosts((prev) => [...prev, ...data.filter((d) => !prev.some((p) => p.id === d.id))])
      setHasMore(data.length === PAGE_SIZE)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingMore(false)
    }
  }, [user?.id, tab, posts, loadingMore, hasMore])

  // Scroll infinito: carrega antes de o utilizador chegar mesmo ao fundo.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || loading) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && posRef.current.length > 0) loadMore()
      },
      { rootMargin: '600px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loading, loadMore])

  async function handlePost(body: string, image: File | null) {
    if (!user) return
    const imageUrl = image ? await uploadImage('post-media', user.id, image, IMAGE_PRESETS.post) : undefined
    const created = await createPost(user.id, body, imageUrl)
    setPosts((prev) => (prev.some((p) => p.id === created.id) ? prev : [created, ...prev]))
  }

  return (
    <div className="pb-24 max-w-xl mx-auto">
      <header className="sticky top-0 z-30 bg-base-900/90 backdrop-blur border-b border-base-700">
        <div role="tablist" className="flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3.5 text-[15px] font-semibold border-b-2 transition-colors ${
                tab === t.id ? 'border-white text-white' : 'border-transparent text-white/40'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {hasNew && (
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' })
              load()
            }}
            className="absolute left-1/2 -translate-x-1/2 top-14 bg-white text-black text-sm font-semibold rounded-full px-4 py-2 shadow-lg"
          >
            Novas publicações ↑
          </button>
        )}
      </header>

      <Composer
        avatarUrl={profile?.avatarUrl}
        nickname={profile?.nickname}
        placeholder="O que há de novo?"
        onSubmit={handlePost}
      />

      {loading && <LoadingState />}
      {error && (
        <div className="px-4 pt-4">
          <ErrorState message={error} onRetry={load} />
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="px-4 pt-4">
          {tab === 'following' ? (
            <EmptyState
              title="Ainda não há publicações de quem segues."
              description="Segue jogadores para veres aqui os posts deles."
              actionLabel="Ver o feed geral"
              onAction={() => setTab('foryou')}
            />
          ) : (
            <EmptyState title="O feed ainda está vazio." description="Sê o primeiro a publicar." />
          )}
        </div>
      )}

      {!loading &&
        posts.map((p) => (
          <PostItem
            key={p.id}
            post={p}
            currentUserId={actions.currentUserId}
            canModerate={actions.canModerate}
            onLike={actions.onLike}
            onRepost={actions.onRepost}
            onShare={actions.onShare}
            onDelete={actions.onDelete}
            onReport={actions.onReport}
            onReply={(post) => navigate(`/feed/${post.id}`)}
          />
        ))}

      {!loading && <div ref={sentinelRef} aria-hidden="true" className="h-1" />}
      {!loading && loadingMore && (
        <div className="p-4 text-center text-sm text-white/40">A carregar…</div>
      )}
      {!loading && !hasMore && posts.length > 0 && (
        <p className="text-center text-xs text-white/25 py-6">Chegaste ao fim.</p>
      )}

      {actions.overlays}
    </div>
  )
}
