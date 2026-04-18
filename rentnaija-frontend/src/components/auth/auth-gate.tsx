'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface AuthGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  prompt?: string
}

export function AuthGate({ children, fallback, prompt = 'Login to view this information' }: AuthGateProps) {
  const { user } = useAuth()

  if (user) return <>{children}</>

  if (fallback) return <>{fallback}</>

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-black/8 bg-[#f5f5f7] px-4 py-3 dark:border-white/8 dark:bg-[#2d2d2f]">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0071e3]/10 dark:bg-[#2997ff]/10">
        <Lock className="h-3.5 w-3.5 text-[#0071e3] dark:text-[#2997ff]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-[#6e6e73] dark:text-[#a1a1a6]">{prompt}</p>
      </div>
      <Link
        href="/login"
        className="shrink-0 rounded-full bg-[#0071e3] px-3 py-1 text-[12px] font-semibold text-white transition hover:bg-[#0077ed] dark:bg-[#2997ff] dark:text-black dark:hover:bg-[#409cff]"
      >
        Log in
      </Link>
    </div>
  )
}

export function AuthGateButton({
  children,
  onClick,
  className,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  className?: string
  disabled?: boolean
}) {
  const { user } = useAuth()

  if (user) {
    return (
      <button onClick={onClick} disabled={disabled} className={className}>
        {children}
      </button>
    )
  }

  return (
    <Link
      href={`/login?next=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '')}`}
      className={className}
    >
      {children}
    </Link>
  )
}
