'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Megaphone, Send, Users, Mail, Bell, CheckCircle2,
  Clock, ChevronDown, Search, X, AlertCircle, History,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminPageHeader, AdminPanel } from '@/components/admin/admin-shell'
import { adminService, type AdminUserRecord, type BroadcastLogRecord } from '@/lib/services/admin-service'

type TargetType = 'ALL' | 'ROLE' | 'USERS'
type Tab = 'compose' | 'history'

const ROLE_OPTIONS = [
  { value: 'TENANT', label: 'Tenants', desc: 'All tenants looking for properties' },
  { value: 'LANDLORD', label: 'Landlords', desc: 'All landlords with listings' },
  { value: 'AGENT', label: 'Agents', desc: 'All property agents' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
}

function TargetBadge({ type, meta }: { type: string; meta?: string | null }) {
  if (type === 'ALL') return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">All Users</span>
  if (type === 'ROLE') return <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">{meta}s Only</span>
  const count = meta ? meta.split(',').filter(Boolean).length : 0
  return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">{count} selected user{count !== 1 ? 's' : ''}</span>
}

// ── User picker ───────────────────────────────────────────────────────────
function UserPicker({ selected, onToggle }: { selected: Set<string>; onToggle: (u: AdminUserRecord) => void }) {
  const [search, setSearch] = useState('')
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users-picker'],
    queryFn: () => adminService.getUsers(),
  })

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
  })

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
      <div className="p-3 border-b border-slate-700 flex items-center gap-2">
        <Search className="h-4 w-4 text-slate-500 shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
        />
        {search && <button onClick={() => setSearch('')}><X className="h-3.5 w-3.5 text-slate-500" /></button>}
      </div>
      <div className="max-h-56 overflow-y-auto divide-y divide-slate-700/50">
        {isLoading ? (
          <p className="p-4 text-sm text-slate-500 text-center">Loading users…</p>
        ) : !filtered.length ? (
          <p className="p-4 text-sm text-slate-500 text-center">No users found.</p>
        ) : filtered.map((u) => {
          const checked = selected.has(u.id)
          return (
            <button
              key={u.id}
              onClick={() => onToggle(u)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-700/50 transition ${checked ? 'bg-blue-600/5' : ''}`}
            >
              <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition ${checked ? 'bg-blue-600 border-blue-600' : 'border-slate-600'}`}>
                {checked && <CheckCircle2 className="h-3 w-3 text-white" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{u.firstName} {u.lastName}</p>
                <p className="text-xs text-slate-500 truncate">{u.email} · {u.role}</p>
              </div>
            </button>
          )
        })}
      </div>
      {selected.size > 0 && (
        <div className="px-4 py-2 border-t border-slate-700 bg-slate-900/50 text-xs text-slate-400">
          {selected.size} user{selected.size !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function AdminBroadcastPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('compose')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [targetType, setTargetType] = useState<TargetType>('ALL')
  const [targetRole, setTargetRole] = useState('TENANT')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [lastResult, setLastResult] = useState<{ sent: number; failed: number } | null>(null)

  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['broadcast-history'],
    queryFn: () => adminService.getBroadcastHistory(),
  })

  const broadcast = useMutation({
    mutationFn: () => adminService.broadcast({
      subject: subject.trim(),
      message: message.trim(),
      targetType,
      targetRole: targetType === 'ROLE' ? targetRole : undefined,
      targetUserIds: targetType === 'USERS' ? Array.from(selectedUsers) : undefined,
    }),
    onSuccess: (data) => {
      setLastResult(data)
      setSubject('')
      setMessage('')
      setSelectedUsers(new Set())
      queryClient.invalidateQueries({ queryKey: ['broadcast-history'] })
    },
  })

  const toggleUser = (u: AdminUserRecord) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev)
      if (next.has(u.id)) next.delete(u.id); else next.add(u.id)
      return next
    })
  }

  const canSend = subject.trim().length > 0 && message.trim().length > 0 && !broadcast.isPending
    && (targetType !== 'USERS' || selectedUsers.size > 0)

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Communications"
        title="Broadcast Message"
        description="Send platform-wide memos or targeted messages. Delivered in-app and by email."
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800">
        {([['compose', Megaphone, 'Compose'], ['history', History, 'Sent History']] as const).map(([id, Icon, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
              tab === id ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {id === 'history' && history.length > 0 && (
              <span className="rounded-full bg-slate-700 px-1.5 py-0.5 text-xs text-slate-400">{history.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── COMPOSE TAB ──────────────────────────────────────────────────── */}
      {tab === 'compose' && (
        <div className="space-y-6">
          {/* Delivery info */}
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: Users, label: 'Targeted delivery', desc: 'All users, a role, or specific people' },
              { icon: Bell, label: 'In-app notification', desc: 'Appears in their notification panel instantly' },
              { icon: Mail, label: 'Email delivery', desc: 'Also sent to their registered email' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 flex gap-3 items-start">
                <div className="h-8 w-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Success banner */}
          {lastResult && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-emerald-300 font-medium">
                  Broadcast sent — <span className="font-bold">{lastResult.sent}</span> delivered
                  {lastResult.failed > 0 && <span className="text-amber-400">, {lastResult.failed} failed</span>}
                </p>
                <p className="text-xs text-emerald-500 mt-0.5">In-app notifications and emails dispatched.</p>
              </div>
            </div>
          )}

          <AdminPanel title="Compose Broadcast" description="Write a clear, concise message.">
            <div className="space-y-5 p-1">
              {/* Target selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Recipients</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    ['ALL', 'All Users', 'Every active non-admin account'],
                    ['ROLE', 'By Role', 'Tenants, Landlords, or Agents only'],
                    ['USERS', 'Specific Users', 'Hand-pick individual users'],
                  ] as const).map(([val, label, desc]) => (
                    <button
                      key={val}
                      onClick={() => setTargetType(val)}
                      className={`rounded-xl border-2 px-3 py-2.5 text-left transition ${
                        targetType === val
                          ? 'border-blue-500 bg-blue-600/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <p className={`text-xs font-semibold ${targetType === val ? 'text-blue-400' : 'text-white'}`}>{label}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{desc}</p>
                    </button>
                  ))}
                </div>

                {/* Role picker */}
                {targetType === 'ROLE' && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {ROLE_OPTIONS.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setTargetRole(r.value)}
                        className={`rounded-xl border-2 px-3 py-2 text-left transition ${
                          targetRole === r.value
                            ? 'border-violet-500 bg-violet-600/10'
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                        }`}
                      >
                        <p className={`text-xs font-semibold ${targetRole === r.value ? 'text-violet-400' : 'text-white'}`}>{r.label}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* User picker */}
                {targetType === 'USERS' && (
                  <div className="mt-2">
                    <UserPicker selected={selectedUsers} onToggle={toggleUser} />
                    {selectedUsers.size === 0 && (
                      <p className="text-xs text-amber-400 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" /> Select at least one user to send to.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Subject / Title</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. New Feature: Instant Booking Now Available"
                  maxLength={120}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500/50 transition"
                />
                <p className="text-xs text-slate-600">{subject.length}/120</p>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your platform update, announcement, or important notice here…"
                  rows={5}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500/50 resize-none transition"
                />
              </div>

              {/* Preview */}
              {(subject || message) && (
                <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Preview</p>
                  <div className="flex gap-3 items-start">
                    <div className="h-8 w-8 rounded-lg bg-blue-600/20 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <Megaphone className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{subject || '—'}</p>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{message || '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              {broadcast.error && (
                <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                  {(broadcast.error as Error)?.message ?? 'Failed to send. Please try again.'}
                </p>
              )}

              <div className="flex items-center gap-3 pt-1 border-t border-slate-800">
                <Button
                  className="h-10 bg-blue-600 hover:bg-blue-500 text-white px-6"
                  onClick={() => broadcast.mutate()}
                  disabled={!canSend}
                >
                  {broadcast.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sending…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Send{targetType === 'ALL' ? ' to All Users' : targetType === 'ROLE' ? ` to ${targetRole}s` : ` to ${selectedUsers.size} User${selectedUsers.size !== 1 ? 's' : ''}`}
                    </span>
                  )}
                </Button>
                <p className="text-xs text-slate-500">This cannot be undone.</p>
              </div>
            </div>
          </AdminPanel>
        </div>
      )}

      {/* ── HISTORY TAB ──────────────────────────────────────────────────── */}
      {tab === 'history' && (
        <AdminPanel title="Sent Broadcasts" description="Full history of all messages sent from this panel.">
          {historyLoading ? (
            <div className="py-8 text-center text-sm text-slate-500">Loading history…</div>
          ) : !history.length ? (
            <div className="py-10 text-center">
              <Megaphone className="mx-auto h-8 w-8 text-slate-700 mb-3" />
              <p className="text-sm text-slate-500">No broadcasts sent yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {history.map((log) => (
                <div key={log.id} className="py-4 px-1 space-y-2">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-white">{log.subject}</p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <Clock className="h-3 w-3" /> {formatDate(log.createdAt)}
                      </p>
                    </div>
                    <TargetBadge type={log.targetType} meta={log.targetMeta} />
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{log.message}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {log.sentCount} delivered
                    </span>
                    {log.failCount > 0 && (
                      <span className="text-rose-400 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" /> {log.failCount} failed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminPanel>
      )}
    </div>
  )
}
