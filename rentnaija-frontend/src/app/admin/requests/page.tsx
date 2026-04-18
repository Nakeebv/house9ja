'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminPageHeader, AdminTag } from '@/components/admin/admin-shell'
import { adminService, type AdminRequestRecord } from '@/lib/services/admin-service'

const STATUS_TONE: Record<string, 'warning' | 'info' | 'success' | 'default'> = {
  OPEN: 'warning',
  PENDING_ADMIN: 'warning',
  PENDING_USER: 'info',
  RESOLVED: 'success',
  CLOSED: 'default',
}

export default function AdminRequestsPage() {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const queryClient = useQueryClient()

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: () => adminService.getRequests(),
  })

  const reply = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) => adminService.replyToRequest(id, message),
    onSuccess: (_, { id }) => {
      setReplyText((prev) => ({ ...prev, [id]: '' }))
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] })
    },
  })

  const close = useMutation({
    mutationFn: (id: string) => adminService.closeRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-requests'] }),
  })

  const open = requests.filter((r) => r.status === 'OPEN' || r.status === 'PENDING_ADMIN')
  const other = requests.filter((r) => r.status !== 'OPEN' && r.status !== 'PENDING_ADMIN')

  function renderThread(req: AdminRequestRecord) {
    const isOpen = expanded === req.id
    return (
      <div key={req.id} className="rounded-3xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <button
          onClick={() => setExpanded(isOpen ? null : req.id)}
          className="w-full flex items-start gap-4 p-5 text-left hover:bg-white/[0.02] transition"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-white">{req.subject}</span>
              <AdminTag tone={STATUS_TONE[req.status] ?? 'default'}>{req.status.replace('_', ' ')}</AdminTag>
              <span className="text-xs text-slate-500 bg-slate-800 rounded-full px-2 py-0.5">{req.type}</span>
            </div>
            <div className="mt-1 text-xs text-slate-400">
              From: {req.user.firstName} {req.user.lastName} ({req.user.email}) · {new Date(req.createdAt).toLocaleDateString()}
            </div>
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4 text-slate-500 shrink-0 mt-1" /> : <ChevronDown className="h-4 w-4 text-slate-500 shrink-0 mt-1" />}
        </button>

        {isOpen && (
          <div className="border-t border-slate-800 p-5 space-y-4">
            {/* Messages */}
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {req.messages.map((msg) => {
                const isAdmin = msg.sender.role === 'ADMIN'
                return (
                  <div key={msg.id} className={`flex gap-3 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isAdmin ? 'bg-emerald-600/20 text-emerald-400' : 'bg-blue-600/20 text-blue-400'}`}>
                      {msg.sender.firstName[0]}{msg.sender.lastName[0]}
                    </div>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${isAdmin ? 'bg-emerald-600/10 text-emerald-100 rounded-tr-sm' : 'bg-slate-800 text-slate-200 rounded-tl-sm'}`}>
                      <p>{msg.message}</p>
                      <p className="text-[10px] opacity-50 mt-1">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Reply input */}
            {req.status !== 'CLOSED' && (
              <div className="flex gap-2">
                <input
                  value={replyText[req.id] ?? ''}
                  onChange={(e) => setReplyText((prev) => ({ ...prev, [req.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && replyText[req.id]?.trim()) {
                      e.preventDefault()
                      reply.mutate({ id: req.id, message: replyText[req.id] })
                    }
                  }}
                  placeholder="Reply to user…"
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500/50"
                />
                <Button
                  size="sm"
                  className="h-10 w-10 p-0 bg-emerald-600 hover:bg-emerald-500"
                  onClick={() => replyText[req.id]?.trim() && reply.mutate({ id: req.id, message: replyText[req.id] })}
                  disabled={reply.isPending || !replyText[req.id]?.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 border-slate-700 text-slate-400 hover:text-white"
                  onClick={() => close.mutate(req.id)}
                  disabled={close.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Support"
        title="Admin Requests"
        description="Threaded conversations between users and admin. Reply or close each request."
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />)}
        </div>
      ) : !requests.length ? (
        <div className="rounded-2xl border border-dashed border-slate-700 py-16 text-center">
          <p className="text-slate-400">No admin requests yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {open.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 px-1">Awaiting Response ({open.length})</p>
              {open.map(renderThread)}
            </div>
          )}
          {other.length > 0 && (
            <div className="space-y-3 mt-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 px-1">Closed / Resolved ({other.length})</p>
              {other.map(renderThread)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
