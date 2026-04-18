'use client'

import React, { useState } from 'react'
import { SidebarNavigation, NavGroup } from './SidebarNavigation'
import { HeaderBar } from './HeaderBar'
import { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type DashboardLayoutProps = {
  children: ReactNode
  userRole: 'Admin' | 'Landlord' | 'Tenant' | 'Agent'
  userName: string
  userEmail: string
  sidebarTitle: string
  sidebarSubtitle: string
  themeColor: 'emerald' | 'blue' | 'indigo' | 'violet'
  menu: NavGroup[]
  extraHeaderTools?: ReactNode
}

export function DashboardLayout({
  children,
  userRole,
  userName,
  userEmail,
  sidebarTitle,
  sidebarSubtitle,
  themeColor,
  menu,
  extraHeaderTools,
}: DashboardLayoutProps) {
  const [isOpen, setIsOpen] = useState(false)
  const avatarInitials = userName.substring(0, 2).toUpperCase()

  const bgClass =
    themeColor === 'emerald' ? 'bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.14),transparent_55%),linear-gradient(160deg,#0c1a14,#0e1927)]' :
    themeColor === 'blue'    ? 'bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.16),transparent_55%),linear-gradient(160deg,#0d1525,#0e1927)]' :
    themeColor === 'indigo'  ? 'bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.16),transparent_55%),linear-gradient(160deg,#0f1430,#0e1927)]' :
                               'bg-[radial-gradient(ellipse_at_top,rgba(109,40,217,0.14),transparent_55%),linear-gradient(160deg,#120e25,#0e1927)]'

  return (
    <div className={cn('flex h-screen overflow-hidden', bgClass)}>

      {/* ── Backdrop overlay (mobile only, behind sidebar) ─────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <SidebarNavigation
        title={sidebarTitle}
        subtitle={sidebarSubtitle}
        themeColor={themeColor}
        menu={menu}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderBar
          userRole={userRole}
          userName={userName}
          userEmail={userEmail}
          avatarInitials={avatarInitials}
          extraTools={extraHeaderTools}
          onMenuClick={() => setIsOpen(true)}
        />
        <main className="flex-1 overflow-auto px-4 py-5 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
