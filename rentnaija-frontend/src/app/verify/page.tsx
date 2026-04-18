'use client'

import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Upload, CheckCircle2, Clock, XCircle, BadgeCheck,
  CreditCard, RefreshCw, Camera, Home, Zap, Loader2, ArrowRight, AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RequireAuth } from '@/components/auth/require-auth'
import { useAuth } from '@/lib/auth-context'
import { verificationsService } from '@/lib/services/verifications-service'

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

async function uploadFile(file: File): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) throw new Error('Upload not configured')
  const body = new FormData()
  body.append('file', file)
  body.append('upload_preset', UPLOAD_PRESET)
  body.append('folder', 'verification')
  const resourceType = file.type === 'application/pdf' ? 'raw' : 'image'
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    { method: 'POST', body },
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message ?? 'Upload failed')
  return data.secure_url as string
}

type SlotKey = 'frontOfId' | 'backOfId' | 'selfie' | 'proofOfOwnership' | 'utilityBill'

type UploadSlot = {
  key: SlotKey
  label: string
  icon: React.ElementType
  required: boolean
  hint: string
  landlordOnly: boolean
  docField: string
}

const ALL_SLOTS: UploadSlot[] = [
  {
    key: 'frontOfId',
    label: 'Front of ID',
    icon: CreditCard,
    required: true,
    landlordOnly: false,
    docField: 'governmentIdUrl',
    hint: 'Front side of your NIN slip, international passport, or driver\'s licence',
  },
  {
    key: 'backOfId',
    label: 'Back of ID',
    icon: RefreshCw,
    required: true,
    landlordOnly: false,
    docField: 'backOfIdUrl',
    hint: 'Back side of the same ID document',
  },
  {
    key: 'selfie',
    label: 'Selfie Holding ID',
    icon: Camera,
    required: true,
    landlordOnly: false,
    docField: 'selfieWithIdUrl',
    hint: 'Clear photo of your face while visibly holding your open ID card',
  },
  {
    key: 'proofOfOwnership',
    label: 'Proof of Ownership',
    icon: Home,
    required: false,
    landlordOnly: true,
    docField: 'proofOfOwnershipUrl',
    hint: 'Certificate of Occupancy, deed of assignment, or title document for the property',
  },
  {
    key: 'utilityBill',
    label: 'Utility Bill',
    icon: Zap,
    required: false,
    landlordOnly: true,
    docField: 'utilityBillUrl',
    hint: 'Recent electricity, water, or cable bill showing your name and address',
  },
]

type UploadState = Record<string, { url: string; uploading: boolean; error: string }>

export default function VerifyPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [uploads, setUploads] = useState<UploadState>({})
  const [submitted, setSubmitted] = useState(false)

  const isLandlordOrAgent = user?.role === 'LANDLORD' || user?.role === 'AGENT'
  const slots = ALL_SLOTS.filter((s) => !s.landlordOnly || isLandlordOrAgent)
  const requiredSlots = slots.filter((s) => s.required)

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['my-verification'],
    queryFn: () => verificationsService.getMine(),
  })

  const submit = useMutation({
    mutationFn: () => {
      const frontId = uploads['frontOfId']?.url ?? status?.doc?.governmentIdUrl
      const backId = uploads['backOfId']?.url ?? status?.doc?.backOfIdUrl
      const selfie = uploads['selfie']?.url ?? status?.doc?.selfieWithIdUrl
      if (!frontId || !backId || !selfie) throw new Error('Front of ID, Back of ID, and Selfie are all required')
      return verificationsService.submit({
        governmentIdUrl: frontId,
        backOfIdUrl: backId,
        selfieWithIdUrl: selfie,
        proofOfOwnershipUrl: uploads['proofOfOwnership']?.url ?? status?.doc?.proofOfOwnershipUrl,
        utilityBillUrl: uploads['utilityBill']?.url ?? status?.doc?.utilityBillUrl,
      })
    },
    onSuccess: () => {
      setSubmitted(true)
      queryClient.invalidateQueries({ queryKey: ['my-verification'] })
    },
  })

  const handleFileChange = async (key: SlotKey, file: File) => {
    setUploads((p) => ({ ...p, [key]: { url: '', uploading: true, error: '' } }))
    try {
      const url = await uploadFile(file)
      setUploads((p) => ({ ...p, [key]: { url, uploading: false, error: '' } }))
    } catch (err: any) {
      setUploads((p) => ({ ...p, [key]: { url: '', uploading: false, error: err.message ?? 'Upload failed' } }))
    }
  }

  // A slot is "covered" if either a new upload exists OR the existing doc already has it
  const isSlotCovered = (slot: UploadSlot) =>
    !!uploads[slot.key]?.url || !!(status?.doc as any)?.[slot.docField]

  const allRequiredCovered = requiredSlots.every(isSlotCovered)

  const requiresMoreDocs = status?.status === 'PENDING' && status?.doc?.requiresMoreDocs === true
  const showUploadForm = !submitted && (status?.status === 'REJECTED' || requiresMoreDocs || !status?.submitted)

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 py-12 px-4">
        <div className="mx-auto max-w-2xl">

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-500/30">
              <BadgeCheck className="h-7 w-7 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Account Verification</h1>
            <p className="mt-2 text-slate-400">
              Submit your documents to get a verified badge on your profile.
              {isLandlordOrAgent && ' Landlords and agents must also provide property documents.'}
            </p>
          </div>

          {statusLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
            </div>
          ) : status?.status === 'APPROVED' ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white">Verification Approved</h2>
              <p className="mt-2 text-slate-400">Your documents have been reviewed and approved. Your verified badge is active on your profile.</p>
            </div>
          ) : submitted || (status?.status === 'PENDING' && !requiresMoreDocs) ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center">
              <Clock className="mx-auto mb-3 h-12 w-12 text-amber-400" />
              <h2 className="text-xl font-semibold text-white">Documents Under Review</h2>
              <p className="mt-2 text-slate-400">Our team is reviewing your submission. You will be notified once a decision is made — usually within 24 hours.</p>
              {status?.status === 'PENDING' && status.doc && (
                <div className="mt-5 rounded-xl bg-slate-900/60 border border-slate-700 p-4 text-left text-sm space-y-1.5">
                  {status.doc.governmentIdUrl && <p className="text-emerald-400">✓ Front of ID submitted</p>}
                  {status.doc.backOfIdUrl && <p className="text-emerald-400">✓ Back of ID submitted</p>}
                  {status.doc.selfieWithIdUrl && <p className="text-emerald-400">✓ Selfie with ID submitted</p>}
                  {status.doc.proofOfOwnershipUrl && <p className="text-emerald-400">✓ Proof of ownership submitted</p>}
                  {status.doc.utilityBillUrl && <p className="text-emerald-400">✓ Utility bill submitted</p>}
                </div>
              )}
            </div>
          ) : showUploadForm ? (
            <div className="space-y-6">
              {/* Admin request for more docs notice */}
              {requiresMoreDocs && status?.rejectionReason && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-300">Additional documents required</p>
                      <p className="mt-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-300">{status.rejectionReason}</p>
                      <p className="mt-2 text-xs text-slate-400">Documents you already submitted are kept. Only upload what is missing or needs to be replaced.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Rejection notice */}
              {status?.status === 'REJECTED' && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                  <div className="flex gap-3">
                    <XCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-rose-300">Previous submission was rejected</p>
                      {status.rejectionReason && (
                        <p className="mt-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-300">{status.rejectionReason}</p>
                      )}
                      <p className="mt-2 text-xs text-slate-400">Please upload new clear documents and resubmit below.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ID Documents section */}
              <div className="rounded-2xl border border-slate-700 bg-slate-900/60 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-700 bg-slate-800/50">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Identity Documents <span className="text-rose-400 ml-1">* required</span></p>
                </div>
                <div className="p-5 space-y-6">
                  {slots.filter((s) => !s.landlordOnly).map((slot) => (
                    <UploadField
                      key={slot.key}
                      slot={slot}
                      state={uploads[slot.key]}
                      existingUrl={status?.doc ? (status.doc as unknown as Record<string, string | null>)[slot.docField] : undefined}
                      fileRef={(el) => { fileRefs.current[slot.key] = el }}
                      onChange={(f) => handleFileChange(slot.key, f)}
                      onReplace={() => fileRefs.current[slot.key]?.click()}
                    />
                  ))}
                </div>
              </div>

              {/* Landlord/Agent docs */}
              {isLandlordOrAgent && (
                <div className="rounded-2xl border border-slate-700 bg-slate-900/60 overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-700 bg-slate-800/50">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Property Documents <span className="text-slate-500 ml-1">(optional — speeds up review)</span></p>
                  </div>
                  <div className="p-5 space-y-6">
                    {slots.filter((s) => s.landlordOnly).map((slot) => (
                      <UploadField
                        key={slot.key}
                        slot={slot}
                        state={uploads[slot.key]}
                        existingUrl={status?.doc ? (status.doc as unknown as Record<string, string | null>)[slot.docField] : undefined}
                        fileRef={(el) => { fileRefs.current[slot.key] = el }}
                        onChange={(f) => handleFileChange(slot.key, f)}
                        onReplace={() => fileRefs.current[slot.key]?.click()}
                      />
                    ))}
                  </div>
                </div>
              )}

              {submit.error && (
                <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                  {(submit.error as Error)?.message ?? 'Submission failed. Please try again.'}
                </p>
              )}

              <Button
                className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium"
                onClick={() => submit.mutate()}
                disabled={!allRequiredCovered || submit.isPending}
              >
                {submit.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</>
                ) : (
                  <><ArrowRight className="mr-2 h-4 w-4" /> {requiresMoreDocs ? 'Resubmit Documents' : 'Submit for Verification'}</>
                )}
              </Button>

              <p className="text-center text-xs text-slate-500">
                Front of ID, Back of ID, and Selfie are required for all users.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </RequireAuth>
  )
}

// ── Upload field component ──────────────────────────────────────────────────
function UploadField({
  slot,
  state,
  existingUrl,
  fileRef,
  onChange,
  onReplace,
}: {
  slot: UploadSlot
  state: UploadState[string] | undefined
  existingUrl?: string | null
  fileRef: (el: HTMLInputElement | null) => void
  onChange: (f: File) => void
  onReplace: () => void
}) {
  const Icon = slot.icon
  const activeUrl = state?.url || existingUrl
  const isImage = activeUrl && !activeUrl.includes('/raw/')
  const isExisting = !state?.url && !!existingUrl

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="text-sm font-medium text-white">{slot.label}</span>
          {slot.required && <span className="text-xs text-rose-400">*</span>}
        </div>
        {activeUrl && (
          <span className={`text-xs flex items-center gap-1 shrink-0 ${isExisting ? 'text-slate-400' : 'text-emerald-400'}`}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            {isExisting ? 'Previously submitted' : 'Uploaded'}
          </span>
        )}
      </div>
      <p className="mb-3 text-xs text-slate-500">{slot.hint}</p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f) }}
      />

      {activeUrl ? (
        <div className="flex items-center gap-3">
          {isImage ? (
            <div className="h-16 w-24 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={activeUrl} alt={slot.label} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex h-16 w-24 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-xs text-slate-400 shrink-0">
              PDF
            </div>
          )}
          <button onClick={onReplace} className="text-xs text-slate-400 hover:text-white underline">
            Replace
          </button>
        </div>
      ) : (
        <button
          onClick={onReplace}
          disabled={state?.uploading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/50 px-4 py-6 text-sm text-slate-400 hover:border-slate-600 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
        >
          {state?.uploading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
          ) : (
            <><Upload className="h-4 w-4" /> Click to upload</>
          )}
        </button>
      )}

      {state?.error && <p className="mt-1.5 text-xs text-rose-400">{state.error}</p>}
    </div>
  )
}
