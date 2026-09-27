export interface Conversation {
  id: string
  isGroup: boolean
  title: string | null
  teamId: string | null
  createdAt: string
  otherNickname?: string
  lastMessage?: string
  lastMessageAt?: string
  unread?: boolean
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  body: string
  createdAt: string
  senderNickname?: string
}
