import { supabase } from '@/lib/supabase'
import type { Post, Comment } from '@/types/post'

function rowToPost(row: any, userId?: string): Post {
  const likes = row.likes ?? []
  return {
    id: row.id,
    authorId: row.author_id,
    teamId: row.team_id,
    body: row.body,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    authorNickname: row.profiles?.nickname,
    authorAvatar: row.profiles?.avatar_url,
    likeCount: Array.isArray(likes) ? likes.length : row.like_count ?? 0,
    commentCount: row.comments?.[0]?.count ?? row.comment_count ?? 0,
    likedByMe: userId ? likes.some((l: any) => l.user_id === userId) : false
  }
}

export async function listPosts(userId?: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(nickname, avatar_url), likes(user_id), comments(count)')
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) throw error
  return (data ?? []).map((r) => rowToPost(r, userId))
}

export async function createPost(authorId: string, body: string, imageUrl?: string): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .insert({ author_id: authorId, body: body.trim(), image_url: imageUrl || null })
    .select('*, profiles(nickname, avatar_url)')
    .single()
  if (error) throw error
  return rowToPost(data)
}

export async function toggleLike(postId: string, userId: string, liked: boolean): Promise<void> {
  if (liked) {
    const { error } = await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId)
    if (error) throw error
  } else {
    const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: userId })
    if (error) throw error
  }
}

export async function listComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*, profiles(nickname)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((r: any) => ({
    id: r.id,
    postId: r.post_id,
    authorId: r.author_id,
    body: r.body,
    createdAt: r.created_at,
    authorNickname: r.profiles?.nickname
  }))
}

export async function addComment(postId: string, authorId: string, body: string): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, author_id: authorId, body: body.trim() })
    .select('*, profiles(nickname)')
    .single()
  if (error) throw error
  return {
    id: data.id,
    postId: data.post_id,
    authorId: data.author_id,
    body: data.body,
    createdAt: data.created_at,
    authorNickname: (data as any).profiles?.nickname
  }
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) throw error
}
