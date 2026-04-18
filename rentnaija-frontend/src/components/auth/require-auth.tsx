'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import type { UserRole } from '@/types'

export function RequireAuth({
  children,
  roles,
}: {
  children: React.ReactNode
  roles?: UserRole[]
}) {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.replace('/login')
      return
    }

    if (!user.emailVerified) {
      router.replace('/email-not-verified')
      return
    }

    if (roles?.length && !roles.includes(user.role)) {
      router.replace('/login')
    }
  }, [user, isLoading, roles, router])

  if (isLoading || !user || !user.emailVerified || (roles?.length && !roles.includes(user.role))) {
    return <div className="min-h-[40vh] flex items-center justify-center text-sm text-slate-500">Loading...</div>
  }

  return <>{children}</>
}
