'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { useAuth } from '@/lib/auth-context'
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  MessageSquare,
  Users2,
  LifeBuoy,
} from 'lucide-react'

const AGENT_MENU = [
  {
    group: 'Workspace',
    items: [
      { label: 'Overview', href: '/agent/dashboard', icon: LayoutDashboard },
      { label: 'My Listings', href: '/agent/properties', icon: Building2 },
      { label: 'Add Listing', href: '/agent/properties/new', icon: PlusCircle },
    ],
  },
  {
    group: 'Pipeline',
    items: [
      { label: 'Leads', href: '/agent/leads', icon: Users2 },
      { label: 'Chats', href: '/agent/chat', icon: MessageSquare },
    ],
  },
  {
    group: 'Help',
    items: [
      { label: 'Support / Inbox', href: '/support', icon: LifeBuoy },
    ],
  },
]

export default function AgentLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'AGENT')) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading || !user || user.role !== 'AGENT') return null

  return (
    <DashboardLayout
      userRole="Agent"
      userName={user.name}
      userEmail={user.email}
      sidebarTitle="House9ja"
      sidebarSubtitle="Agent Portal"
      themeColor="violet"
      menu={AGENT_MENU}
    >
      {children}
    </DashboardLayout>
  )
}
