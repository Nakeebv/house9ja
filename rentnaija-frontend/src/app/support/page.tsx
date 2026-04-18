'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Send, Plus, ChevronLeft, X, Loader2, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RequireAuth } from '@/components/auth/require-auth'
import { supportService, type SupportThread } from '@/lib/services/support-service'
import { useAuth } from '@/lib/auth-context'

const STATUS_STYLES: Record<string, string> = {
  OPEN:          'bg-amber-100 text-amber-700',
  PENDING_ADMIN: 'bg-amber-100 text-amber-700',
  PENDING_USER:  'bg-blue-100 text-blue-700',
  RESOLVED:      'bg-emerald-100 text-emerald-700',
  CLOSED:        'bg-slate-100 text-slate-500',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-500'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function SupportContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  const [activeId, setActiveId] = useState<string | null>(null)
  const [compose, setCompose] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [replyText, setReplyText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Pre-fill from email CTA ?new=1&subject=...
  useEffect(() => {
    const isNew = searchParams.get('new') === '1'
    const sub = searchParams.get('subject') ?? ''
    if (isNew) {
      setCompose(true)
      setNewSubject(sub)
    }
  }, [searchParams])

  const { data: threads = [], isLoading } = useQuery({
    queryKey: ['support-threads'],
    queryFn: () => supportService.getMyThreads(),
    refetchInterval: 8000,
  })

  const active = threads.find((t) => t.id === activeId) ?? null

  // Scroll to latest message whenever active thread changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [active?.messages.length, activeId])

  const createThread = useMutation({
    mutationFn: () => supportService.createThread(newSubject.trim(), newMessage.trim()),
    onSuccess: (thread) => {
      queryClient.invalidateQueries({ queryKey: ['support-threads'] })
      setCompose(false)
      setNewSubject('')
      setNewMessage('')
      setActiveId(thread.id)
    },
  })

  const sendReply = useMutation({
    mutationFn: (text: string) => supportService.reply(activeId!, text),
    onSuccess: () => {
      setReplyText('')
      queryClient.invalidateQueries({ queryKey: ['support-threads'] })
    },
  })

  const handleReplyKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && replyText.trim()) {
      e.preventDefault()
      sendReply.mutate(replyText)
    }
  }

  const unread = threads.filter((t) => t.status === 'PENDING_USER').length

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50">

      {/* ── Sidebar ── */}
      <aside className={`flex w-full flex-col border-r border-slate-200 bg-white sm:w-80 shrink-0 ${activeId && !compose ? 'hidden sm:flex' : 'flex'}`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
          <div>
            <h1 className="text-base font-bold text-slate-900">Support Inbox</h1>
            {unread > 0 && (
              <p className="text-xs text-blue-600 font-medium">{unread} new {unread === 1 ? 'reply' : 'replies'}</p>
            )}
          </div>
          <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            onClick={() => { setCompose(true); setActiveId(null) }}>
            <Plus className="h-3.5 w-3.5" /> New
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <Inbox className="h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">No conversations yet.<br />Start one to message our admin team.</p>
          </div>
        ) : (
          <ul className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {threads.map((thread) => {
              const last = thread.messages[thread.messages.length - 1]
              const isActive = thread.id === activeId
              const hasNewReply = thread.status === 'PENDING_USER'
              return (
                <li key={thread.id}>
                  <button
                    onClick={() => { setActiveId(thread.id); setCompose(false) }}
                    className={`w-full px-4 py-3.5 text-left transition hover:bg-slate-50 ${isActive ? 'bg-blue-50 border-r-2 border-blue-600' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium truncate ${hasNewReply ? 'text-blue-700' : 'text-slate-800'}`}>
                        {thread.subject}
                      </p>
                      <StatusBadge status={thread.status} />
                    </div>
                    {last && (
                      <p className="mt-0.5 text-xs text-slate-400 truncate">{last.sender.firstName}: {last.message}</p>
                    )}
                    <p className="mt-1 text-[10px] text-slate-400">{new Date(thread.updatedAt).toLocaleDateString()}</p>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </aside>

      {/* ── Main pane ── */}
      <main className="flex flex-1 flex-col overflow-hidden">

        {/* New thread compose */}
        {compose && (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-4">
              <button onClick={() => setCompose(false)} className="text-slate-400 hover:text-slate-700 sm:hidden">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="font-semibold text-slate-900">New Message to Admin</h2>
              <button onClick={() => setCompose(false)} className="ml-auto text-slate-400 hover:text-slate-700 hidden sm:block">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
                <input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="What's your message about?"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Describe your issue or question in detail…"
                  rows={8}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 resize-none"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white px-5 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCompose(false)}>Cancel</Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                onClick={() => createThread.mutate()}
                disabled={createThread.isPending || !newSubject.trim() || !newMessage.trim()}
              >
                {createThread.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                  : <><Send className="h-4 w-4" /> Send Message</>
                }
              </Button>
            </div>
          </div>
        )}

        {/* Active thread chat */}
        {!compose && active && (
          <div className="flex flex-col h-full">
            {/* Thread header */}
            <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-4">
              <button onClick={() => setActiveId(null)} className="text-slate-400 hover:text-slate-700 sm:hidden">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-slate-900 truncate">{active.subject}</h2>
                <p className="text-xs text-slate-500">Started {new Date(active.createdAt).toLocaleDateString()}</p>
              </div>
              <StatusBadge status={active.status} />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-slate-50">
              {active.messages.length === 0 && (
                <p className="text-center text-sm text-slate-400">No messages yet.</p>
              )}
              {active.messages.map((msg) => {
                const isMe = msg.sender.id === user?.id
                const initials = `${msg.sender.firstName[0]}${msg.sender.lastName[0]}`.toUpperCase()
                const isAdmin = msg.sender.role === 'ADMIN'
                return (
                  <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${isAdmin ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                      {initials}
                    </div>
                    <div className={`max-w-[75%] space-y-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'}`}>
                        {msg.message}
                      </div>
                      <p className="text-[10px] text-slate-400 px-1">
                        {isAdmin ? 'Admin · ' : ''}{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Reply bar */}
            {active.status !== 'CLOSED' ? (
              <div className="border-t border-slate-200 bg-white px-4 py-3 flex gap-3 items-end">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={handleReplyKey}
                  placeholder="Type a reply… (Enter to send)"
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                />
                <Button
                  className="h-10 w-10 p-0 shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => replyText.trim() && sendReply.mutate(replyText)}
                  disabled={sendReply.isPending || !replyText.trim()}
                >
                  {sendReply.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            ) : (
              <div className="border-t border-slate-200 bg-white px-5 py-3 text-center text-sm text-slate-400">
                This conversation has been closed.
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!compose && !active && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-6 hidden sm:flex">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100">
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Your messages with admin</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-xs">Select a conversation on the left, or start a new one to reach our support team directly.</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              onClick={() => setCompose(true)}>
              <Plus className="h-4 w-4" /> New Message
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}

export default function SupportPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin mr-2" />Loading…</div>}>
        <SupportContent />
      </Suspense>
    </RequireAuth>
  )
}
