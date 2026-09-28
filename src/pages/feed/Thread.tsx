import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createPost, getThread } from '@/services/feedService'
import { uploadImage, IMAGE_PRESETS } from '@/services/storageService'
import type { Post } from '@/types/post'
import { useAuth } from '@/hooks/useAuth'
import { usePostActions } from '@/hooks/usePostActions'
import Composer from '@/components/feed/Composer'
import PostItem from '@/components/feed/PostItem'
import { BackIcon, CloseIcon } from '@/components/feed/icons'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'

export default function Thread() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [thread, setThread] = useState<Post[]>([]) // [0] = publicação principal, depois as respostas
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [replyTarget, setReplyTarget] = useState<Post | null>(null)
  const composerRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getThread(id, user?.id)
      if (!data) {
        setNotFound(true)
        setThread([])
      } else {
        setNotFound(false)
        setThread(data)
      }
    } catch (e) {
      console.error(e)
      setError('Não foi possível carregar a conversa.')
    } finally {
      setLoading(false)
    }
  }, [id, user?.id])

  useEffect(() => {
    load()
  }, [load])

  const root = thread[0]
  const actions = usePostActions(setThread, {
    onDeleted: (post) => {
      if (root && post.id === root.id) navigate('/feed', { replace: true })
      else load() // as respostas da resposta apagada desaparecem também
    }
  })

  const target = replyTarget ?? root

  async function handleReply(body: string, image: File | null) {
    if (!user || !target) return
    const imageUrl = image ? await uploadImage('post-media', user.id, image, IMAGE_PRESETS.post) : undefined
    const created = await createPost(user.id, body, imageUrl, target.id)
    setThread((prev) => [
      ...prev.map((p) => (p.id === target.id ? { ...p, replyCount: (p.replyCount ?? 0) + 1 } : p)),
      created
    ])
    setReplyTarget(null)
  }

  function startReply(post: Post) {
    setReplyTarget(post.id === root?.id ? null : post)
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const nicknameOf = (postId: string | null) => thread.find((p) => p.id === postId)?.authorNickname

  return (
    <div className="pb-24 max-w-xl mx-auto">
      <header className="sticky top-0 z-30 bg-base-900/90 backdrop-blur border-b border-base-700 flex items-center gap-2 px-2 py-3">
        <button type="button" onClick={() => navigate(-1)} aria-label="Voltar" className="p-2">
          <BackIcon size={22} />
        </button>
        <h1 className="font-semibold">Conversa</h1>
      </header>

      {loading && <LoadingState />}
      {error && (
        <div className="px-4 pt-4">
          <ErrorState message={error} onRetry={load} />
        </div>
      )}
      {!loading && notFound && (
        <div className="px-4 pt-4">
          <EmptyState title="Esta publicação já não existe." description="Pode ter sido eliminada." />
          <Link to="/feed" className="block text-center text-sm text-accent-soft mt-3">
            Voltar ao feed
          </Link>
        </div>
      )}

      {!loading && root && (
        <>
          <PostItem
            post={root}
            showLine={thread.length > 1}
            currentUserId={actions.currentUserId}
            canModerate={actions.canModerate}
            onLike={actions.onLike}
            onRepost={actions.onRepost}
            onShare={actions.onShare}
            onDelete={actions.onDelete}
            onReport={actions.onReport}
            onReply={startReply}
          />

          <div ref={composerRef}>
            {replyTarget && (
              <div className="flex items-center justify-between px-4 py-2 text-xs text-white/60 bg-base-800 border-b border-base-700">
                <span>A responder a @{replyTarget.authorNickname}</span>
                <button type="button" onClick={() => setReplyTarget(null)} aria-label="Cancelar" className="p-1">
                  <CloseIcon size={14} />
                </button>
              </div>
            )}
            <Composer
              key={target?.id}
              avatarUrl={profile?.avatarUrl}
              nickname={profile?.nickname}
              placeholder={`Responder a @${target?.authorNickname ?? 'jogador'}…`}
              submitLabel="Responder"
              onSubmit={handleReply}
            />
          </div>

          {thread.slice(1).map((p) => (
            <PostItem
              key={p.id}
              post={p}
              replyingTo={p.parentId && p.parentId !== root.id ? nicknameOf(p.parentId) : undefined}
              currentUserId={actions.currentUserId}
              canModerate={actions.canModerate}
              onLike={actions.onLike}
              onRepost={actions.onRepost}
              onShare={actions.onShare}
              onDelete={actions.onDelete}
              onReport={actions.onReport}
              onReply={startReply}
            />
          ))}

          {thread.length === 1 && (
            <p className="text-center text-sm text-white/40 py-8">Ainda ninguém respondeu. Começa a conversa.</p>
          )}
        </>
      )}

      {actions.overlays}
    </div>
  )
}
