import { api } from '@/lib/api'
import { normalizeProperty } from './property-service'
import type { Property } from '@/types'

export interface AdminOverview {
  users: number
  activeUsers: number
  suspendedUsers: number
  properties: number
  pendingVerifications: number
  openDisputes: number
}

export interface AdminUserRecord {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  isVerified: boolean
  isVerifiedLandlord: boolean
  isBlocked: boolean
  avatarUrl: string | null
  createdAt: string
}

export interface AdminVerificationRecord {
  id: string
  landlordId: string
  governmentIdUrl: string
  backOfIdUrl: string | null
  selfieWithIdUrl: string | null
  proofOfOwnershipUrl: string | null
  utilityBillUrl: string | null
  rejectionReason: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  landlord: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
}

export interface AdminReportRecord {
  id: string
  type: string
  description: string
  status: string
  createdAt: string
  reporter?: { id: string; firstName: string; lastName: string; email: string }
  reported?: { id: string; firstName: string; lastName: string; email: string } | null
  property?: { id: string; title: string } | null
}

export interface BroadcastLogRecord {
  id: string
  subject: string
  message: string
  sentBy: string
  targetType: string
  targetMeta: string | null
  sentCount: number
  failCount: number
  createdAt: string
}

export interface AdminInquiryRecord {
  id: string
  fullName: string
  phone: string
  preferredArea: string
  budgetRange: string
  preferredDate: string
  description: string | null
  createdAt: string
}

export interface AdminRequestRecord {
  id: string
  type: string
  subject: string
  status: string
  createdAt: string
  updatedAt: string
  user: { id: string; firstName: string; lastName: string; email: string; avatarUrl: string | null }
  messages: AdminRequestMessage[]
}

export interface AdminRequestMessage {
  id: string
  message: string | null
  attachmentUrl: string | null
  createdAt: string
  sender: { id: string; firstName: string; lastName: string; role: string; avatarUrl: string | null }
}

function normalizeUsersResponse(response: any): AdminUserRecord[] {
  if (Array.isArray(response?.users)) return response.users
  if (Array.isArray(response?.data?.users)) return response.data.users
  return []
}

export const adminService = {
  async getOverview(): Promise<AdminOverview> {
    const response = await api.get<any>('/admin/overview')
    return response?.data ?? response
  },

  async getUsers(params?: { role?: string; status?: string; search?: string }): Promise<AdminUserRecord[]> {
    const q = new URLSearchParams()
    if (params?.role) q.set('role', params.role)
    if (params?.status) q.set('status', params.status)
    if (params?.search) q.set('search', params.search)
    const suffix = q.toString() ? `?${q}` : ''
    const response = await api.get<any>(`/admin/users${suffix}`)
    return normalizeUsersResponse(response)
  },

  async deleteUser(userId: string, reason?: string): Promise<void> {
    await api.delete(`/admin/users/${userId}`, { reason })
  },

  async suspendUser(userId: string): Promise<void> {
    await api.patch(`/admin/users/${userId}/suspend`)
  },

  async unsuspendUser(userId: string): Promise<void> {
    await api.patch(`/admin/users/${userId}/unsuspend`)
  },

  async getProperties(): Promise<Property[]> {
    const response = await api.get<any>('/admin/properties')
    const items: any[] = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.properties)
          ? response.properties
          : []
    return items.map(normalizeProperty)
  },

  async approveProperty(propertyId: string): Promise<void> {
    await api.patch(`/admin/properties/${propertyId}/approve`)
  },

  async rejectProperty(propertyId: string): Promise<void> {
    await api.patch(`/admin/properties/${propertyId}/reject`)
  },

  async getVerifications(): Promise<AdminVerificationRecord[]> {
    const response = await api.get<any>('/admin/verifications')
    return Array.isArray(response) ? response : response?.data ?? []
  },

  async updateVerification(id: string, status: 'APPROVED' | 'REJECTED', rejectionReason?: string): Promise<void> {
    await api.patch(`/admin/verifications/${id}/status`, { status, rejectionReason })
  },

  async getReports(): Promise<AdminReportRecord[]> {
    const response = await api.get<any>('/admin/reports')
    return Array.isArray(response) ? response : response?.data ?? []
  },

  async resolveReport(id: string): Promise<void> {
    await api.patch(`/admin/reports/${id}/resolve`)
  },

  async dismissReport(id: string): Promise<void> {
    await api.patch(`/admin/reports/${id}/dismiss`)
  },

  async getInquiries(): Promise<AdminInquiryRecord[]> {
    const response = await api.get<any>('/admin/inquiries')
    return Array.isArray(response) ? response : response?.data ?? []
  },

  async getRequests(): Promise<AdminRequestRecord[]> {
    const response = await api.get<any>('/admin/requests')
    return Array.isArray(response) ? response : response?.data ?? []
  },

  async replyToRequest(requestId: string, message: string): Promise<void> {
    await api.post(`/admin/requests/${requestId}/reply`, { message })
  },

  async closeRequest(requestId: string): Promise<void> {
    await api.patch(`/admin/requests/${requestId}/close`)
  },

  async pushVerificationReminder(userId: string): Promise<void> {
    await api.post(`/admin/users/${userId}/push-verification`)
  },

  async markUserVerified(userId: string): Promise<void> {
    await api.patch(`/admin/users/${userId}/verify`)
  },

  async sendMessageToUser(userId: string, message: string): Promise<void> {
    await api.post(`/admin/users/${userId}/message`, { message })
  },

  async requestMoreDocuments(docId: string, message: string): Promise<void> {
    await api.post(`/admin/verifications/${docId}/request-docs`, { message })
  },

  async broadcast(params: {
    subject: string
    message: string
    targetType?: 'ALL' | 'ROLE' | 'USERS'
    targetRole?: string
    targetUserIds?: string[]
  }): Promise<{ sent: number; failed: number; total: number }> {
    const response = await api.post<any>('/admin/broadcast', params)
    return response?.data ?? response
  },

  async getBroadcastHistory(): Promise<BroadcastLogRecord[]> {
    const response = await api.get<any>('/admin/broadcast/history')
    return Array.isArray(response) ? response : response?.data ?? []
  },
}
