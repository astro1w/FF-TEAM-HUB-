import { supabase } from '@/lib/supabase'
import type { NotificationType } from '@/types/database'

export interface Notification {
  id: string
  profileId: string
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  read: boolean
  createdAt: string
}

function rowToNotification(r: any): Notification {
  return {
    id: r.id,
    profileId: r.profile_id,
    type: r.type,
    title: r.title,
    body: r.body,
    link: r.link,
    read: r.read,
    createdAt: r.created_at
  }
}

export async function listNotifications(profileId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []).map(rowToNotification)
}

export async function countUnread(profileId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', profileId)
    .eq('read', false)
  if (error) throw error
  return count ?? 0
}

export async function markRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id)
  if (error) throw error
}

export async function markAllRead(profileId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('profile_id', profileId)
    .eq('read', false)
  if (error) throw error
}

/** Notificações novas e leituras, em tempo real. */
export function subscribeNotifications(profileId: string, onChange: () => void) {
  const channel = supabase
    .channel(`notifications:${profileId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notifications', filter: `profile_id=eq.${profileId}` },
      onChange
    )
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
