export interface Post {
  id: string
  authorId: string
  teamId: string | null
  /** Post a que este responde (null = publicação principal). */
  parentId: string | null
  /** Publicação principal da conversa (null = este é o principal). */
  rootId: string | null
  body: string
  imageUrl: string | null
  createdAt: string
  authorNickname?: string
  authorAvatar?: string | null
  authorVerified?: boolean
  likeCount?: number
  replyCount?: number
  repostCount?: number
  likedByMe?: boolean
  repostedByMe?: boolean
  /** @deprecated V1: os comentários passaram a ser respostas (replyCount). */
  commentCount?: number
}

/** @deprecated V1: mantido por compatibilidade. As respostas são agora posts com parentId. */
export interface Comment {
  id: string
  postId: string
  authorId: string
  body: string
  createdAt: string
  authorNickname?: string
}
