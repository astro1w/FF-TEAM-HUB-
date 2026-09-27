import React, { useEffect, useState } from 'react'
import { listPosts, createPost, toggleLike, deletePost } from '@/services/feedService'
import type { Post } from '@/types/post'
import { useAuth } from '@/hooks/useAuth'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import Button from '@/components/ui/Button'

export default function Feed() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setPosts(await listPosts(user?.id))
    } catch (e) {
      console.error(e)
      setError('Não foi possível carregar o feed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [user?.id])

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !body.trim()) return
    setPosting(true)
    try {
      const p = await createPost(user.id, body)
      setPosts((prev) => [p, ...prev])
      setBody('')
    } catch (err) {
      alert('Erro ao publicar.')
    } finally {
      setPosting(false)
    }
  }

  async function handleLike(post: Post) {
    if (!user) return
    await toggleLike(post.id, user.id, !!post.likedByMe)
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              likedByMe: !p.likedByMe,
              likeCount: (p.likeCount ?? 0) + (p.likedByMe ? -1 : 1)
            }
          : p
      )
    )
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar este post?')) return
    await deletePost(id)
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Feed</h1>

      <form onSubmit={handlePost} className="card mb-4 space-y-2">
        <textarea
          className="input-field min-h-[72px] resize-none"
          placeholder="Partilha um resultado, highlight ou recrutamento..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
        />
        <Button type="submit" loading={posting} disabled={!body.trim()} className="w-full">
          Publicar
        </Button>
      </form>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && posts.length === 0 && (
        <EmptyState title="Feed vazio." description="Sê o primeiro a publicar." />
      )}
      {!loading && posts.length > 0 && (
        <div className="space-y-3">
          {posts.map((p) => (
            <article key={p.id} className="card">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-base-700 flex items-center justify-center text-xs font-bold">
                  {(p.authorNickname ?? '?').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.authorNickname}</p>
                  <p className="text-[10px] text-white/40">
                    {new Date(p.createdAt).toLocaleString('pt-MZ')}
                  </p>
                </div>
                {user?.id === p.authorId && (
                  <button type="button" className="text-xs text-white/30" onClick={() => handleDelete(p.id)}>
                    Eliminar
                  </button>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{p.body}</p>
              {p.imageUrl && (
                <img src={p.imageUrl} alt="" className="mt-2 rounded-xl w-full max-h-64 object-cover" />
              )}
              <div className="flex gap-4 mt-3 text-xs text-white/50">
                <button type="button" onClick={() => handleLike(p)} className={p.likedByMe ? 'text-accent-soft' : ''}>
                  {p.likedByMe ? '♥' : '♡'} {p.likeCount ?? 0}
                </button>
                <span>💬 {p.commentCount ?? 0}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
