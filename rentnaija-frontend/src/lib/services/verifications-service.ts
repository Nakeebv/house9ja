import { api } from '@/lib/api'

export interface MyVerificationRecord {
  id: string
  governmentIdUrl: string
  backOfIdUrl: string | null
  selfieWithIdUrl: string | null
  proofOfOwnershipUrl: string | null
  utilityBillUrl: string | null
  rejectionReason: string | null
  requiresMoreDocs: boolean
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  updatedAt: string
}

export interface MyVerificationStatus {
  submitted: boolean
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | null
  rejectionReason: string | null
  doc: MyVerificationRecord | null
}

export const verificationsService = {
  async getMine(): Promise<MyVerificationStatus> {
    const response = await api.get<any>('/verifications/me')
    return response?.data ?? response ?? { submitted: false, status: null, rejectionReason: null, doc: null }
  },

  async submit(data: {
    governmentIdUrl: string
    backOfIdUrl?: string
    selfieWithIdUrl?: string
    proofOfOwnershipUrl?: string
    utilityBillUrl?: string
  }): Promise<MyVerificationRecord> {
    const response = await api.post<any>('/verifications', data)
    return response?.data ?? response
  },
}
