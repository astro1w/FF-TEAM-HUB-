import { supabase } from '@/lib/supabase'
import type { Post, Comment } from '@/types/post'

export const PAGE_SIZE = 20
export type TimelineTab = 'foryou' | 'following'

// Os likes/reposts vêm como listas de user_id (chega para contar e saber se já gostei);
// as respostas vêm como contagem através da relação parent_id.
const POST_SELECT =
  '*, profiles(nickname, avatar_url, is_verified), likes(user_id), reposts(user_id), replies:posts!posts_parent_id_fkey(count)'

function rowToPost(row: any, userId?: string): Post {
  const likes: any[] = row.likes ?? []
  const reposts: any[] = row.reposts ?? []
  return {
    id: row.id,
    authorId: row.author_id,
    teamId: row.team_id,
    parentId: row.parent_id ?? null,
    rootId: row.root_id ?? null,
    body: row.body,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    authorNickname: row.profiles?.nickname,
    authorAvatar: row.profiles?.avatar_url,
    authorVerified: row.profiles?.is_verified ?? false,
    likeCount: likes.length,
    repostCount: reposts.length,
    replyCount: row.replies?.[0]?.count ?? 0,
    likedByMe: userId ? likes.some((l) => l.user_id === userId) : false,
    repostedByMe: userId ? reposts.some((r) => r.user_id === userId) : false
  }
}

async function listFollowedProfileIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('followed_profile_id')
    .eq('follower_id', userId)
    .not('followed_profile_id', 'is', null)
  if (error) throw error
  return (data ?? []).map((r: any) => r.followed_profile_id as string)
}

/** Publicações principais (sem respostas), mais recentes primeiro. */
export async function listTimeline(opts: {
  userId: string
  tab: TimelineTab
  before?: string
}): Promise<Post[]> {
  let query = supabase
    .from('posts')
    .select(POST_SELECT)
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)

  if (opts.before) query = query.lt('created_at', opts.before)

  if (opts.tab === 'following') {
    const ids = await listFollowedProfileIds(opts.userId)
    if (ids.length === 0) return []
    query = query.in('author_id', [...ids, opts.userId])
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((r) => rowToPost(r, opts.userId))
}

export async function listPostsByAuthor(authorId: string, viewerId?: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('author_id', authorId)
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return (data ?? []).map((r) => rowToPost(r, viewerId))
}

/** Conversa completa: a publicação principal primeiro, depois as respostas por ordem cronológica. */
export async function getThread(postId: string, viewerId?: string): Promise<Post[] | null> {
  const { data: first, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('id', postId)
    .maybeSingle()
  if (error) throw error
  if (!first) return null

  const rootId: string = first.root_id ?? first.id
  let root = first
  if (first.root_id) {
    const { data: rootRow, error: rootError } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .eq('id', rootId)
      .maybeSingle()
    if (rootError) throw rootError
    if (!rootRow) return null
    root = rootRow
  }

  const { data: replies, error: repliesError } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('root_id', rootId)
    .order('created_at', { ascending: true })
    .limit(200)
  if (repliesError) throw repliesError

  return [rowToPost(root, viewerId), ...(replies ?? []).map((r) => rowToPost(r, viewerId))]
}

export async function createPost(
  authorId: string,
  body: string,
  imageUrl?: string,
  parentId?: string
): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: authorId,
      body: body.trim(),
      image_url: imageUrl || null,
      parent_id: parentId || null
    })
    .select(POST_SELECT)
    .single()
  if (error) throw error
  return rowToPost(data, authorId)
}

export async function toggleLike(postId: string, userId: string, liked: boolean): Promise<void> {
  const query = liked
    ? supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId)
    : supabase.from('likes').insert({ post_id: postId, user_id: userId })
  const { error } = await query
  if (error) throw error
}

export async function toggleRepost(postId: string, userId: string, reposted: boolean): Promise<void> {
  const query = reposted
    ? supabase.from('reposts').delete().eq('post_id', postId).eq('user_id', userId)
    : supabase.from('reposts').insert({ post_id: postId, user_id: userId })
  const { error } = await query
  if (error) throw error
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) throw error
}

/** @deprecated V1: comentários antigos. As respostas agora são posts com parent_id (ver createPost). */
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

/** @deprecated V1: use createPost(..., parentId) para responder. */
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

/**
 * Avisa quando surgem publicações principais novas (para o banner "Novas publicações ↑").
 * Não busca o conteúdo aqui — o Feed decide quando (e se) recarrega, para nunca interromper
 * a leitura do utilizador nem alterar posts já na tela.
 */
export function subscribeNewTopLevelPosts(onNew: () => void) {
  const channel = supabase
    .channel('feed:new-posts')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'posts', filter: 'parent_id=is.null' },
      onNew
    )
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
