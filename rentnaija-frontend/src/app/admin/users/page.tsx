'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, UserX, UserCheck, Users, Bell, Send, ShieldAlert, X, BadgeCheck, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminPageHeader, AdminTag } from '@/components/admin/admin-shell'
import { adminService } from '@/lib/services/admin-service'

interface AdminUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  isVerified: boolean
  isVerifiedLandlord: boolean
  isBlocked: boolean
  avatarUrl: string | null
  createdAt: string
}

const ROLE_COLORS: Record<string, string> = {
  TENANT:   'from-indigo-500 to-blue-600',
  LANDLORD: 'from-emerald-500 to-teal-600',
  AGENT:    'from-amber-500 to-orange-500',
  ADMIN:    'from-rose-500 to-pink-600',
}

type RoleFilter = '' | 'TENANT' | 'LANDLORD' | 'AGENT'
type StatusFilter = '' | 'active' | 'suspended'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [messageTarget, setMessageTarget] = useState<AdminUser | null>(null)
  const [messageText, setMessageText] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [flash, setFlash] = useState<Record<string, string>>({})
  const queryClient = useQueryClient()

  const setFlashFor = (key: string, msg: string) => {
    setFlash((p) => ({ ...p, [key]: msg }))
    setTimeout(() => setFlash((p) => { const n = { ...p }; delete n[key]; return n }), 4000)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', roleFilter, statusFilter],
    queryFn: () => adminService.getUsers({ role: roleFilter || undefined, status: statusFilter || undefined }) as Promise<AdminUser[]>,
  })

  const suspend = useMutation({
    mutationFn: (id: string) => adminService.suspendUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })
  const unsuspend = useMutation({
    mutationFn: (id: string) => adminService.unsuspendUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })
  const pushVerification = useMutation({
    mutationFn: (id: string) => adminService.pushVerificationReminder(id),
    onSuccess: (_, id) => setFlashFor(`verify:${id}`, 'Reminder sent!'),
  })
  const markVerified = useMutation({
    mutationFn: (id: string) => adminService.markUserVerified(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })
  const sendMessage = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) => adminService.sendMessageToUser(id, message),
    onSuccess: (_, { id }) => {
      setFlashFor(`msg:${id}`, 'Message sent!')
      setMessageTarget(null)
      setMessageText('')
    },
  })
  const deleteUser = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => adminService.deleteUser(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setDeleteTarget(null)
      setDeleteReason('')
    },
  })

  const users = data ?? []
  const filtered = useMemo(
    () => users.filter((u) =>
      [`${u.firstName} ${u.lastName}`, u.email, u.phone].join(' ').toLowerCase().includes(search.toLowerCase()),
    ),
    [users, search],
  )

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Operations"
        title="User Management"
        description="Search, verify, suspend, delete, and monitor all platform accounts."
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="h-11 border-slate-800 bg-slate-900 pl-11 text-white placeholder:text-slate-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['', 'TENANT', 'LANDLORD', 'AGENT'] as RoleFilter[]).map((role) => (
            <button key={role} onClick={() => setRoleFilter(role)}
              className={`rounded-full px-4 py-2 text-xs font-medium transition ${roleFilter === role ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
              {role === '' ? 'All Roles' : role.charAt(0) + role.slice(1).toLowerCase()}
            </button>
          ))}
          <div className="w-px bg-slate-700 mx-1" />
          {([['', 'All'], ['active', 'Active'], ['suspended', 'Suspended']] as [StatusFilter, string][]).map(([val, label]) => (
            <button key={val} onClick={() => setStatusFilter(val)}
              className={`rounded-full px-4 py-2 text-xs font-medium transition ${statusFilter === val ? (val === 'suspended' ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white') : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map((i) => <div key={i} className="h-56 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 py-16 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-slate-600" />
          <p className="text-slate-400">No users match the current filter.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((user) => {
            const isSuspended = !!user.isBlocked
            const gradient = ROLE_COLORS[user.role] ?? 'from-slate-500 to-slate-700'
            const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
            const isAdmin = user.role === 'ADMIN'

            return (
              <div key={user.id} className={`rounded-2xl border bg-slate-900/60 p-4 transition ${isSuspended ? 'border-rose-500/20 opacity-60' : 'border-slate-800 hover:border-slate-700'}`}>

                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
                    {user.avatarUrl ? (
                      <Image src={user.avatarUrl} alt={user.firstName} fill className="object-cover" sizes="44px" />
                    ) : (
                      <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient} text-sm font-bold text-white`}>{initials}</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="truncate font-semibold text-white">{user.firstName} {user.lastName}</p>
                      {user.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-blue-400" />}
                      {isSuspended && <span className="shrink-0 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-400">Suspended</span>}
                    </div>
                    <p className="truncate text-xs text-slate-400">{user.email}</p>
                    <p className="text-xs text-slate-500">{user.phone}</p>
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <AdminTag tone={isAdmin ? 'danger' : user.role === 'LANDLORD' ? 'success' : user.role === 'AGENT' ? 'warning' : 'info'}>
                      {user.role}
                    </AdminTag>
                    {user.isVerifiedLandlord && <AdminTag tone="success">Doc Verified</AdminTag>}
                  </div>
                  <p className="text-xs text-slate-600 shrink-0">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>

                {/* Flash feedback */}
                {(flash[`verify:${user.id}`] || flash[`msg:${user.id}`]) && (
                  <p className="mt-2 text-xs text-emerald-400">{flash[`verify:${user.id}`] ?? flash[`msg:${user.id}`]}</p>
                )}

                {/* Actions */}
                {!isAdmin && (
                  <div className="mt-3 border-t border-slate-800 pt-3 space-y-2">
                    {/* Suspend / Reinstate */}
                    {isSuspended ? (
                      <Button size="sm" className="h-8 w-full bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 border border-emerald-500/20"
                        onClick={() => unsuspend.mutate(user.id)} disabled={unsuspend.isPending}>
                        <UserCheck className="mr-1.5 h-3.5 w-3.5" /> Reinstate Account
                      </Button>
                    ) : (
                      <Button size="sm" className="h-8 w-full bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                        onClick={() => suspend.mutate(user.id)} disabled={suspend.isPending}>
                        <UserX className="mr-1.5 h-3.5 w-3.5" /> Suspend Account
                      </Button>
                    )}

                    {/* Mark Verified (blue tick) */}
                    {!user.isVerified ? (
                      <Button size="sm" className="h-8 w-full border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                        onClick={() => markVerified.mutate(user.id)} disabled={markVerified.isPending}>
                        <BadgeCheck className="mr-1.5 h-3.5 w-3.5" /> Mark Verified
                      </Button>
                    ) : (
                      <div className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-blue-500/20 bg-blue-500/5 text-xs text-blue-400">
                        <BadgeCheck className="h-3.5 w-3.5" /> Verified Account
                      </div>
                    )}

                    {/* Push Verification reminder */}
                    <Button size="sm"
                      className={`h-8 w-full border ${flash[`verify:${user.id}`] ? 'border-slate-700 bg-slate-800 text-slate-500' : 'border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'}`}
                      onClick={() => pushVerification.mutate(user.id)}
                      disabled={pushVerification.isPending || !!flash[`verify:${user.id}`]}>
                      <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
                      {flash[`verify:${user.id}`] ? 'Reminder Sent' : 'Push Verification'}
                    </Button>

                    {/* Send Message */}
                    <Button size="sm" className="h-8 w-full border border-slate-600/30 bg-slate-700/30 text-slate-300 hover:bg-slate-700/60"
                      onClick={() => { setMessageTarget(user); setMessageText('') }}>
                      <Send className="mr-1.5 h-3.5 w-3.5" /> Send Message
                    </Button>

                    {/* Delete Account */}
                    <Button size="sm" className="h-8 w-full border border-red-900/40 bg-red-950/30 text-red-400 hover:bg-red-950/60"
                      onClick={() => { setDeleteTarget(user); setDeleteReason('') }}>
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete Account
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Send Message modal */}
      {messageTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0e1927] p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4 gap-3">
              <div>
                <h3 className="font-semibold text-white">Send Message to User</h3>
                <p className="mt-0.5 text-sm text-slate-400">{messageTarget.firstName} {messageTarget.lastName} · {messageTarget.email}</p>
              </div>
              <button onClick={() => setMessageTarget(null)} className="text-slate-500 hover:text-white shrink-0 mt-0.5"><X className="h-5 w-5" /></button>
            </div>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message to this user…"
              rows={4}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500/50 resize-none"
            />
            <div className="mt-4 flex gap-3 justify-end">
              <Button variant="outline" className="border-slate-700 text-slate-400" onClick={() => setMessageTarget(null)}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-500 text-white"
                onClick={() => messageText.trim() && sendMessage.mutate({ id: messageTarget.id, message: messageText })}
                disabled={sendMessage.isPending || !messageText.trim()}>
                <Bell className="mr-1.5 h-4 w-4" />
                {sendMessage.isPending ? 'Sending…' : 'Send & Notify'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-900/50 bg-[#0e1927] p-6 shadow-2xl">
            <div className="flex items-start gap-3 mb-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-950 border border-red-800">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Delete Account Permanently</h3>
                <p className="mt-1 text-sm text-slate-400">
                  You are about to permanently delete <span className="font-medium text-white">{deleteTarget.firstName} {deleteTarget.lastName}</span>'s account.
                  This action cannot be undone. The user will be notified by email.
                </p>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="text-slate-500 hover:text-white shrink-0 mt-0.5"><X className="h-5 w-5" /></button>
            </div>

            <div className="mb-5 rounded-xl border border-red-900/30 bg-red-950/20 px-4 py-3">
              <p className="text-xs text-red-400 font-medium mb-1">Account details</p>
              <p className="text-sm text-white">{deleteTarget.email}</p>
              <p className="text-xs text-slate-500">{deleteTarget.role} · Joined {new Date(deleteTarget.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Reason for deletion <span className="text-slate-500">(optional — included in the notification email)</span>
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="e.g. Fraudulent listing activity, repeated Terms & Conditions violations…"
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-red-500/50 resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" className="border-slate-700 text-slate-400" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                className="bg-red-700 hover:bg-red-600 text-white"
                onClick={() => deleteUser.mutate({ id: deleteTarget.id, reason: deleteReason.trim() || undefined })}
                disabled={deleteUser.isPending}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                {deleteUser.isPending ? 'Deleting…' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
