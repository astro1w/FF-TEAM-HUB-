import { supabase } from '@/lib/supabase'
import type { Conversation, ConversationMeta, Message } from '@/types/message'

export const MESSAGE_PAGE_SIZE = 50

// O cliente tipado ainda não conhece as funções SQL da migration 0014.
const rpc = (name: string, args?: Record<string, unknown>) => (supabase as any).rpc(name, args)

function rowToMessage(r: any): Message {
  return {
    id: r.id,
    conversationId: r.conversation_id,
    senderId: r.sender_id,
    body: r.body,
    createdAt: r.created_at,
    clientId: r.client_id ?? undefined,
    status: 'sent'
  }
}

/** Conversas do utilizador (a função SQL já ordena pela atividade mais recente e conta as não lidas). */
export async function listConversations(): Promise<Conversation[]> {
  const { data, error } = await rpc('list_my_conversations')
  if (error) throw error
  return ((data ?? []) as any[]).map((r) => ({
    id: r.c_id,
    isGroup: r.c_is_group,
    title: r.c_title,
    teamId: r.c_team_id,
    createdAt: r.c_created_at,
    otherId: r.other_id ?? undefined,
    otherNickname: r.other_nickname ?? undefined,
    otherAvatar: r.other_avatar_url,
    otherVerified: !!r.other_verified,
    otherShowOnline: r.other_show_online ?? true,
    lastMessage: r.last_body ?? undefined,
    lastMessageAt: r.last_at ?? undefined,
    lastSenderId: r.last_sender_id ?? undefined,
    unreadCount: r.unread_count ?? 0
  }))
}

/** O primeiro argumento mantém-se por compatibilidade; a identidade vem sempre da sessão no servidor. */
export async function getOrCreateDm(_userId: string, otherId: string): Promise<string> {
  const { data, error } = await rpc('get_or_create_dm', { p_other: otherId })
  if (error) throw error
  return data as string
}

/** Devolve null se a conversa não existir ou o utilizador não for membro (RLS). */
export async function getConversationMeta(conversationId: string, userId: string): Promise<ConversationMeta | null> {
  const { data, error } = await supabase
    .from('conversation_members')
    .select('profile_id, last_read_at, profiles(nickname, avatar_url, is_verified, show_online_status)')
    .eq('conversation_id', conversationId)
  if (error) throw error
  const rows = (data ?? []) as any[]
  if (!rows.some((r) => r.profile_id === userId)) return null
  const other = rows.find((r) => r.profile_id !== userId)
  return {
    otherId: other?.profile_id ?? null,
    otherNickname: other?.profiles?.nickname ?? null,
    otherAvatar: other?.profiles?.avatar_url ?? null,
    otherVerified: !!other?.profiles?.is_verified,
    otherShowOnline: other?.profiles?.show_online_status ?? true,
    otherLastReadAt: other?.last_read_at ?? null
  }
}

/** Mensagens mais recentes primeiro na base de dados; devolvidas por ordem cronológica. */
export async function listMessages(conversationId: string, before?: string): Promise<Message[]> {
  let query = supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(MESSAGE_PAGE_SIZE)
  if (before) query = query.lt('created_at', before)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(rowToMessage).reverse()
}

/**
 * Enviar é idempotente: o mesmo clientId nunca cria duas mensagens (índice único no servidor),
 * por isso repetir depois de uma falha de rede é seguro.
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  body: string,
  clientId: string
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, body: body.trim(), client_id: clientId } as any)
    .select()
    .single()
  if (!error) return rowToMessage(data)

  if ((error as any).code === '23505') {
    // Já tinha sido gravada numa tentativa anterior (resposta perdida): vai buscá-la.
    const { data: existing, error: e2 } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', senderId)
      .eq('client_id', clientId)
      .single()
    if (e2) throw e2
    return rowToMessage(existing)
  }
  throw error
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const { error } = await rpc('mark_conversation_read', { p_conversation: conversationId })
  if (error) throw error
}

/** Novas mensagens e leituras da outra pessoa, numa conversa. */
export function subscribeConversation(
  conversationId: string,
  handlers: { onMessage: (msg: Message) => void; onOtherRead: (userId: string, readAt: string) => void }
) {
  const channel = supabase
    .channel(`chat:${conversationId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => handlers.onMessage(rowToMessage(payload.new))
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'conversation_members', filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        const r = payload.new as any
        if (r.last_read_at) handlers.onOtherRead(r.profile_id, r.last_read_at)
      }
    )
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}

/** Qualquer mudança que afete a lista de conversas (RLS garante que só chegam as minhas). */
export function subscribeInbox(userId: string, onChange: () => void) {
  const channel = supabase
    .channel(`inbox:${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, onChange)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversation_members' }, onChange)
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
