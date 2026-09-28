import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from '@/components/ui/Avatar'
import VerifiedBadge from '@/components/ui/VerifiedBadge'
import { timeAgo } from '@/utils/time'
import type { Post } from '@/types/post'
import { CommentIcon, HeartIcon, MoreIcon, RepostIcon, ShareIcon } from './icons'

interface PostItemProps {
  post: Post
  currentUserId?: string
  /** Admin/moderador: pode eliminar publicações de outros. */
  canModerate?: boolean
  /** Linha vertical por baixo do avatar (liga a publicação às respostas). */
  showLine?: boolean
  replyingTo?: string
  onLike: (post: Post) => void
  onRepost: (post: Post) => void
  onReply: (post: Post) => void
  onShare: (post: Post) => void
  onDelete: (post: Post) => void
  onReport: (post: Post) => void
}

function ActionButton({
  label,
  count,
  active = false,
  activeClass = '',
  onClick,
  children
}: {
  label: string
  count?: number
  active?: boolean
  activeClass?: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`flex items-center gap-1.5 min-h-[40px] px-2 rounded-full active:bg-base-700 text-sm ${
        active ? activeClass : 'text-white/55'
      }`}
    >
      {children}
      {count ? <span>{count}</span> : null}
    </button>
  )
}

/** Uma publicação ao estilo Threads: sem cartão, avatar + linha de conversa, ações em linha. */
export default function PostItem({
  post,
  currentUserId,
  canModerate,
  showLine,
  replyingTo,
  onLike,
  onRepost,
  onReply,
  onShare,
  onDelete,
  onReport
}: PostItemProps) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const isOwner = currentUserId === post.authorId
  const canDelete = isOwner || !!canModerate
  const profileLink = `/players/${post.authorId}`
  const openThread = () => navigate(`/feed/${post.id}`)

  return (
    <article className="flex gap-3 px-4 pt-3 border-b border-base-700">
      <div className="flex flex-col items-center shrink-0">
        <Link to={profileLink} aria-label={`Perfil de ${post.authorNickname ?? 'jogador'}`}>
          <Avatar src={post.authorAvatar} name={post.authorNickname} size={40} />
        </Link>
        {showLine && <div className="w-0.5 flex-1 bg-base-500 rounded-full mt-2 mb-1" aria-hidden="true" />}
      </div>

      <div className="flex-1 min-w-0 pb-2">
        <div className="flex items-center gap-1.5">
          <Link to={profileLink} className="font-semibold text-[15px] flex items-center gap-1 min-w-0">
            <span className="truncate">{post.authorNickname ?? 'Jogador'}</span>
            {post.authorVerified && <VerifiedBadge size={14} />}
          </Link>
          <span className="text-white/40 text-sm shrink-0">{timeAgo(post.createdAt)}</span>

          <div className="ml-auto relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Mais opções"
              className="p-2 -mr-2 text-white/50"
            >
              <MoreIcon />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-9 z-50 min-w-[160px] bg-base-700 border border-base-500 rounded-xl2 py-1 shadow-xl">
                  {canDelete && (
                    <button
                      type="button"
                      className="w-full text-left px-4 py-3 text-sm text-accent-soft"
                      onClick={() => {
                        setMenuOpen(false)
                        onDelete(post)
                      }}
                    >
                      Eliminar
                    </button>
                  )}
                  {!isOwner && (
                    <button
                      type="button"
                      className="w-full text-left px-4 py-3 text-sm"
                      onClick={() => {
                        setMenuOpen(false)
                        onReport(post)
                      }}
                    >
                      Denunciar
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {replyingTo && <p className="text-xs text-white/40">A responder a @{replyingTo}</p>}

        <div
          role="link"
          tabIndex={0}
          onClick={openThread}
          onKeyDown={(e) => {
            if (e.key === 'Enter') openThread()
          }}
          className="cursor-pointer"
        >
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{post.body}</p>
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt="Imagem da publicação"
              loading="lazy"
              className="mt-2 rounded-xl2 w-full max-h-80 object-cover border border-base-600"
            />
          )}
        </div>

        <div className="flex items-center -ml-2 mt-1">
          <ActionButton
            label={post.likedByMe ? 'Deixar de gostar' : 'Gostar'}
            count={post.likeCount}
            active={post.likedByMe}
            activeClass="text-accent"
            onClick={() => onLike(post)}
          >
            <HeartIcon filled={post.likedByMe} />
          </ActionButton>
          <ActionButton label="Responder" count={post.replyCount} onClick={() => onReply(post)}>
            <CommentIcon />
          </ActionButton>
          <ActionButton
            label={post.repostedByMe ? 'Desfazer republicação' : 'Republicar'}
            count={post.repostCount}
            active={post.repostedByMe}
            activeClass="text-success"
            onClick={() => onRepost(post)}
          >
            <RepostIcon />
          </ActionButton>
          <ActionButton label="Partilhar" onClick={() => onShare(post)}>
            <ShareIcon />
          </ActionButton>
        </div>
      </div>
    </article>
  )
}
