import { api } from '@/lib/api'
import type { Notification } from '@/types'

export const notificationsService = {
  async getMyNotifications(): Promise<Notification[]> {
    const res = await api.get<any>('/notifications/me')
    return Array.isArray(res) ? res : (res?.data ?? [])
  },

  async markRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`)
  },

  async markAllRead(): Promise<void> {
    await api.patch('/notifications/mark-all-read')
  },
}
