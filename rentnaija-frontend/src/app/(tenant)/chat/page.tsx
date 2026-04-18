'use client'

import { useQuery } from '@tanstack/react-query'
import { ChatInbox } from '@/components/chat/ChatInbox'
import { RequireAuth } from '@/components/auth/require-auth'
import { useAuth } from '@/lib/auth-context'
import { chatService } from '@/lib/services/chat-service'

export default function TenantChatPage() {
  const { user, token } = useAuth()

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatService.getMyConversations(),
    enabled: !!token,
  })

  return (
    <RequireAuth roles={['TENANT']}>
      {isLoading ? (
        <div className="flex h-[calc(100vh-9rem)] items-center justify-center text-slate-400 text-sm">
          Loading conversations…
        </div>
      ) : (
        <ChatInbox
          conversations={conversations}
          currentUserId={user?.id ?? ''}
          token={token ?? ''}
        />
      )}
    </RequireAuth>
  )
}
