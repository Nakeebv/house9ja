'use client'

import { usePathname } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { RequireAuth } from '@/components/auth/require-auth'
import { useAuth } from '@/lib/auth-context'
import { Search, Heart, MessageSquare, Home, Calendar, User2, LifeBuoy } from 'lucide-react'

const TENANT_MENU = [
  {
    group: 'Explore',
    items: [
      { label: 'Browse Properties', href: '/search', icon: Search },
      { label: 'Saved Homes', href: '/dashboard/saved', icon: Heart },
    ],
  },
  {
    group: 'My Tenancy',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: Home },
      { label: 'Applications', href: '/applications', icon: Calendar },
      { label: 'Landlord Chats', href: '/chat', icon: MessageSquare },
      { label: 'Profile', href: '/profile', icon: User2 },
    ],
  },
  {
    group: 'Help',
    items: [
      { label: 'Support / Inbox', href: '/support', icon: LifeBuoy },
    ],
  },
]

// Routes inside (tenant) that are public — they use root layout without dashboard chrome
const PUBLIC_PATHS = ['/property']

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const pathname = usePathname()

  // Property detail pages are public — render with the root layout (Navbar + Footer only)
  const isPublicRoute = PUBLIC_PATHS.some((prefix) => pathname?.startsWith(prefix))
  if (isPublicRoute) {
    return <>{children}</>
  }

  // All other (tenant) routes require auth + email verified
  return (
    <RequireAuth>
      <DashboardLayout
        userRole="Tenant"
        userName={user?.name ?? ''}
        userEmail={user?.email ?? ''}
        sidebarTitle="House9ja"
        sidebarSubtitle="Tenant Portal"
        themeColor="indigo"
        menu={TENANT_MENU}
      >
        {children}
      </DashboardLayout>
    </RequireAuth>
  )
}
