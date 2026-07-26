'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { useAuth } from '@/lib/auth-context'
import { LayoutDashboard, Building2, PlusCircle, MessageSquare, Users, LifeBuoy } from 'lucide-react'

const LANDLORD_MENU = [
  {
    group: 'Management',
    items: [
      { label: 'Overview', href: '/landlord/dashboard', icon: LayoutDashboard },
      { label: 'My Properties', href: '/landlord/properties', icon: Building2 },
      { label: 'Add Listing', href: '/landlord/properties/new', icon: PlusCircle },
    ],
  },
  {
    group: 'Communications',
    items: [
      { label: 'Tenant Chats', href: '/landlord/chat', icon: MessageSquare },
      { label: 'Viewing Requests', href: '/landlord/leads', icon: Users },
    ],
  },
  {
    group: 'Help',
    items: [
      { label: 'Support / Inbox', href: '/support', icon: LifeBuoy },
    ],
  },
]

export default function LandlordLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'LANDLORD')) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading || !user || user.role !== 'LANDLORD') return null

  return (
    <DashboardLayout
      userRole="Landlord"
      userName={user.name}
      userEmail={user.email}
      sidebarTitle="House9ja"
      sidebarSubtitle="Landlord Portal"
      themeColor="blue"
      menu={LANDLORD_MENU}
    >
      {children}
    </DashboardLayout>
  )
}
