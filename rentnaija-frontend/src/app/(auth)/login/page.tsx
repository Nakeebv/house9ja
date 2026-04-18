'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, RefreshCw, ShieldCheck, ArrowRight } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { authService } from '@/lib/services/auth-service'

const DASHBOARD_MAP: Record<string, string> = {
  ADMIN:    '/admin',
  LANDLORD: '/landlord/dashboard',
  AGENT:    '/agent/dashboard',
  TENANT:   '/dashboard',
}

export default function LoginPage() {
  const router = useRouter()
  const { user, isLoading, login } = useAuth()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailNotVerified, setEmailNotVerified] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const [formData, setFormData] = useState({ email: '', password: '' })

  // Already authenticated — redirect to the right dashboard immediately
  useEffect(() => {
    if (!isLoading && user) {
      router.replace(DASHBOARD_MAP[user.role] ?? '/dashboard')
    }
  }, [user, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setEmailNotVerified(false)

    try {
      await login(formData.email, formData.password)
    } catch (err: any) {
      const msg = err?.message ?? ''
      if (msg === 'EMAIL_NOT_VERIFIED' || msg.includes('EMAIL_NOT_VERIFIED')) {
        setEmailNotVerified(true)
      } else {
        setError(msg || 'Login failed. Please check your details and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    setResendMsg('')
    try {
      await authService.resendVerification(formData.email)
      setResendMsg('Verification email sent. Please check your inbox.')
    } catch {
      setResendMsg('Failed to resend. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  // Show nothing while checking auth / redirecting
  if (isLoading || user) return null

  return (
    <div className="min-h-[calc(100vh-64px)] bg-white dark:bg-black">
      <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-2">

        {/* ── Left — image panel ── */}
        <div className="hidden lg:block">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#0071e3] dark:text-[#2997ff]">
            Welcome back
          </p>
          <h1 className="mt-3 text-[42px] font-semibold leading-[1.1] tracking-[-0.025em] text-[#1d1d1f] dark:text-[#f5f5f7]">
            Sign in and continue your rental journey.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[#6e6e73] dark:text-[#a1a1a6]">
            Access saved searches, landlord conversations, applications, and your personal dashboard.
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl">
            <div className="relative h-[320px]">
              <Image src="/hero/img-a3.png" alt="Property" fill priority sizes="50vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <div className="flex items-center gap-2 text-white/60 text-[12px] font-medium uppercase tracking-wider">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified platform
                </div>
                <p className="mt-2 text-xl font-semibold leading-tight text-white">
                  Everything you need to rent with confidence in Nigeria.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right — form ── */}
        <div className="w-full max-w-[440px] justify-self-center lg:justify-self-end">
          {/* Logo */}
          <Link href="/" className="mb-8 inline-flex items-center gap-2.5">
            <div className="relative h-9 w-9">
              <Image src="/logo-icon.png" alt="House9ja" fill className="object-contain" sizes="36px" />
            </div>
            <span className="text-[18px] font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">
              house<span className="text-orange-500">9ja</span>
            </span>
          </Link>

          <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-[#f5f5f7]">
            Sign in
          </h2>
          <p className="mt-1 text-[14px] text-[#6e6e73] dark:text-[#a1a1a6]">
            Use your email and password to access House9ja.
          </p>

          {/* Email-not-verified banner */}
          {emailNotVerified && (
            <div className="mt-5 rounded-2xl border border-amber-200/60 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
              <div className="flex items-start gap-2 mb-2">
                <Mail className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <p className="text-[13px] font-semibold text-amber-800 dark:text-amber-300">Email not verified</p>
              </div>
              <p className="text-[12px] text-amber-700 dark:text-amber-400 mb-3">
                Check your inbox for the verification link before signing in.
              </p>
              {resendMsg && <p className="text-[12px] text-amber-900 dark:text-amber-200 font-medium mb-2">{resendMsg}</p>}
              <button
                type="button" onClick={handleResend} disabled={resendLoading}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100 underline disabled:opacity-50"
              >
                {resendLoading
                  ? <><span className="h-3 w-3 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" /> Sending…</>
                  : <><RefreshCw className="h-3 w-3" /> Resend verification email</>}
              </button>
            </div>
          )}

          {/* Error */}
          {error && !emailNotVerified && (
            <div className="mt-5 rounded-2xl border border-rose-200/60 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                Email address
              </label>
              <input
                type="email" required autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
                className="h-11 w-full rounded-xl border border-black/10 bg-[#f5f5f7] px-4 text-[14px] text-[#1d1d1f] outline-none transition placeholder:text-[#a1a1a6] focus:border-[#0071e3] focus:bg-white focus:ring-1 focus:ring-[#0071e3] dark:border-white/10 dark:bg-[#1d1d1f] dark:text-[#f5f5f7] dark:placeholder:text-[#6e6e73] dark:focus:border-[#2997ff] dark:focus:bg-[#2d2d2f] dark:focus:ring-[#2997ff]"
              />
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">Password</label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} required autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl border border-black/10 bg-[#f5f5f7] px-4 pr-11 text-[14px] text-[#1d1d1f] outline-none transition placeholder:text-[#a1a1a6] focus:border-[#0071e3] focus:bg-white focus:ring-1 focus:ring-[#0071e3] dark:border-white/10 dark:bg-[#1d1d1f] dark:text-[#f5f5f7] dark:placeholder:text-[#6e6e73] dark:focus:border-[#2997ff] dark:focus:bg-[#2d2d2f] dark:focus:ring-[#2997ff]"
                />
                <button
                  type="button" tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#6e6e73] hover:text-[#1d1d1f] dark:text-[#a1a1a6] dark:hover:text-[#f5f5f7]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#0071e3] text-[15px] font-semibold text-white transition hover:bg-[#0077ed] active:scale-[0.98] disabled:opacity-60 dark:bg-[#2997ff] dark:text-black dark:hover:bg-[#409cff]"
            >
              {loading ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-black dark:border-t-transparent" /> Signing in…</>
              ) : (
                <><span>Sign in</span><ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-[#6e6e73] dark:text-[#a1a1a6]">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-[#0071e3] hover:underline dark:text-[#2997ff]">
              Create one here
            </Link>
          </p>

          {/* Trust indicators */}
          <div className="mt-8 flex items-center justify-center gap-5 border-t border-black/8 pt-6 dark:border-white/8">
            {['ID-Verified Landlords', 'Secure chat', 'No hidden fees'].map((item) => (
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
