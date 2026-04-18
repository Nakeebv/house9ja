'use client'

import { useRef, useState } from 'react'
import {
  BadgeCheck, Mail, Phone, ShieldCheck, User2,
  Key, Camera, Loader2, CheckCircle2,
} from 'lucide-react'
import { RequireAuth } from '@/components/auth/require-auth'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import Image from 'next/image'

const ROLE_CONFIG: Record<string, { label: string; gradient: string; ring: string; badge: string }> = {
  TENANT:   { label: 'Tenant',   gradient: 'from-indigo-500 to-blue-600',   ring: 'ring-indigo-100',   badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  LANDLORD: { label: 'Landlord', gradient: 'from-emerald-500 to-teal-600',  ring: 'ring-emerald-100',  badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  AGENT:    { label: 'Agent',    gradient: 'from-amber-500 to-orange-500',  ring: 'ring-amber-100',    badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  ADMIN:    { label: 'Admin',    gradient: 'from-rose-500 to-pink-600',     ring: 'ring-rose-100',     badge: 'bg-rose-50 text-rose-700 border-rose-200' },
}

const MAX_SIZE = 3 * 1024 * 1024 // 3 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const cfg = ROLE_CONFIG[user?.role ?? ''] ?? ROLE_CONFIG.TENANT
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const handleAvatarClick = () => {
    setUploadError('')
    setUploadSuccess(false)
    fileRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED.includes(file.type)) {
      setUploadError('Only JPG, PNG, or WEBP images are allowed.')
      return
    }
    if (file.size > MAX_SIZE) {
      setUploadError('Image must be under 3 MB.')
      return
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    if (!cloudName || !uploadPreset) {
      setUploadError('Image upload is not configured.')
      return
    }

    setUploading(true)
    setUploadError('')

    try {
      // 1. Upload directly to Cloudinary
      const body = new FormData()
      body.append('file', file)
      body.append('upload_preset', uploadPreset)
      body.append('folder', 'avatars')

      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body,
      })
      const cloudData = await cloudRes.json()
      if (!cloudRes.ok) throw new Error(cloudData?.error?.message ?? 'Upload failed')

      const avatarUrl: string = cloudData.secure_url

      // 2. Persist to backend (token auto-injected from localStorage)
      await api.patch('/users/me', { avatarUrl })

      // 3. Update local auth state immediately
      updateUser({ avatarUrl })
      setUploadSuccess(true)
    } catch (err: any) {
      setUploadError(err?.message ?? 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-[#f7f7f7]">
        {/* Cover banner */}
        <div className="h-40 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 sm:h-52" />

        <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
          {/* Avatar + name row */}
          <div className="-mt-14 flex flex-col items-start gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
            {/* Clickable avatar */}
            <div className="relative inline-block">
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={uploading}
                className={`group relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white shadow-xl sm:h-32 sm:w-32 focus:outline-none`}
                aria-label="Change profile photo"
              >
                {user?.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.name ?? 'Avatar'}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                ) : (
                  <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${cfg.gradient} text-3xl font-bold text-white`}>
                    {initials}
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/0 transition-colors group-hover:bg-black/40">
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white opacity-0 group-hover:opacity-100" />
                  ) : (
                    <>
                      <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100" />
                      <span className="text-[10px] font-medium text-white opacity-0 group-hover:opacity-100">Change</span>
                    </>
                  )}
                </div>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept={ALLOWED.join(',')}
                className="hidden"
                onChange={handleFileChange}
              />
              {/* Verification badge */}
              {user?.isVerified && (
                <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 ring-2 ring-white shadow-md" title="Verified by House9ja">
                  <BadgeCheck className="h-5 w-5 text-white" strokeWidth={2.5} />
                </span>
              )}
            </div>

            <div className="pb-1 sm:pb-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${cfg.badge}`}>
                <ShieldCheck className="h-3.5 w-3.5" />
                {cfg.label}
              </span>
            </div>
          </div>

          {/* Name + upload feedback */}
          <div className="mt-4">
            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{user?.name ?? '—'}</h1>
            <p className="mt-1 text-sm text-slate-500">{user?.email}</p>

            {uploadError && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-rose-600">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
                {uploadError}
              </p>
            )}
            {uploadSuccess && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                Profile photo updated successfully.
              </p>
            )}
            <p className="mt-2 text-xs text-slate-400">Click your photo to upload a new one (JPG, PNG, WEBP · max 3 MB)</p>
          </div>

          <div className="mt-8 space-y-4">
            {/* Account details */}
            <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="text-base font-semibold text-slate-900">Account Details</h2>
              </div>
              <div className="divide-y divide-slate-50">
                <DetailRow icon={<User2 className="h-4 w-4 text-slate-400" />} label="Full name" value={user?.name ?? '—'} />
                <DetailRow icon={<Mail className="h-4 w-4 text-slate-400" />} label="Email address" value={user?.email ?? '—'} />
                <DetailRow icon={<Phone className="h-4 w-4 text-slate-400" />} label="Phone number" value={user?.phone ?? 'Not provided'} />
                <DetailRow icon={<Key className="h-4 w-4 text-slate-400" />} label="Account ID" value={user?.id ? `${user.id.slice(0, 8)}…${user.id.slice(-4)}` : '—'} mono />
              </div>
            </section>

            {/* Verification status */}
            <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="text-base font-semibold text-slate-900">Verification Status</h2>
              </div>
              <div className="divide-y divide-slate-50">
                <VerificationRow
                  icon={<BadgeCheck className={`h-5 w-5 ${user?.isVerified ? 'text-emerald-500' : 'text-slate-300'}`} />}
                  label="Account verification"
                  description={user?.isVerified ? 'Your account is verified.' : 'Account verification pending.'}
                  verified={user?.isVerified ?? false}
                />
                {(user?.role === 'LANDLORD' || user?.role === 'AGENT') && (
                  <VerificationRow
                    icon={<ShieldCheck className={`h-5 w-5 ${user?.isVerifiedLandlord ? 'text-blue-500' : 'text-slate-300'}`} />}
                    label="Landlord verification"
                    description={user?.isVerifiedLandlord ? 'Documents approved.' : 'Documents under review.'}
                    verified={user?.isVerifiedLandlord ?? false}
                    verifiedLabel="Approved"
                    pendingLabel="Under Review"
                  />
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}

function DetailRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`mt-0.5 truncate text-sm font-medium text-slate-900 ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
      </div>
    </div>
  )
}

function VerificationRow({
  icon, label, description, verified,
  verifiedLabel = 'Verified', pendingLabel = 'Pending',
}: {
  icon: React.ReactNode
  label: string
  description: string
  verified: boolean
  verifiedLabel?: string
  pendingLabel?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <div className="flex items-center gap-4">
        {icon}
        <div>
          <p className="text-sm font-medium text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
        verified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
      }`}>
        {verified ? verifiedLabel : pendingLabel}
      </span>
    </div>
  )
}
