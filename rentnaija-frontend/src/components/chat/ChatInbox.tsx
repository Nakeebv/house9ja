'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Send, MapPin, MoreVertical, Phone, MessageSquare,
  Paperclip, Check, CheckCheck, ArrowLeft, X, FileText, Film,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/cn'
import { chatService } from '@/lib/services/chat-service'
import type { ChatConversation, ChatMessage } from '@/types'
import { io, Socket } from 'socket.io-client'

export type { ChatConversation as Conversation }

type MessageType = 'TEXT' | 'IMAGE' | 'AUDIO' | 'PDF' | 'VIDEO'

const ALLOWED_TYPES: Record<string, MessageType> = {
  'image/jpeg': 'IMAGE',
  'image/png': 'IMAGE',
  'image/webp': 'IMAGE',
  'image/gif': 'IMAGE',
  'audio/mpeg': 'AUDIO',
  'audio/ogg': 'AUDIO',
  'audio/wav': 'AUDIO',
  'audio/webm': 'AUDIO',
  'application/pdf': 'PDF',
  'video/mp4': 'VIDEO',
  'video/webm': 'VIDEO',
}
const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB

function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?'
}

function getOtherParty(conv: ChatConversation, currentUserId: string) {
  return conv.tenantId === currentUserId ? conv.landlord : conv.tenant
}

// ─── Socket singleton ─────────────────────────────────────────────────────────
let socketInstance: Socket | null = null

function getSocket(token: string): Socket {
  if (!socketInstance || !socketInstance.connected) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'
    socketInstance = io(`${wsUrl}/chat`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
  }
  return socketInstance
}

// ─── Cloudinary XHR upload with progress ─────────────────────────────────────
function uploadToCloudinary(
  file: File,
  onProgress: (pct: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    if (!cloudName || !uploadPreset) {
      reject(new Error('Cloudinary not configured'))
      return
    }

    const form = new FormData()
    form.append('file', file)
    form.append('upload_preset', uploadPreset)
    form.append('folder', 'chat')

    const xhr = new XMLHttpRequest()
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    })
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const payload = JSON.parse(xhr.responseText)
        resolve(payload.secure_url as string)
      } else {
        const payload = JSON.parse(xhr.responseText)
        reject(new Error(payload?.error?.message ?? 'Upload failed'))
      }
    })
    xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`)
    xhr.send(form)
  })
}

// ─── Preview state ────────────────────────────────────────────────────────────
type PendingFile = {
  file: File
  type: MessageType
  objectUrl: string // for image/video preview; empty for pdf/audio
  name: string
}

// ─── Component ────────────────────────────────────────────────────────────────
type ChatInboxProps = {
  conversations: ChatConversation[]
  currentUserId: string
  token: string
}

type SeenMap = Record<string, boolean>

export function ChatInbox({ conversations, currentUserId, token }: ChatInboxProps) {
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [inputText, setInputText] = useState('')
  const [typingUserId, setTypingUserId] = useState<string | null>(null)
  const [seenMap, setSeenMap] = useState<SeenMap>({})
  const [uploadPct, setUploadPct] = useState<number | null>(null)
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeChat = conversations.find((c) => c.id === activeChatId)
  const otherParty = activeChat ? getOtherParty(activeChat, currentUserId) : null

  const handleSelectChat = (id: string) => {
    setActiveChatId(id)
    setMobileView('chat')
  }

  const showError = (msg: string) => {
    setSendError(msg)
    setTimeout(() => setSendError(null), 5000)
  }

  // ── Connect socket ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return
    const socket = getSocket(token)
    socketRef.current = socket

    socket.on('new_message', (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      if (msg.chatId === activeChatId && msg.senderId !== currentUserId) {
        socket.emit('mark_seen', { chatId: msg.chatId, messageId: msg.id })
      }
    })

    socket.on('user_typing', ({ userId }: { userId: string }) => {
      if (userId !== currentUserId) {
        setTypingUserId(userId)
        setTimeout(() => setTypingUserId(null), 2500)
      }
    })

    socket.on('messages_seen', ({ chatId, seenBy }: { chatId: string; seenBy: string }) => {
      if (seenBy !== currentUserId) {
        setSeenMap((prev) => {
          const updated = { ...prev }
          messages.forEach((m) => {
            if (m.chatId === chatId && m.senderId === currentUserId) {
              updated[m.id] = true
            }
          })
          return updated
        })
      }
    })

    socket.on('message_error', ({ message }: { message: string }) => showError(message))

    return () => {
      socket.off('new_message')
      socket.off('user_typing')
      socket.off('messages_seen')
      socket.off('message_error')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, currentUserId])

  // ── Join/leave chat room ───────────────────────────────────────────────────
  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !activeChatId) return
    socket.emit('join_chat', activeChatId)
    if (messages.length > 0) socket.emit('mark_seen', { chatId: activeChatId })
    return () => { socket.emit('leave_chat', activeChatId) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId])

  // ── Fetch messages ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeChatId) return
    setLoadingMessages(true)
    chatService
      .getMessages(activeChatId)
      .then(({ messages: msgs }) => {
        setMessages(msgs)
        socketRef.current?.emit('mark_seen', { chatId: activeChatId })
      })
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false))
  }, [activeChatId])

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Cleanup object URL on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (pendingFile?.objectUrl) URL.revokeObjectURL(pendingFile.objectUrl)
    }
  }, [pendingFile])

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeChatId) return

    // If there's a pending file, upload and send it
    if (pendingFile) {
      setUploadPct(0)
      try {
        const mediaUrl = await uploadToCloudinary(pendingFile.file, setUploadPct)
        const contentLabel =
          pendingFile.type === 'IMAGE' ? '📷 Image'
          : pendingFile.type === 'VIDEO' ? '🎬 Video'
          : pendingFile.type === 'PDF' ? '📄 Document'
          : '🎵 Audio'
        const socket = socketRef.current
        if (socket?.connected) {
          socket.emit('send_message', {
            chatId: activeChatId,
            content: contentLabel,
            type: pendingFile.type,
            mediaUrl,
          })
        } else {
          const msg = await chatService.sendMessage(activeChatId, contentLabel, pendingFile.type, mediaUrl)
          setMessages((prev) => [...prev, msg])
        }
        if (pendingFile.objectUrl) URL.revokeObjectURL(pendingFile.objectUrl)
        setPendingFile(null)
      } catch (err: any) {
        showError(err?.message ?? 'Upload failed. Please try again.')
      } finally {
        setUploadPct(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
      return
    }

    if (!inputText.trim()) return
    const text = inputText.trim()
    setInputText('')
    const socket = socketRef.current
    if (socket?.connected) {
      socket.emit('send_message', { chatId: activeChatId, content: text, type: 'TEXT' })
    } else {
      try {
        const msg = await chatService.sendMessage(activeChatId, text)
        setMessages((prev) => [...prev, msg])
      } catch {
        setInputText(text)
      }
    }
  }, [inputText, activeChatId, pendingFile])

  const handleTyping = useCallback(() => {
    if (!activeChatId || !socketRef.current?.connected) return
    socketRef.current.emit('typing', activeChatId)
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit('stop_typing', activeChatId)
    }, 2000)
  }, [activeChatId])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const type = ALLOWED_TYPES[file.type]
    if (!type) {
      showError('File type not supported. Use JPG, PNG, WebP, GIF, MP3, WAV, PDF, or MP4.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      showError('File too large. Maximum size is 10 MB.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const objectUrl = (type === 'IMAGE' || type === 'VIDEO') ? URL.createObjectURL(file) : ''
    setPendingFile({ file, type, objectUrl, name: file.name })
  }, [])

  const cancelPendingFile = () => {
    if (pendingFile?.objectUrl) URL.revokeObjectURL(pendingFile.objectUrl)
    setPendingFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const getMessageStatus = (msg: ChatMessage) => {
    if (msg.senderId !== currentUserId) return null
    if (seenMap[msg.id]) return 'seen'
    return 'delivered'
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] w-full overflow-hidden rounded-2xl bg-[#0e1927]/80 shadow-2xl border border-white/8">

      {/* ── Conversation List ─────────────────────────────────────────────── */}
      <div className={cn(
        'flex-col border-r border-white/8 bg-black/15',
        'md:flex md:w-72 md:shrink-0',
        mobileView === 'list' ? 'flex w-full' : 'hidden',
      )}>
        <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3.5">
          <MessageSquare className="h-4 w-4 text-blue-400" />
          <h2 className="font-semibold text-white text-sm">Messages</h2>
          <span className="ml-auto text-xs text-slate-400">{conversations.length}</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500 p-8">
              <MessageSquare className="h-10 w-10 opacity-20" />
              <p className="text-sm text-center">No conversations yet.</p>
            </div>
          )}
          {conversations.map((chat) => {
            const other = getOtherParty(chat, currentUserId)
            const lastMsg = chat.messages?.[0]
            const isActive = activeChatId === chat.id
            return (
              <button
                key={chat.id}
                onClick={() => handleSelectChat(chat.id)}
                className={cn(
                  'w-full text-left px-4 py-3.5 border-b border-white/5 transition-colors flex gap-3 items-start',
                  isActive ? 'bg-blue-600/15 border-l-2 border-l-blue-500' : 'hover:bg-white/5',
                )}
              >
                <Avatar className="h-10 w-10 shrink-0 border border-white/10">
                  <AvatarFallback className="bg-blue-900/50 text-blue-200 text-xs font-semibold">
                    {getInitials(other.firstName, other.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="font-medium text-slate-100 text-sm truncate">
                      {other.firstName} {other.lastName}
                    </span>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap shrink-0">
                      {lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-400/80 font-medium truncate mt-0.5">{chat.property.title}</p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{lastMsg?.content ?? 'No messages yet'}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Chat Window ───────────────────────────────────────────────────── */}
      <div className={cn(
        'flex-1 flex-col',
        mobileView === 'chat' ? 'flex' : 'hidden md:flex',
      )}>
        {activeChat && otherParty ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 bg-black/20 backdrop-blur-sm shrink-0">
              <button
                className="md:hidden flex items-center justify-center h-8 w-8 rounded-full hover:bg-white/10 text-slate-400 transition"
                onClick={() => setMobileView('list')}
                aria-label="Back to conversations"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <Avatar className="h-9 w-9 border border-white/10 shrink-0">
                <AvatarFallback className="bg-blue-900/50 text-blue-200 text-xs font-semibold">
                  {getInitials(otherParty.firstName, otherParty.lastName)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-sm leading-tight truncate">
                  {otherParty.firstName} {otherParty.lastName}
                </h3>
                <div className="flex items-center text-[11px] text-slate-400 mt-0.5">
                  <MapPin className="h-3 w-3 mr-1 shrink-0" />
                  <span className="text-blue-400 truncate">{activeChat.property.title}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {otherParty.phone ? (
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-white hover:bg-white/10" asChild>
                    <a href={`tel:${otherParty.phone}`} title={`Call ${otherParty.firstName}`}>
                      <Phone className="h-4 w-4" />
                    </a>
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-600" disabled>
                    <Phone className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-white hover:bg-white/10">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Pinned property card */}
            <div className="shrink-0 mx-4 mt-3 mb-1">
              <a
                href={`/property/${activeChat.propertyId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/8 px-4 py-2.5 hover:bg-blue-500/12 transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15">
                  <MapPin className="h-4 w-4 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-blue-200 truncate">{activeChat.property.title}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {activeChat.property.city} · ₦{Number(activeChat.property.monthlyRent).toLocaleString()}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] text-blue-400/60 font-medium">View →</span>
              </a>
            </div>

            {/* Messages Area */}
            <div
              className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
              style={{ background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.04) 0%, transparent 70%)' }}
            >
              {loadingMessages && (
                <p className="text-center text-xs text-slate-500 py-4">Loading messages…</p>
              )}
              {messages.map((msg) => {
                const isMine = msg.senderId === currentUserId
                const status = getMessageStatus(msg)
                return (
                  <div key={msg.id} className={cn('flex w-full', isMine ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      'max-w-[72%] rounded-2xl px-3.5 py-2.5 shadow-sm',
                      isMine
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-[#1a2740] border border-white/8 text-slate-200 rounded-bl-sm',
                    )}>
                      {msg.type === 'IMAGE' && msg.mediaUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={msg.mediaUrl} alt="shared image" className="rounded-xl max-w-full max-h-60 object-cover mb-1" />
                      ) : msg.type === 'VIDEO' && msg.mediaUrl ? (
                        <video src={msg.mediaUrl} controls className="rounded-xl max-w-full max-h-60 mb-1" />
                      ) : msg.type === 'AUDIO' && msg.mediaUrl ? (
                        <audio controls src={msg.mediaUrl} className="w-full max-w-xs mb-1" />
                      ) : msg.type === 'PDF' && msg.mediaUrl ? (
                        <a
                          href={msg.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            'flex items-center gap-2 rounded-xl px-3 py-2 mb-1 transition',
                            isMine ? 'bg-blue-500/40 hover:bg-blue-500/60' : 'bg-slate-700/60 hover:bg-slate-700',
                          )}
                        >
                          <FileText className="h-5 w-5 shrink-0" />
                          <span className="text-sm truncate">{msg.content.replace('📄 Document', 'Document')}</span>
                        </a>
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      )}
                      <div className={cn('flex items-center justify-end gap-1 mt-1', isMine ? 'text-blue-200' : 'text-slate-500')}>
                        <span className="text-[10px]">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMine && (
                          status === 'seen'
                            ? <CheckCheck className="h-3.5 w-3.5 text-blue-200" />
                            : <Check className="h-3.5 w-3.5 text-blue-300" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {typingUserId && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm px-4 py-2.5 bg-[#1a2740] border border-white/8">
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suspension / upload error banner */}
            {sendError && (
              <div className="mx-4 mb-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-sm text-rose-400">
                {sendError}
              </div>
            )}

            {/* File Preview */}
            {pendingFile && (
              <div className="mx-4 mb-2 rounded-xl border border-white/10 bg-slate-800/80 p-3 flex items-center gap-3">
                {pendingFile.type === 'IMAGE' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pendingFile.objectUrl} alt="preview" className="h-14 w-14 rounded-lg object-cover shrink-0" />
                ) : pendingFile.type === 'VIDEO' ? (
                  <div className="h-14 w-14 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                    <Film className="h-6 w-6 text-slate-300" />
                  </div>
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6 text-slate-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{pendingFile.name}</p>
                  {uploadPct !== null && (
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-200"
                        style={{ width: `${uploadPct}%` }}
                      />
                    </div>
                  )}
                  {uploadPct !== null && (
                    <p className="text-[10px] text-slate-400 mt-0.5">{uploadPct}%</p>
                  )}
                </div>
                {uploadPct === null && (
                  <button
                    onClick={cancelPendingFile}
                    className="shrink-0 text-slate-400 hover:text-white transition"
                    aria-label="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 px-4 py-3 border-t border-white/8 bg-black/20 backdrop-blur-sm shrink-0"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,audio/mpeg,audio/ogg,audio/wav,audio/webm,application/pdf,video/mp4,video/webm"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full text-slate-400 hover:text-white hover:bg-white/10 shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadPct !== null}
                title="Send file (image, video, PDF, audio)"
              >
                {uploadPct !== null
                  ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                  : <Paperclip className="h-4 w-4" />
                }
              </Button>
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleTyping}
                placeholder={pendingFile ? 'Click send to upload file…' : 'Type a message…'}
                disabled={!!pendingFile}
                className="flex-1 h-10 rounded-full bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 focus-visible:ring-1 px-4 disabled:opacity-50"
              />
              <Button
                type="submit"
                disabled={(!inputText.trim() && !pendingFile) || uploadPct !== null}
                size="icon"
                className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white shrink-0 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
            <MessageSquare className="h-12 w-12 opacity-15" />
            <p className="text-sm">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  )
}
