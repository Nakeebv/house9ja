'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Building2, UserCheck, Briefcase, Mail, RefreshCw, ShieldCheck, ArrowRight, CheckCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { authService } from '@/lib/services/auth-service'

type Role = 'TENANT' | 'LANDLORD' | 'AGENT'

const ROLES = [
  { value: 'TENANT' as Role, label: 'Tenant', icon: UserCheck, desc: 'Find and rent homes.' },
  { value: 'LANDLORD' as Role, label: 'Landlord', icon: Building2, desc: 'List your properties.' },
  { value: 'AGENT' as Role, label: 'Agent', icon: Briefcase, desc: 'Coordinate rentals.' },
]

const DASHBOARD_MAP: Record<string, string> = {
  ADMIN:    '/admin',
  LANDLORD: '/landlord/dashboard',
  AGENT:    '/agent/dashboard',
  TENANT:   '/dashboard',
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
    { label: 'Special character', ok: /[^A-Za-z0-9]/.test(password) },
  ]
  const score = checks.filter((c) => c.ok).length
  const barColor = score <= 1 ? 'bg-rose-500' : score === 2 ? 'bg-amber-500' : score === 3 ? 'bg-yellow-400' : 'bg-emerald-500'
  const label = score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong'

  if (!password) return null

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? barColor : 'bg-black/8 dark:bg-white/10'}`} />
          ))}
        </div>
        <span className={`text-[11px] font-semibold ${score <= 1 ? 'text-rose-500' : score === 2 ? 'text-amber-500' : score === 3 ? 'text-yellow-500' : 'text-emerald-500'}`}>
          {label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1 text-[11px]">
            <CheckCircle className={`h-3 w-3 shrink-0 ${c.ok ? 'text-emerald-500' : 'text-black/20 dark:text-white/20'}`} />
            <span className={c.ok ? 'text-[#1d1d1f] dark:text-[#f5f5f7]' : 'text-[#a1a1a6]'}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const { user, isLoading, register } = useAuth()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '',
    password: '', phone: '', role: 'TENANT' as Role,
  })

  // Already authenticated — redirect immediately
  useEffect(() => {
    if (!isLoading && user) {
      router.replace(DASHBOARD_MAP[user.role] ?? '/dashboard')
    }
  }, [user, isLoading, router])

  const validationError = useMemo(() => {
    if (!formData.firstName.trim()) return 'First name is required.'
    if (!formData.lastName.trim()) return 'Last name is required.'
    if (!/\S+@\S+\.\S+/.test(formData.email)) return 'Please enter a valid email.'
    if (formData.password.length < 8) return 'Password must be at least 8 characters.'
    if (formData.phone.replace(/\D/g, '').length < 10) return 'Please enter a valid phone number.'
    if (!acceptedTerms) return 'You must accept the Terms & Conditions.'
    return ''
  }, [formData, acceptedTerms])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validationError) { setError(validationError); return }
    setLoading(true)
    setError('')
    try {
      await register({ ...formData, acceptedTerms: true })
      setRegisteredEmail(formData.email)
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    setResendMsg('')
    try {
      await authService.resendVerification(registeredEmail)
      setResendMsg('Verification email resent. Please check your inbox.')
    } catch {
      setResendMsg('Failed to resend. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  if (isLoading || user) return null

  // ── Email sent confirmation ──
  if (registeredEmail) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-white px-5 dark:bg-black">
        <div className="w-full max-w-[400px] text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0071e3]/10 dark:bg-[#2997ff]/10">
            <Mail className="h-8 w-8 text-[#0071e3] dark:text-[#2997ff]" />
          </div>
          <h2 className="text-[24px] font-semibold tracking-[-0.015em] text-[#1d1d1f] dark:text-[#f5f5f7]">
            Check your email
          </h2>
          <p className="mt-2 text-[14px] text-[#6e6e73] dark:text-[#a1a1a6]">
            We sent a verification link to
          </p>
          <p className="mt-1 text-[14px] font-semibold text-[#0071e3] dark:text-[#2997ff]">{registeredEmail}</p>
          <p className="mt-3 text-[13px] text-[#6e6e73] dark:text-[#a1a1a6]">
            Click the link to verify your account and start browsing homes. The link expires in 24 hours.
          </p>
          {resendMsg && (
            <p className="mt-4 rounded-xl border border-[#0071e3]/20 bg-[#0071e3]/5 px-4 py-2 text-[13px] text-[#0071e3] dark:border-[#2997ff]/20 dark:bg-[#2997ff]/5 dark:text-[#2997ff]">
              {resendMsg}
            </p>
          )}
          <button
            onClick={handleResend} disabled={resendLoading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-black/12 px-5 py-3 text-[14px] font-semibold text-[#1d1d1f] transition hover:bg-black/5 disabled:opacity-50 dark:border-white/12 dark:text-[#f5f5f7] dark:hover:bg-white/8"
          >
            {resendLoading
              ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Sending…</>
              : <><RefreshCw className="h-4 w-4" /> Resend verification email</>}
          </button>
          <p className="mt-5 text-[13px] text-[#6e6e73] dark:text-[#a1a1a6]">
            Already verified?{' '}
            <Link href="/login" className="font-semibold text-[#0071e3] hover:underline dark:text-[#2997ff]">Sign in</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-white dark:bg-black">
      <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-2">

        {/* ── Right — image panel (shows on right on lg) ── */}
        <div className="hidden lg:block lg:order-2">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#0071e3] dark:text-[#2997ff]">
            Get started free
          </p>
          <h1 className="mt-3 text-[42px] font-semibold leading-[1.1] tracking-[-0.025em] text-[#1d1d1f] dark:text-[#f5f5f7]">
            Join the rental marketplace built for Nigeria.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[#6e6e73] dark:text-[#a1a1a6]">
            Tenants discover homes, landlords publish listings, and agents coordinate rentals — all from one verified platform.
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl">
            <div className="relative h-[300px]">
              <Image src="/hero/img-a5.png" alt="Property" fill priority sizes="50vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <div className="flex items-center gap-2 text-white/60 text-[12px] font-medium uppercase tracking-wider">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified accounts
                </div>
                <p className="mt-2 text-xl font-semibold leading-tight text-white">
                  Create an account that matches how you rent, list, or manage homes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Left — form ── */}
        <div className="w-full max-w-[480px] justify-self-center lg:order-1">
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
            Create your account
          </h2>
          <p className="mt-1 text-[14px] text-[#6e6e73] dark:text-[#a1a1a6]">
            Choose your role and start using House9ja — free forever.
          </p>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-200/60 bg-rose-50 px-4 py-3 text-[13px] text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Role picker */}
            <div>
              <label className="mb-2 block text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">I am a…</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(({ value, label, icon: Icon, desc }) => {
                  const selected = formData.role === value
                  return (
                    <button
                      key={value} type="button"
                      onClick={() => setFormData({ ...formData, role: value })}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-3 text-center transition ${
                        selected
                          ? 'border-[#0071e3] bg-[#0071e3]/5 dark:border-[#2997ff] dark:bg-[#2997ff]/8'
                          : 'border-black/8 bg-[#f5f5f7] hover:border-black/15 dark:border-white/8 dark:bg-[#1d1d1f] dark:hover:border-white/15'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${selected ? 'text-[#0071e3] dark:text-[#2997ff]' : 'text-[#6e6e73] dark:text-[#a1a1a6]'}`} />
                      <span className={`text-[12px] font-semibold ${selected ? 'text-[#0071e3] dark:text-[#2997ff]' : 'text-[#1d1d1f] dark:text-[#f5f5f7]'}`}>
                        {label}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="mt-1.5 text-[12px] text-[#6e6e73] dark:text-[#a1a1a6]">
                {ROLES.find((r) => r.value === formData.role)?.desc}
              </p>
            </div>

            {/* Name */}
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { key: 'firstName', label: 'First name', placeholder: 'Jane' },
                { key: 'lastName', label: 'Last name', placeholder: 'Doe' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="mb-1.5 block text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">{label}</label>
                  <input
                    value={(formData as any)[key]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    placeholder={placeholder}
                    autoComplete={key === 'firstName' ? 'given-name' : 'family-name'}
                    className="h-11 w-full rounded-xl border border-black/10 bg-[#f5f5f7] px-4 text-[14px] text-[#1d1d1f] outline-none transition placeholder:text-[#a1a1a6] focus:border-[#0071e3] focus:bg-white focus:ring-1 focus:ring-[#0071e3] dark:border-white/10 dark:bg-[#1d1d1f] dark:text-[#f5f5f7] dark:placeholder:text-[#6e6e73] dark:focus:border-[#2997ff] dark:focus:bg-[#2d2d2f] dark:focus:ring-[#2997ff]"
                  />
                </div>
              ))}
            </div>

            {/* Email + Phone */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">Email address</label>
                <input
                  type="email" autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jane@email.com"
                  className="h-11 w-full rounded-xl border border-black/10 bg-[#f5f5f7] px-4 text-[14px] text-[#1d1d1f] outline-none transition placeholder:text-[#a1a1a6] focus:border-[#0071e3] focus:bg-white focus:ring-1 focus:ring-[#0071e3] dark:border-white/10 dark:bg-[#1d1d1f] dark:text-[#f5f5f7] dark:placeholder:text-[#6e6e73] dark:focus:border-[#2997ff] dark:focus:bg-[#2d2d2f] dark:focus:ring-[#2997ff]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">Phone number</label>
                <input
                  type="tel" autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+234 801 234 5678"
                  className="h-11 w-full rounded-xl border border-black/10 bg-[#f5f5f7] px-4 text-[14px] text-[#1d1d1f] outline-none transition placeholder:text-[#a1a1a6] focus:border-[#0071e3] focus:bg-white focus:ring-1 focus:ring-[#0071e3] dark:border-white/10 dark:bg-[#1d1d1f] dark:text-[#f5f5f7] dark:placeholder:text-[#6e6e73] dark:focus:border-[#2997ff] dark:focus:bg-[#2d2d2f] dark:focus:ring-[#2997ff]"
                />
              </div>
            </div>

            {/* Password + strength meter */}
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="At least 8 characters"
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
              <PasswordStrength password={formData.password} />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 rounded-xl border border-black/8 bg-[#f5f5f7] px-4 py-3 dark:border-white/8 dark:bg-[#1d1d1f]">
              <input
                id="accept-terms" type="checkbox" checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#0071e3]"
              />
              <label htmlFor="accept-terms" className="cursor-pointer text-[13px] leading-relaxed text-[#6e6e73] dark:text-[#a1a1a6]">
                I agree to the{' '}
                <Link href="/terms" target="_blank" className="font-semibold text-[#0071e3] hover:underline dark:text-[#2997ff]">
                  Terms &amp; Conditions
                </Link>{' '}
                and confirm I am at least 18 years old.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !acceptedTerms}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#0071e3] text-[15px] font-semibold text-white transition hover:bg-[#0077ed] active:scale-[0.98] disabled:opacity-50 dark:bg-[#2997ff] dark:text-black dark:hover:bg-[#409cff]"
            >
              {loading ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-black dark:border-t-transparent" /> Creating account…</>
              ) : (
                <><span>Create Account</span><ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-[13px] text-[#6e6e73] dark:text-[#a1a1a6]">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[#0071e3] hover:underline dark:text-[#2997ff]">
              Sign in
            </Link>
          </p>

          <div className="mt-6 flex items-center justify-center gap-5 border-t border-black/8 pt-5 dark:border-white/8">
            {['Verified landlords', 'Secure platform', 'Free to join'].map((item) => (
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
