export type MessageStatus = 'sending' | 'sent' | 'failed'

export interface Conversation {
  id: string
  isGroup: boolean
  title: string | null
  teamId: string | null
  createdAt: string
  otherId?: string
  otherNickname?: string
  otherAvatar?: string | null
  otherVerified?: boolean
  /** false quando o outro participante desativou "mostrar estado online" (Definições > Privacidade). */
  otherShowOnline?: boolean
  lastMessage?: string
  lastMessageAt?: string
  lastSenderId?: string
  unreadCount: number
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  body: string
  createdAt: string
  senderNickname?: string
  /** Identificador gerado no telemóvel: liga a mensagem otimista à mensagem confirmada e evita duplicados. */
  clientId?: string
  /** Só existe em mensagens locais; mensagens vindas do servidor são 'sent'. */
  status?: MessageStatus
}

export interface ConversationMeta {
  otherId: string | null
  otherNickname: string | null
  otherAvatar: string | null
  otherVerified: boolean
  otherShowOnline: boolean
  /** Quando o outro participante leu pela última vez (para o estado "Lida"). */
  otherLastReadAt: string | null
}
