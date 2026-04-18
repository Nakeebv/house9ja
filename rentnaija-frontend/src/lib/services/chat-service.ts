import { api } from '@/lib/api'
import type { ChatConversation, ChatMessage } from '@/types'

export const chatService = {
  /** Get or create a conversation for a property */
  async getOrCreate(propertyId: string, landlordId: string): Promise<ChatConversation> {
    const res = await api.post<any>('/chats', { propertyId, landlordId })
    return res?.data ?? res
  },

  /** List all conversations for current user */
  async getMyConversations(): Promise<ChatConversation[]> {
    const res = await api.get<any>('/chats')
    return Array.isArray(res) ? res : (res?.data ?? [])
  },

  /** Get messages in a conversation (paginated) */
  async getMessages(chatId: string, page = 1): Promise<{ messages: ChatMessage[]; total: number; page: number }> {
    const res = await api.get<any>(`/chats/${chatId}/messages?page=${page}`)
    return res?.data ?? res
  },

  /** Send a message via REST (fallback when socket is not available) */
  async sendMessage(chatId: string, content: string, type?: string, mediaUrl?: string): Promise<ChatMessage> {
    const res = await api.post<any>(`/chats/${chatId}/messages`, { content, type: type ?? 'TEXT', mediaUrl })
    return res?.data ?? res
  },

  /** Get unread message count */
  async getUnreadCount(): Promise<number> {
    const res = await api.get<any>('/chats/unread')
    return typeof res === 'number' ? res : (res?.count ?? res?.data ?? 0)
  },
}
