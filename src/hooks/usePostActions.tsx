import React, { useCallback, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { deletePost, toggleLike, toggleRepost } from '@/services/feedService'
import { createReport, type ReportReason } from '@/services/reportService'
import { useToast } from '@/components/ui/Toast'
import ReportSheet from '@/components/feed/ReportSheet'
import type { Post } from '@/types/post'

type SetPosts = React.Dispatch<React.SetStateAction<Post[]>>

/**
 * Ações partilhadas por todas as listas de publicações (feed, conversa, perfil):
 * gostar, republicar, partilhar, eliminar e denunciar, com atualização imediata no ecrã.
 */
export function usePostActions(setPosts: SetPosts, opts?: { onDeleted?: (post: Post) => void }) {
  const { user, profile } = useAuth()
  const { toast, show } = useToast()
  const [reportTarget, setReportTarget] = useState<Post | null>(null)
  const onDeleted = opts?.onDeleted

  const patch = useCallback(
    (id: string, change: (p: Post) => Post) => setPosts((prev) => prev.map((p) => (p.id === id ? change(p) : p))),
    [setPosts]
  )

  const onLike = useCallback(
    async (post: Post) => {
      if (!user) return
      const wasLiked = !!post.likedByMe
      const flip = (p: Post): Post => ({
        ...p,
        likedByMe: !p.likedByMe,
        likeCount: Math.max(0, (p.likeCount ?? 0) + (p.likedByMe ? -1 : 1))
      })
      patch(post.id, flip)
      try {
        await toggleLike(post.id, user.id, wasLiked)
      } catch (e) {
        console.error(e)
        patch(post.id, flip) // desfaz
        show('Não foi possível gostar. Tenta novamente.')
      }
    },
    [user, patch, show]
  )

  const onRepost = useCallback(
    async (post: Post) => {
      if (!user) return
      const was = !!post.repostedByMe
      const flip = (p: Post): Post => ({
        ...p,
        repostedByMe: !p.repostedByMe,
        repostCount: Math.max(0, (p.repostCount ?? 0) + (p.repostedByMe ? -1 : 1))
      })
      patch(post.id, flip)
      try {
        await toggleRepost(post.id, user.id, was)
        show(was ? 'Republicação removida' : 'Republicado')
      } catch (e) {
        console.error(e)
        patch(post.id, flip)
        show('Não foi possível republicar. Tenta novamente.')
      }
    },
    [user, patch, show]
  )

  // Partilha o texto da publicação. Links partilháveis dependem de um domínio público (ainda não existe).
  const onShare = useCallback(
    async (post: Post) => {
      const text = `${post.body.slice(0, 240)}\n— @${post.authorNickname ?? 'jogador'} no FF TEAM HUB`
      try {
        if (navigator.share) {
          await navigator.share({ text })
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(text)
          show('Texto copiado')
        } else {
          show('A partilha não é suportada neste dispositivo.')
        }
      } catch {
        // o utilizador cancelou a partilha: não é erro
      }
    },
    [show]
  )

  const onDelete = useCallback(
    async (post: Post) => {
      if (!window.confirm('Eliminar esta publicação? Esta ação não pode ser desfeita.')) return
      try {
        await deletePost(post.id)
        setPosts((prev) => prev.filter((p) => p.id !== post.id))
        onDeleted?.(post)
        show('Publicação eliminada')
      } catch (e) {
        console.error(e)
        show('Não foi possível eliminar.')
      }
    },
    [setPosts, onDeleted, show]
  )

  async function submitReport(reason: ReportReason) {
    if (!user || !reportTarget) return
    try {
      await createReport(user.id, 'post', reportTarget.id, reason)
      show('Denúncia enviada. Obrigado.')
    } catch (e) {
      console.error(e)
      show('Não foi possível enviar a denúncia.')
    } finally {
      setReportTarget(null)
    }
  }

  const overlays = (
    <>
      {toast}
      <ReportSheet
        open={!!reportTarget}
        title="Denunciar publicação"
        onClose={() => setReportTarget(null)}
        onSubmit={submitReport}
      />
    </>
  )

  return {
    currentUserId: user?.id,
    canModerate: profile?.role === 'admin' || profile?.role === 'moderator',
    onLike,
    onRepost,
    onShare,
    onDelete,
    onReport: (post: Post) => setReportTarget(post),
    overlays
  }
}
