'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { useAuth } from '@/lib/auth-context'
import {
  LayoutDashboard,
  Users,
  Building2,
  FileCheck,
  AlertCircle,
  MessageSquare,
  Megaphone,
} from 'lucide-react'

const ADMIN_MENU = [
  {
    group: 'Core',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, detail: 'Overview, analytics, reports, and review queues' },
      { label: 'User Management', href: '/admin/users', icon: Users, detail: 'All users, role filters, and account suspension' },
      { label: 'Property Moderation', href: '/admin/properties', icon: Building2, detail: 'Verify listings and remove unsafe inventory' },
      { label: 'Verification Queue', href: '/admin/verifications', icon: FileCheck, detail: 'Approve or reject landlord document submissions' },
      { label: 'Reports', href: '/admin/disputes', icon: AlertCircle, detail: 'Review tenant and listing reports from the backend' },
      { label: 'Support Requests', href: '/admin/requests', icon: MessageSquare, detail: 'Threaded admin↔user support conversations' },
      { label: 'Broadcast Message', href: '/admin/broadcast', icon: Megaphone, detail: 'Send a platform-wide memo to all users' },
    ],
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading || !user || user.role !== 'ADMIN') return null

  return (
    <DashboardLayout
      userRole="Admin"
      userName={user.name}
      userEmail={user.email}
      sidebarTitle="House9ja"
      sidebarSubtitle="Admin Control Center"
      themeColor="emerald"
      menu={ADMIN_MENU}
    >
      {children}
    </DashboardLayout>
  )
}
