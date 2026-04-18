import { api } from '@/lib/api'

export interface SupportMessage {
  id: string
  message: string | null
  attachmentUrl: string | null
  createdAt: string
  sender: {
    id: string
    firstName: string
    lastName: string
    role: string
    avatarUrl: string | null
  }
}

export interface SupportThread {
  id: string
  type: string
  subject: string
  status: 'OPEN' | 'PENDING_ADMIN' | 'PENDING_USER' | 'RESOLVED' | 'CLOSED'
  createdAt: string
  updatedAt: string
  messages: SupportMessage[]
}

export const supportService = {
  async getMyThreads(): Promise<SupportThread[]> {
    const res = await api.get<any>('/requests/my')
    return Array.isArray(res) ? res : res?.data ?? []
  },

  async createThread(subject: string, message: string, type = 'GENERAL'): Promise<SupportThread> {
    const res = await api.post<any>('/requests', { type, subject, message })
    return res?.data ?? res
  },

  async reply(threadId: string, message: string): Promise<SupportMessage> {
    const res = await api.post<any>(`/requests/${threadId}/reply`, { message })
    return res?.data ?? res
  },
}
