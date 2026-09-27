export interface Post {
  id: string
  authorId: string
  teamId: string | null
  body: string
  imageUrl: string | null
  createdAt: string
  authorNickname?: string
  authorAvatar?: string | null
  likeCount?: number
  commentCount?: number
  likedByMe?: boolean
}

export interface Comment {
  id: string
  postId: string
  authorId: string
  body: string
  createdAt: string
  authorNickname?: string
}
