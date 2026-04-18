import { api } from '@/lib/api'
import type { Agreement } from '@/types'

export const agreementsService = {
  /** Landlord creates a draft agreement */
  async create(data: {
    propertyId: string
    tenantId: string
    rentAmount: number
    duration: string
    terms: string
  }): Promise<Agreement> {
    const res = await api.post<any>('/agreements', data)
    return res?.data ?? res
  },

  /** Tenant: list my agreements */
  async getTenantAgreements(): Promise<Agreement[]> {
    const res = await api.get<any>('/agreements/tenant/me')
    return Array.isArray(res) ? res : (res?.data ?? [])
  },

  /** Landlord: list my agreements */
  async getLandlordAgreements(): Promise<Agreement[]> {
    const res = await api.get<any>('/agreements/landlord/me')
    return Array.isArray(res) ? res : (res?.data ?? [])
  },

  /** Admin: all agreements */
  async getAll(): Promise<Agreement[]> {
    const res = await api.get<any>('/agreements/admin/all')
    return Array.isArray(res) ? res : (res?.data ?? [])
  },

  /** Get single agreement */
  async getById(id: string): Promise<Agreement> {
    const res = await api.get<any>(`/agreements/${id}`)
    return res?.data ?? res
  },

  /** Landlord sends to tenant for signing */
  async sendToTenant(id: string): Promise<Agreement> {
    const res = await api.patch<any>(`/agreements/${id}/send`)
    return res?.data ?? res
  },

  /** Tenant signs the agreement */
  async sign(id: string): Promise<Agreement> {
    const res = await api.patch<any>(`/agreements/${id}/sign`)
    return res?.data ?? res
  },

  /** Cancel agreement */
  async cancel(id: string): Promise<Agreement> {
    const res = await api.patch<any>(`/agreements/${id}/cancel`)
    return res?.data ?? res
  },
}
