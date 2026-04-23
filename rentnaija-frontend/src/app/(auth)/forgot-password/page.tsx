'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Mail, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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

        {sent ? (
          <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50 p-6 text-center dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <Mail className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
            <h2 className="text-[22px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">Check your inbox</h2>
            <p className="mt-2 text-[14px] text-[#6e6e73] dark:text-[#a1a1a6]">
              If <strong>{email}</strong> has an account, we've sent a password reset link. It expires in 1 hour.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#0071e3] hover:underline dark:text-[#2997ff]"
            >
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-[#f5f5f7]">
              Forgot password?
            </h2>
            <p className="mt-1 text-[14px] text-[#6e6e73] dark:text-[#a1a1a6]">
              Enter your email and we'll send a reset link.
            </p>

            {error && (
              <div className="mt-5 rounded-2xl border border-rose-200/60 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                  Email address
                </label>
                <input
                  type="email" required autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="h-11 w-full rounded-xl border border-black/10 bg-[#f5f5f7] px-4 text-[14px] text-[#1d1d1f] outline-none transition placeholder:text-[#a1a1a6] focus:border-[#0071e3] focus:bg-white focus:ring-1 focus:ring-[#0071e3] dark:border-white/10 dark:bg-[#1d1d1f] dark:text-[#f5f5f7] dark:placeholder:text-[#6e6e73] dark:focus:border-[#2997ff] dark:focus:bg-[#2d2d2f] dark:focus:ring-[#2997ff]"
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#0071e3] text-[15px] font-semibold text-white transition hover:bg-[#0077ed] active:scale-[0.98] disabled:opacity-60 dark:bg-[#2997ff] dark:text-black dark:hover:bg-[#409cff]"
              >
                {loading ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-black dark:border-t-transparent" /> Sending…</>
                ) : (
                  <><span>Send reset link</span><ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-[13px] text-[#6e6e73] dark:text-[#a1a1a6]">
              Remember your password?{' '}
              <Link href="/login" className="font-semibold text-[#0071e3] hover:underline dark:text-[#2997ff]">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
