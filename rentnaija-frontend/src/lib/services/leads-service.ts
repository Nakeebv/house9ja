import { api } from '@/lib/api'
import type { AgentStats, Lead } from '@/types'

export const leadsService = {
  /** Tenant: submit a lead for a property */
  async create(propertyId: string, message?: string): Promise<Lead> {
    const response = await api.post<Lead>('/leads', { propertyId, message })
    return response
  },

  /** Agent/Landlord: get all incoming leads for their properties */
  async getAgentLeads(): Promise<Lead[]> {
    const response = await api.get<Lead[]>('/leads/agent/me')
    return Array.isArray(response) ? response : []
  },

  /** Tenant: get their own submitted leads */
  async getTenantLeads(): Promise<Lead[]> {
    const response = await api.get<Lead[]>('/leads/tenant/me')
    return Array.isArray(response) ? response : []
  },

  /** Agent/Landlord: dashboard metric counts */
  async getStats(): Promise<AgentStats> {
    const response = await api.get<AgentStats>('/leads/stats')
    return response
  },

  /** Agent: accept or decline a lead */
  async updateStatus(id: string, status: 'ACCEPTED' | 'DECLINED'): Promise<Lead> {
    const response = await api.patch<Lead>(`/leads/${id}/status`, { status })
    return response
  },
}
