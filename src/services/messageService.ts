import { supabase } from '@/lib/supabase'
import type { Conversation, Message } from '@/types/message'

export async function listConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversation_members')
    .select('conversation_id, conversations(*)')
    .eq('profile_id', userId)
  if (error) throw error

  const convs: Conversation[] = []
  for (const row of data ?? []) {
    const c = (row as any).conversations
    if (!c) continue
    // get other members
    const { data: members } = await supabase
      .from('conversation_members')
      .select('profile_id, profiles(nickname)')
      .eq('conversation_id', c.id)
      .neq('profile_id', userId)

    const { data: lastMsgs } = await supabase
      .from('messages')
      .select('body, created_at')
      .eq('conversation_id', c.id)
      .order('created_at', { ascending: false })
      .limit(1)

    convs.push({
      id: c.id,
      isGroup: c.is_group,
      title: c.title,
      teamId: c.team_id,
      createdAt: c.created_at,
      otherNickname: (members as any)?.[0]?.profiles?.nickname,
      lastMessage: lastMsgs?.[0]?.body,
      lastMessageAt: lastMsgs?.[0]?.created_at
    })
  }
  return convs.sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''))
}

export async function getOrCreateDm(userId: string, otherId: string): Promise<string> {
  // Find existing DM
  const { data: myConvs } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('profile_id', userId)

  if (myConvs) {
    for (const mc of myConvs) {
      const { data: members } = await supabase
        .from('conversation_members')
        .select('profile_id, conversations(is_group)')
        .eq('conversation_id', mc.conversation_id)
      if (
        members &&
        members.length === 2 &&
        members.some((m: any) => m.profile_id === otherId) &&
        !(members as any)[0]?.conversations?.is_group
      ) {
        return mc.conversation_id
      }
    }
  }

  const { data: conv, error } = await supabase
    .from('conversations')
    .insert({ is_group: false })
    .select()
    .single()
  if (error) throw error

  await supabase.from('conversation_members').insert([
    { conversation_id: conv.id, profile_id: userId },
    { conversation_id: conv.id, profile_id: otherId }
  ])
  return conv.id
}

export async function listMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*, profiles:sender_id(nickname)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(100)
  if (error) throw error
  return (data ?? []).map((r: any) => ({
    id: r.id,
    conversationId: r.conversation_id,
    senderId: r.sender_id,
    body: r.body,
    createdAt: r.created_at,
    senderNickname: r.profiles?.nickname
  }))
}

export async function sendMessage(conversationId: string, senderId: string, body: string): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, body: body.trim() })
    .select()
    .single()
  if (error) throw error
  return {
    id: data.id,
    conversationId: data.conversation_id,
    senderId: data.sender_id,
    body: data.body,
    createdAt: data.created_at
  }
}

export function subscribeMessages(conversationId: string, onMessage: (msg: Message) => void) {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        const r = payload.new as any
        onMessage({
          id: r.id,
          conversationId: r.conversation_id,
          senderId: r.sender_id,
          body: r.body,
          createdAt: r.created_at
        })
      }
    )
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
