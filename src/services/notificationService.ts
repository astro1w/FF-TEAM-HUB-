import { supabase } from '@/lib/supabase'

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  body: string | null
  data: Record<string, unknown> | null
  read: boolean
  createdAt: string
}

export async function listNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []).map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    type: r.type,
    title: r.title,
    body: r.body,
    data: r.data,
    read: r.read,
    createdAt: r.created_at
  }))
}

export async function markRead(id: string): Promise<void> {
  await supabase.from('notifications').update({ read: true }).eq('id', id)
}

export async function markAllRead(userId: string): Promise<void> {
  await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
}
