export interface Conversation {
  id: string
  isGroup: boolean
  title: string | null
  teamId: string | null
  createdAt: string
  otherProfileId?: string
  otherNickname?: string
  otherAvatarUrl?: string | null
  lastMessage?: string | null
  lastMessageAt?: string | null
  unreadCount: number
  lastReadAt?: string | null
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  body: string
  createdAt: string
  senderNickname?: string
}
