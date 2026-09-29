import { supabase } from '@/lib/supabase'
import type { Conversation, Message } from '@/types/message.optimized'

export async function listConversations(before?: string): Promise<Conversation[]> {
  const { data, error } = await supabase.rpc('list_my_conversations', {
    p_limit: 30,
    p_before: before ?? null
  })

  if (error) throw error

  return (data ?? []).map((row: any) => ({
    id: row.id,
    isGroup: row.is_group,
    title: row.title,
    teamId: row.team_id,
    createdAt: row.created_at,
    otherProfileId: row.other_profile_id,
    otherNickname: row.other_nickname,
    otherAvatarUrl: row.other_avatar_url,
    lastMessage: row.last_message,
    lastMessageAt: row.last_message_at,
    unreadCount: Number(row.unread_count ?? 0),
    lastReadAt: row.last_read_at
  }))
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_conversation_read', {
    p_conversation_id: conversationId
  })

  if (error) throw error
}

export async function getOrCreateDm(otherProfileId: string): Promise<string> {
  const { data, error } = await supabase.rpc('get_or_create_dm', {
    p_other_profile_id: otherProfileId
  })

  if (error) throw error
  return data as string
}

export async function listMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*, profiles:sender_id(nickname)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) throw error

  return (data ?? []).map((row: any) => ({
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
    senderNickname: row.profiles?.nickname
  }))
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  body: string
): Promise<Message> {
  const cleanBody = body.trim()
  if (!cleanBody) throw new Error('A mensagem não pode estar vazia.')

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      body: cleanBody
    })
    .select('*, profiles:sender_id(nickname)')
    .single()

  if (error) throw error

  return {
    id: data.id,
    conversationId: data.conversation_id,
    senderId: data.sender_id,
    body: data.body,
    createdAt: data.created_at,
    senderNickname: (data as any).profiles?.nickname
  }
}
