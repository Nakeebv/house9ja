'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { authService } from '@/lib/services/auth-service'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setState('error')
      setErrorMsg('No verification token found in this link.')
      return
    }

    authService
      .verifyEmail(token)
      .then(() => {
        setState('success')
      })
      .catch((err) => {
        setErrorMsg(err?.message ?? 'This link is invalid or has expired.')
        setState('error')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (state === 'loading') {
    return (
      <div className="text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#0071e3] mb-4" />
        <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">Verifying your email…</h2>
        <p className="mt-2 text-[13px] text-[#6e6e73] dark:text-[#a1a1a6]">Please wait a moment.</p>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className="rounded-2xl border border-black/8 bg-white shadow-sm px-8 py-10 text-center dark:border-white/8 dark:bg-[#1d1d1f]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20">
          <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-[22px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] mb-2">Email verified!</h2>
        <p className="text-[14px] text-[#6e6e73] dark:text-[#a1a1a6] mb-7">
          Your email has been confirmed. Sign in to access your House9ja account.
        </p>
        <Link
          href="/login"
          className="flex h-11 w-full items-center justify-center rounded-full bg-[#0071e3] text-[15px] font-semibold text-white transition hover:bg-[#0077ed] active:scale-[0.98] dark:bg-[#2997ff] dark:text-black dark:hover:bg-[#409cff]"
        >
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-black/8 bg-white shadow-sm px-8 py-10 text-center dark:border-white/8 dark:bg-[#1d1d1f]">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20">
        <XCircle className="h-7 w-7 text-rose-600 dark:text-rose-400" />
      </div>
      <h2 className="text-[22px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] mb-2">Verification failed</h2>
      <p className="text-[14px] text-[#6e6e73] dark:text-[#a1a1a6] mb-7">{errorMsg}</p>
      <Link
        href="/login"
        className="flex h-11 w-full items-center justify-center rounded-full border border-black/10 text-[15px] font-semibold text-[#1d1d1f] transition hover:bg-[#f5f5f7] dark:border-white/10 dark:text-[#f5f5f7] dark:hover:bg-[#2d2d2f]"
      >
        Back to sign in
      </Link>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Suspense fallback={
          <div className="text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#0071e3] mb-4" />
            <h2 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">Loading…</h2>
          </div>
        }>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  )
}
