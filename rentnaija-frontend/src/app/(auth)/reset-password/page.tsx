'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react'
import { api } from '@/lib/api'

function ResetPasswordContent() {
  const params = useSearchParams()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }

    setLoading(true)
    setError('')
    try {
      await api.post('/auth/reset-password', { token, password })
      setDone(true)
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired link. Please request a new one.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="rounded-2xl border border-rose-200/60 bg-rose-50 p-6 text-center dark:border-rose-500/20 dark:bg-rose-500/10">
        <p className="text-[14px] text-rose-700 dark:text-rose-300">Invalid reset link. Please request a new one.</p>
        <Link href="/forgot-password" className="mt-4 inline-block text-[14px] font-semibold text-[#0071e3] hover:underline dark:text-[#2997ff]">
          Request reset link
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50 p-6 text-center dark:border-emerald-500/20 dark:bg-emerald-500/10">
        <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
        <h2 className="text-[22px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">Password updated</h2>
        <p className="mt-2 text-[14px] text-[#6e6e73] dark:text-[#a1a1a6]">Your password has been reset successfully.</p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-6 py-2.5 text-[14px] font-semibold text-white hover:bg-[#0077ed] dark:bg-[#2997ff] dark:text-black"
        >
          Sign in now
        </Link>
      </div>
    )
  }

  return (
    <>
      <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-[#f5f5f7]">
        Create new password
      </h2>
      <p className="mt-1 text-[14px] text-[#6e6e73] dark:text-[#a1a1a6]">
        Choose a strong password for your account.
      </p>

      {error && (
        <div className="mt-5 rounded-2xl border border-rose-200/60 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">New password</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'} required
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="h-11 w-full rounded-xl border border-black/10 bg-[#f5f5f7] px-4 pr-11 text-[14px] text-[#1d1d1f] outline-none transition placeholder:text-[#a1a1a6] focus:border-[#0071e3] focus:bg-white focus:ring-1 focus:ring-[#0071e3] dark:border-white/10 dark:bg-[#1d1d1f] dark:text-[#f5f5f7] dark:placeholder:text-[#6e6e73] dark:focus:border-[#2997ff] dark:focus:bg-[#2d2d2f] dark:focus:ring-[#2997ff]"
            />
            <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#6e6e73] hover:text-[#1d1d1f] dark:text-[#a1a1a6] dark:hover:text-[#f5f5f7]">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">Confirm password</label>
          <input
            type={showPw ? 'text' : 'password'} required
            value={confirm} onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter password"
            className="h-11 w-full rounded-xl border border-black/10 bg-[#f5f5f7] px-4 text-[14px] text-[#1d1d1f] outline-none transition placeholder:text-[#a1a1a6] focus:border-[#0071e3] focus:bg-white focus:ring-1 focus:ring-[#0071e3] dark:border-white/10 dark:bg-[#1d1d1f] dark:text-[#f5f5f7] dark:placeholder:text-[#6e6e73] dark:focus:border-[#2997ff] dark:focus:bg-[#2d2d2f] dark:focus:ring-[#2997ff]"
          />
        </div>

        <button
          type="submit" disabled={loading}
          className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#0071e3] text-[15px] font-semibold text-white transition hover:bg-[#0077ed] active:scale-[0.98] disabled:opacity-60 dark:bg-[#2997ff] dark:text-black dark:hover:bg-[#409cff]"
        >
          {loading ? (
            <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-black dark:border-t-transparent" /> Updating…</>
          ) : (
            <><span>Update password</span><ArrowRight className="h-4 w-4" /></>
          )}
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-white dark:bg-black flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-[440px]">
        <Link href="/login" className="mb-8 inline-flex items-center gap-2.5">
          <div className="relative h-9 w-9">
            <Image src="/logo-icon.png" alt="House9ja" fill className="object-contain" sizes="36px" />
          </div>
          <span className="text-[18px] font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">
            house<span className="text-orange-500">9ja</span>
          </span>
        </Link>
        <Suspense fallback={null}>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  )
}
