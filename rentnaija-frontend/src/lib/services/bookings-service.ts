import { api } from '@/lib/api'
import type { Booking } from '@/types'

export const bookingsService = {
  /** Tenant: create a viewing request */
  async create(data: { propertyId: string; date: string; time: string }): Promise<Booking> {
    const res = await api.post<any>('/bookings', data)
    return res?.data ?? res
  },

  /** Tenant: list my bookings */
  async getTenantBookings(): Promise<Booking[]> {
    const res = await api.get<any>('/bookings/tenant/me')
    return Array.isArray(res) ? res : res?.data ?? []
  },

  /** Landlord: list bookings for my properties */
  async getLandlordBookings(): Promise<Booking[]> {
    const res = await api.get<any>('/bookings/landlord/me')
    return Array.isArray(res) ? res : res?.data ?? []
  },

  /** Landlord: approve / reject / reschedule a booking */
  async updateStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED' | 'RESCHEDULED',
    newDate?: string,
    newTime?: string,
  ): Promise<Booking> {
    const res = await api.patch<any>(`/bookings/${id}/status`, { status, date: newDate, time: newTime })
    return res?.data ?? res
  },
}
