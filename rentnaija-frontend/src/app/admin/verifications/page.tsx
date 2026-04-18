'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, ZoomIn, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminPageHeader, AdminPanel, AdminTag } from '@/components/admin/admin-shell'
import { adminService, type AdminVerificationRecord } from '@/lib/services/admin-service'

type DocEntry = { label: string; url: string }
type LightboxState = { docs: DocEntry[]; index: number } | null
type DocAction = { docId: string; name: string } | null

// ── Inline document thumbnail that opens a lightbox ───────────────────────
function DocThumb({ label, url, onClick }: { label: string; url: string; onClick: () => void }) {
  const isPdf = url.includes('/raw/')
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/60 p-2 hover:border-blue-500/50 hover:bg-slate-800 transition w-28 shrink-0"
    >
      <div className="relative h-20 w-full overflow-hidden rounded-lg bg-slate-900">
        {isPdf ? (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">PDF</div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
          <ZoomIn className="h-5 w-5 text-white" />
        </div>
      </div>
      <span className="text-[10px] text-slate-400 text-center leading-tight">{label}</span>
    </button>
  )
}

// ── Lightbox modal ────────────────────────────────────────────────────────
function Lightbox({ state, onClose, onNav }: { state: LightboxState; onClose: () => void; onNav: (i: number) => void }) {
  if (!state) return null
  const { docs, index } = state
  const current = docs[index]
  const isPdf = current.url.includes('/raw/')

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <p className="text-sm font-medium text-white">{current.label}</p>
            <p className="text-xs text-slate-400">{index + 1} / {docs.length}</p>
          </div>
          <div className="flex items-center gap-2">
            <a href={current.url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition"
              onClick={(e) => e.stopPropagation()}>
              <ExternalLink className="h-3.5 w-3.5" /> Open original
            </a>
            <button onClick={onClose} className="rounded-lg bg-slate-800 border border-slate-700 p-1.5 text-slate-400 hover:text-white transition">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center min-h-64 max-h-[70vh]">
          {isPdf ? (
            <div className="p-8 text-center">
              <p className="text-slate-400 mb-3">PDF Document</p>
              <a href={current.url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500">
                <ExternalLink className="h-4 w-4" /> Open PDF in new tab
              </a>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.url} alt={current.label} className="max-h-[70vh] w-full object-contain" />
          )}
        </div>

        {/* Nav arrows */}
        {docs.length > 1 && (
          <div className="flex justify-center gap-3 mt-3">
            {docs.map((d, i) => (
              <button key={i} onClick={() => onNav(i)}
                className={`h-2 w-2 rounded-full transition ${i === index ? 'bg-white' : 'bg-slate-600 hover:bg-slate-400'}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function AdminVerificationsPage() {
  const queryClient = useQueryClient()
  const [lightbox, setLightbox] = useState<LightboxState>(null)
  const [requestDocsTarget, setRequestDocsTarget] = useState<DocAction>(null)
  const [requestDocsMsg, setRequestDocsMsg] = useState('')
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data: verifications = [], isLoading } = useQuery({
    queryKey: ['admin-verifications'],
    queryFn: () => adminService.getVerifications(),
  })

  const approve = useMutation({
    mutationFn: (id: string) => adminService.updateVerification(id, 'APPROVED'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-verifications'] }),
  })

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminService.updateVerification(id, 'REJECTED', reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] })
      setRejectTarget(null)
      setRejectReason('')
    },
  })

  const requestDocs = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      adminService.requestMoreDocuments(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] })
      setRequestDocsTarget(null)
      setRequestDocsMsg('')
    },
  })

  function getDocEntries(v: AdminVerificationRecord): DocEntry[] {
    const entries: DocEntry[] = []
    if (v.governmentIdUrl) entries.push({ label: 'Front of ID', url: v.governmentIdUrl })
    if (v.backOfIdUrl) entries.push({ label: 'Back of ID', url: v.backOfIdUrl })
    if (v.selfieWithIdUrl) entries.push({ label: 'Selfie with ID', url: v.selfieWithIdUrl })
    if (v.proofOfOwnershipUrl) entries.push({ label: 'Proof of Ownership', url: v.proofOfOwnershipUrl })
    if (v.utilityBillUrl) entries.push({ label: 'Utility Bill', url: v.utilityBillUrl })
    return entries
  }

  function openLightbox(v: AdminVerificationRecord, startIndex = 0) {
    const docs = getDocEntries(v)
    if (docs.length) setLightbox({ docs, index: startIndex })
  }

  const pending = verifications.filter((v) => v.status === 'PENDING')
  const reviewed = verifications.filter((v) => v.status !== 'PENDING')

  function VerificationCard({ v, showActions }: { v: AdminVerificationRecord; showActions: boolean }) {
    const docs = getDocEntries(v)
    return (
      <div className={`rounded-3xl border p-5 ${showActions ? 'border-amber-500/20 bg-slate-900/50' : 'border-slate-800 bg-slate-900/30'}`}>
        <div className="flex flex-col gap-4">
          {/* User info + status */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="text-base font-semibold text-white">{v.landlord.firstName} {v.landlord.lastName}</div>
              <div className="text-sm text-slate-400">{v.landlord.email}</div>
              <div className="text-xs text-slate-500 mt-0.5">{v.landlord.phone} · Submitted {new Date(v.createdAt).toLocaleDateString()}</div>
            </div>
            <AdminTag tone={v.status === 'PENDING' ? 'warning' : v.status === 'APPROVED' ? 'success' : 'danger'}>
              {v.status}
            </AdminTag>
          </div>

          {/* Document thumbnails */}
          {docs.length > 0 ? (
            <div>
              <p className="text-xs text-slate-500 mb-2">{docs.length} document{docs.length !== 1 ? 's' : ''} submitted — click to preview</p>
              <div className="flex gap-2 flex-wrap">
                {docs.map((doc, i) => (
                  <DocThumb key={i} label={doc.label} url={doc.url} onClick={() => openLightbox(v, i)} />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No documents attached.</p>
          )}

          {/* Rejection reason */}
          {v.rejectionReason && (
            <div className="rounded-xl bg-rose-500/5 border border-rose-500/15 px-3 py-2 text-xs text-rose-400">
              Admin note: {v.rejectionReason}
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800">
              <Button size="sm" className="h-8 bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                onClick={() => approve.mutate(v.id)} disabled={approve.isPending}>
                ✓ Approve
              </Button>
              <Button size="sm" variant="outline" className="h-8 border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                onClick={() => { setRejectTarget({ id: v.id, name: `${v.landlord.firstName} ${v.landlord.lastName}` }); setRejectReason('') }}>
                ✗ Reject
              </Button>
              <Button size="sm" variant="outline" className="h-8 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                onClick={() => { setRequestDocsTarget({ docId: v.id, name: `${v.landlord.firstName} ${v.landlord.lastName}` }); setRequestDocsMsg('') }}>
                📋 Request More Docs
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Trust"
        title="Verification Queue"
        description="Review submitted documents — click thumbnails to preview, then approve, reject, or request more."
      />

      <AdminPanel title={`Pending Review (${pending.length})`} description="Awaiting your decision.">
        {isLoading ? (
          <div className="rounded-2xl bg-slate-900/60 px-4 py-4 text-sm text-slate-400">Loading…</div>
        ) : !pending.length ? (
          <div className="rounded-2xl bg-slate-900/60 px-4 py-6 text-sm text-slate-400 text-center">No pending submissions. Queue is clear.</div>
        ) : (
          <div className="grid gap-4">{pending.map((v) => <VerificationCard key={v.id} v={v} showActions />)}</div>
        )}
      </AdminPanel>

      {reviewed.length > 0 && (
        <AdminPanel title={`Reviewed (${reviewed.length})`} description="Previously actioned submissions.">
          <div className="grid gap-4">{reviewed.map((v) => <VerificationCard key={v.id} v={v} showActions={false} />)}</div>
        </AdminPanel>
      )}

      {/* Lightbox */}
      <Lightbox
        state={lightbox}
        onClose={() => setLightbox(null)}
        onNav={(i) => setLightbox((p) => p ? { ...p, index: i } : null)}
      />

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0e1927] p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4 gap-3">
              <div>
                <h3 className="font-semibold text-white">Reject Verification</h3>
                <p className="mt-0.5 text-sm text-slate-400">{rejectTarget.name}</p>
              </div>
              <button onClick={() => setRejectTarget(null)} className="text-slate-500 hover:text-white shrink-0"><X className="h-5 w-5" /></button>
            </div>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection — this will be shown to the user…"
              rows={3}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-rose-500/50 resize-none" />
            <div className="mt-4 flex gap-3 justify-end">
              <Button variant="outline" className="border-slate-700 text-slate-400" onClick={() => setRejectTarget(null)}>Cancel</Button>
              <Button className="bg-rose-600 hover:bg-rose-500 text-white"
                onClick={() => rejectReason.trim() && reject.mutate({ id: rejectTarget.id, reason: rejectReason })}
                disabled={reject.isPending || !rejectReason.trim()}>
                {reject.isPending ? 'Rejecting…' : 'Reject & Notify'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Request More Documents modal */}
      {requestDocsTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0e1927] p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4 gap-3">
              <div>
                <h3 className="font-semibold text-white">Request More Documents</h3>
                <p className="mt-0.5 text-sm text-slate-400">From: {requestDocsTarget.name}</p>
              </div>
              <button onClick={() => setRequestDocsTarget(null)} className="text-slate-500 hover:text-white shrink-0"><X className="h-5 w-5" /></button>
            </div>
            <textarea value={requestDocsMsg} onChange={(e) => setRequestDocsMsg(e.target.value)}
              placeholder="Describe exactly what documents or clarification is needed…"
              rows={4}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500/50 resize-none" />
            <div className="mt-4 flex gap-3 justify-end">
              <Button variant="outline" className="border-slate-700 text-slate-400" onClick={() => setRequestDocsTarget(null)}>Cancel</Button>
              <Button className="bg-amber-500 hover:bg-amber-400 text-slate-950"
                onClick={() => requestDocsMsg.trim() && requestDocs.mutate({ id: requestDocsTarget.docId, message: requestDocsMsg })}
                disabled={requestDocs.isPending || !requestDocsMsg.trim()}>
                {requestDocs.isPending ? 'Sending…' : 'Send Request'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
