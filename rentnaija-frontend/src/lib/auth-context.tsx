'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/services/auth-service'
import type { AuthUser, UserRole } from '@/types'

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (patch: Partial<AuthUser>) => void
}

interface RegisterData {
  email: string
  phone: string
  password: string
  firstName: string
  lastName: string
  role: Exclude<UserRole, 'ADMIN'>
  acceptedTerms: boolean
}

const DASHBOARD_MAP: Record<UserRole, string> = {
  ADMIN: '/admin',
  LANDLORD: '/landlord/dashboard',
  AGENT: '/agent/dashboard',
  TENANT: '/dashboard',
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('rentnaija_token')
    if (stored) {
      setToken(stored)
      authService
        .getMe(stored)
        .then((u) => {
          if (!u.emailVerified) {
            // Email not yet verified — clear session, force them to verify first
            localStorage.removeItem('rentnaija_token')
            setToken(null)
            setUser(null)
          } else {
            setUser(u)
          }
        })
        .catch(() => {
          localStorage.removeItem('rentnaija_token')
          setToken(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const result = await authService.login({ email, password })

    if (result.status === 'otp_required') {
      // Redirect to OTP screen — email is masked for display only
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`)
      return
    }

    const { user: u, accessToken } = result
    localStorage.setItem('rentnaija_token', accessToken)
    setToken(accessToken)
    setUser(u)
    router.push(DASHBOARD_MAP[u.role] ?? '/dashboard')
  }

  const register = async (data: RegisterData) => {
    // Call the API but do NOT store the token or set user state.
    // The user must verify their email before they get a session.
    await authService.register(data)
    // Caller (register page) shows the "check your email" screen.
  }

  const logout = () => {
    localStorage.removeItem('rentnaija_token')
    setToken(null)
    setUser(null)
    router.push('/')
  }

  const updateUser = (patch: Partial<AuthUser>) => {
    setUser((prev) => prev ? { ...prev, ...patch } : prev)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
