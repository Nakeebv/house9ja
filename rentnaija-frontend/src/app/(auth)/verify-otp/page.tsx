'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Loader2, Mail, RefreshCw, ShieldCheck } from 'lucide-react'
import { authService } from '@/lib/services/auth-service'
import { useAuth } from '@/lib/auth-context'

const DASHBOARD_MAP: Record<string, string> = {
  ADMIN: '/admin',
  LANDLORD: '/landlord/dashboard',
  AGENT: '/agent/dashboard',
  TENANT: '/dashboard',
}

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60
const EXPIRY_SECONDS = 600

function VerifyOtpContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading } = useAuth()

  const rawEmail = searchParams.get('email') ?? ''
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [timeLeft, setTimeLeft] = useState(EXPIRY_SECONDS)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(DASHBOARD_MAP[user.role] ?? '/dashboard')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (timeLeft <= 0) return
    const id = setInterval(() => setTimeLeft((t) => Math.max(t - 1, 0)), 1000)
    return () => clearInterval(id)
  }, [timeLeft])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const id = setInterval(() => setResendCooldown((c) => Math.max(c - 1, 0)), 1000)
    return () => clearInterval(id)
  }, [resendCooldown])

  const focusInput = useCallback((index: number) => {
    inputRefs.current[index]?.focus()
  }, [])

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      const cleaned = value.replace(/\D/g, '').slice(0, OTP_LENGTH)
      if (cleaned.length === OTP_LENGTH) {
        setDigits(cleaned.split(''))
        inputRefs.current[OTP_LENGTH - 1]?.focus()
        return
      }
    }
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    setError('')
    if (digit && index < OTP_LENGTH - 1) focusInput(index + 1)
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits]; next[index] = ''; setDigits(next)
      } else if (index > 0) {
        focusInput(index - 1)
        const next = [...digits]; next[index - 1] = ''; setDigits(next)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1)
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      focusInput(index + 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const otp = digits.join('')
    if (otp.length < OTP_LENGTH) { setError('Please enter all 6 digits.'); return }

    setLoading(true)
    setError('')
    try {
      const result = await authService.verifyOtp(rawEmail, otp)
      localStorage.setItem('rentnaija_token', result.accessToken)
      window.location.href = DASHBOARD_MAP[result.user.role] ?? '/dashboard'
    } catch (err: any) {
      const msg = err?.message ?? ''
      setError(
        msg === 'OTP_EXPIRED' || msg.includes('OTP_EXPIRED')
          ? 'Your code has expired. Please request a new one.'
          : msg || 'Incorrect code. Please try again.',
      )
      setDigits(Array(OTP_LENGTH).fill(''))
      focusInput(0)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return
    setResendLoading(true)
    setResendMsg('')
    try {
      await authService.resendOtp(rawEmail)
      setResendMsg('New code sent. Check your inbox.')
      setResendCooldown(RESEND_COOLDOWN)
      setTimeLeft(EXPIRY_SECONDS)
      setDigits(Array(OTP_LENGTH).fill(''))
      focusInput(0)
    } catch {
      setResendMsg('Failed to resend. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const expired = timeLeft === 0

  if (isLoading || user) return null

  if (!rawEmail) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-white dark:bg-black px-5">
        <p className="text-[15px] text-[#6e6e73] dark:text-[#a1a1a6]">
          Invalid link.{' '}
          <Link href="/login" className="font-semibold text-[#0071e3] hover:underline dark:text-[#2997ff]">
            Go back to login
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-white dark:bg-black">
      <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-2">

        {/* ── Left panel ── */}
        <div className="hidden lg:block">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#0071e3] dark:text-[#2997ff]">
            Two-step verification
          </p>
          <h1 className="mt-3 text-[42px] font-semibold leading-[1.1] tracking-[-0.025em] text-[#1d1d1f] dark:text-[#f5f5f7]">
            One code between you and your dashboard.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[#6e6e73] dark:text-[#a1a1a6]">
            We sent a 6-digit code to your email. It expires in 10 minutes and can only be used once.
          </p>
          <div className="mt-8 space-y-3">
            {[
              { title: 'Phishing-resistant', body: "Even if someone has your password, they can't sign in without the code." },
              { title: 'Single-use', body: 'Each code is invalidated immediately after use.' },
              { title: 'Short-lived', body: 'Codes expire after 10 minutes — no lingering risk.' },
            ].map(({ title, body }) => (
              <div key={title} className="flex items-start gap-3 rounded-2xl border border-black/6 bg-[#f5f5f7] px-4 py-4 dark:border-white/6 dark:bg-[#1d1d1f]">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0071e3] dark:text-[#2997ff]" />
                <div>
                  <p className="text-[13px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">{title}</p>
                  <p className="mt-0.5 text-[12px] text-[#6e6e73] dark:text-[#a1a1a6]">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right — OTP form ── */}
        <div className="w-full max-w-[440px] justify-self-center lg:justify-self-end">
          <Link href="/" className="mb-8 inline-flex items-center gap-2.5">
            <div className="relative h-9 w-9">
              <Image src="/logo-icon.png" alt="House9ja" fill className="object-contain" sizes="36px" />
            </div>
            <span className="text-[18px] font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">
              house<span className="text-orange-500">9ja</span>
            </span>
          </Link>

          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f0f7ff] dark:bg-[#0071e3]/10">
            <Mail className="h-5 w-5 text-[#0071e3] dark:text-[#2997ff]" />
          </div>

          <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-[#f5f5f7]">
            Check your email
          </h2>
          <p className="mt-1 text-[14px] text-[#6e6e73] dark:text-[#a1a1a6]">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">{rawEmail}</span>
          </p>

          {/* Timer */}
          <div className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold ${
            expired
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
              : timeLeft < 60
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
              : 'bg-[#f0f7ff] text-[#0071e3] dark:bg-[#0071e3]/10 dark:text-[#2997ff]'
          }`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {expired ? 'Code expired' : `Expires in ${minutes}:${seconds.toString().padStart(2, '0')}`}
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-200/60 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          )}
          {resendMsg && !error && (
            <div className="mt-4 rounded-2xl border border-emerald-200/60 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              {resendMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6">
            <div className="flex gap-2.5 sm:gap-3">
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={OTP_LENGTH}
                  value={digit}
                  autoFocus={i === 0}
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onFocus={(e) => e.target.select()}
                  disabled={loading}
                  className={`h-14 w-full rounded-2xl border text-center text-[22px] font-bold tabular-nums outline-none transition disabled:opacity-60 ${
                    digit
                      ? 'border-[#0071e3] bg-[#f0f7ff] text-[#0071e3] ring-1 ring-[#0071e3] dark:border-[#2997ff] dark:bg-[#0071e3]/10 dark:text-[#2997ff] dark:ring-[#2997ff]'
                      : 'border-black/10 bg-[#f5f5f7] text-[#1d1d1f] focus:border-[#0071e3] focus:bg-white focus:ring-1 focus:ring-[#0071e3] dark:border-white/10 dark:bg-[#1d1d1f] dark:text-[#f5f5f7] dark:focus:border-[#2997ff] dark:focus:bg-[#2d2d2f] dark:focus:ring-[#2997ff]'
                  }`}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || digits.join('').length < OTP_LENGTH || expired}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#0071e3] text-[15px] font-semibold text-white transition hover:bg-[#0077ed] active:scale-[0.98] disabled:opacity-50 dark:bg-[#2997ff] dark:text-black dark:hover:bg-[#409cff]"
            >
              {loading ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-black dark:border-t-transparent" /> Verifying…</>
              ) : (
                <><span>Verify and sign in</span><ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-[13px] text-[#6e6e73] dark:text-[#a1a1a6]">Didn&apos;t receive a code?</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resendLoading}
              className="mt-1 flex items-center justify-center gap-1.5 w-full text-[13px] font-semibold text-[#0071e3] hover:underline disabled:opacity-50 disabled:no-underline dark:text-[#2997ff]"
            >
              {resendLoading ? (
                <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> Sending…</>
              ) : resendCooldown > 0 ? (
                <>Resend in {resendCooldown}s</>
              ) : (
                <><RefreshCw className="h-3.5 w-3.5" /> Resend code</>
              )}
            </button>
          </div>

          <p className="mt-6 text-center text-[13px] text-[#6e6e73] dark:text-[#a1a1a6]">
            Wrong account?{' '}
            <Link href="/login" className="font-semibold text-[#0071e3] hover:underline dark:text-[#2997ff]">
              Back to sign in
            </Link>
          </p>

          <div className="mt-8 flex items-center justify-center gap-5 border-t border-black/8 pt-6 dark:border-white/8">
            {['Code encrypted', 'Single-use', 'Never shared'].map((item) => (
              <div key={item} className="flex items-center gap-1 text-[11px] text-[#86868b] dark:text-[#6e6e73]">
                <ShieldCheck className="h-3 w-3 shrink-0 text-[#0071e3] dark:text-[#2997ff]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-white dark:bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
      </div>
    }>
      <VerifyOtpContent />
    </Suspense>
  )
}
