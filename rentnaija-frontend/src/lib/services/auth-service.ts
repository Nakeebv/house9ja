import { api } from '@/lib/api'
import type { AuthResponse, AuthUser, UserRole } from '@/types'

type LoginPayload = {
  email: string
  password: string
}

type RegisterPayload = {
  firstName: string
  lastName: string
  name?: string
  email: string
  password: string
  phone: string
  role: Exclude<UserRole, 'ADMIN'>
  acceptedTerms: boolean
}

export type LoginResult =
  | { status: 'otp_required'; maskedEmail: string }
  | ({ status: 'success' } & AuthResponse)

function normalizeAuthResponse(payload: any): AuthResponse {
  const responseData = payload?.data ?? payload ?? {}
  const user = responseData.user ?? {}
  const firstName = user.firstName ?? ''
  const lastName = user.lastName ?? ''
  const name = user.name ?? `${firstName} ${lastName}`.trim()

  return {
    accessToken: responseData.accessToken ?? responseData.token ?? '',
    user: {
      id: String(user.id ?? ''),
      email: String(user.email ?? ''),
      phone: user.phone ? String(user.phone) : '',
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      name: name || '',
      role: (user.role ?? 'TENANT') as UserRole,
      isVerified: user.isVerified ?? false,
      isVerifiedLandlord: user.isVerifiedLandlord ?? false,
      avatarUrl: user.avatarUrl ?? undefined,
      emailVerified: user.emailVerified ?? false,
    },
  }
}

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResult> {
    const response = await api.post<any>('/auth/login', payload)

    if (response?.status === 'otp_required') {
      return { status: 'otp_required', maskedEmail: response?.data?.email ?? payload.email }
    }

    return { status: 'success', ...normalizeAuthResponse(response) }
  },

  async verifyOtp(email: string, otp: string): Promise<AuthResponse> {
    const response = await api.post<any>('/auth/verify-otp', { email, otp })
    return normalizeAuthResponse(response)
  },

  async resendOtp(email: string): Promise<void> {
    await api.post('/auth/resend-otp', { email })
  },

  async register(payload: RegisterPayload): Promise<void> {
    await api.post<any>('/auth/register', payload)
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await api.get<any>(`/auth/verify-email?token=${token}`)
    return response?.data ?? response
  },

  async resendVerification(email: string): Promise<void> {
    await api.post('/auth/resend-verification', { email })
  },

  async getMe(token: string): Promise<AuthUser> {
    const response = await api.get<any>('/auth/me', { token })
    const user = response?.data ?? response ?? {}
    const firstName = user.firstName ?? ''
    const lastName = user.lastName ?? ''
    return {
      id: String(user.id ?? ''),
      email: String(user.email ?? ''),
      phone: user.phone ? String(user.phone) : '',
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      name: user.name ?? `${firstName} ${lastName}`.trim(),
      role: (user.role ?? 'TENANT') as UserRole,
      isVerified: user.isVerified ?? false,
      isVerifiedLandlord: user.isVerifiedLandlord ?? false,
      avatarUrl: user.avatarUrl ?? undefined,
      emailVerified: user.emailVerified ?? false,
    }
  },
}
