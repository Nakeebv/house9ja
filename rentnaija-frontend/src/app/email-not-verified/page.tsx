'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, RefreshCw, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { authService } from '@/lib/services/auth-service'

export default function EmailNotVerifiedPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [isError, setIsError] = useState(false)

  const handleResend = async () => {
    if (!user?.email) return
    setLoading(true)
    setMsg('')
    setIsError(false)
    try {
      await authService.resendVerification(user.email)
      setMsg('Verification email sent! Check your inbox and spam folder.')
    } catch {
      setMsg('Failed to resend. Please try again.')
      setIsError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xl p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200">
            <Mail className="h-8 w-8 text-amber-500" />
          </div>

          <h1 className="text-xl font-bold text-slate-950 mb-2">Verify your email to continue</h1>
          <p className="text-sm text-slate-500 mb-1">We sent a verification link to:</p>
          <p className="text-sm font-semibold text-blue-700 mb-5">{user?.email ?? 'your email address'}</p>

          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Click the link in that email to activate your account. Check your spam or promotions folder if you don't see it in your inbox.
          </p>

          {msg && (
            <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${isError ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              {msg}
            </div>
          )}

          <div className="space-y-3">
            <Button
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleResend}
              disabled={loading}
            >
              {loading
                ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Sending…</span>
                : <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Resend Verification Email</span>
              }
            </Button>

            <Button
              variant="outline"
              className="w-full h-11 text-slate-600"
              onClick={() => { logout(); router.push('/login') }}
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
