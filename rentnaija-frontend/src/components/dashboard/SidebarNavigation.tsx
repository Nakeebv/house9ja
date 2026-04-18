'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LucideIcon, LogOut } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAuth } from '@/lib/auth-context'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  detail?: string
}

export type NavGroup = {
  group: string
  items: NavItem[]
}

type SidebarProps = {
  title: string
  subtitle: string
  themeColor: 'emerald' | 'blue' | 'indigo' | 'violet'
  menu: NavGroup[]
  isOpen: boolean
  onClose: () => void
}

const themeStyles = {
  emerald: {
    bg: 'bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.18),transparent_45%),linear-gradient(180deg,#0c1a14,#0e1d1a)]',
    card: 'border-emerald-500/25 bg-emerald-500/10',
    title: 'text-emerald-300',
    activeItem: 'border-emerald-500/35 bg-emerald-500/15',
    activeIcon: 'bg-emerald-500/25 text-emerald-300',
  },
  blue: {
    bg: 'bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.2),transparent_45%),linear-gradient(180deg,#0d1628,#0e1a2e)]',
    card: 'border-blue-500/25 bg-blue-500/10',
    title: 'text-blue-300',
    activeItem: 'border-blue-500/35 bg-blue-500/15',
    activeIcon: 'bg-blue-500/25 text-blue-300',
  },
  indigo: {
    bg: 'bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.2),transparent_45%),linear-gradient(180deg,#0f142e,#0e1a2e)]',
    card: 'border-indigo-500/25 bg-indigo-500/10',
    title: 'text-indigo-300',
    activeItem: 'border-indigo-500/35 bg-indigo-500/15',
    activeIcon: 'bg-indigo-500/25 text-indigo-300',
  },
  violet: {
    bg: 'bg-[radial-gradient(ellipse_at_top,rgba(109,40,217,0.18),transparent_45%),linear-gradient(180deg,#120e24,#0e1a2e)]',
    card: 'border-violet-500/25 bg-violet-500/10',
    title: 'text-violet-300',
    activeItem: 'border-violet-500/35 bg-violet-500/15',
    activeIcon: 'bg-violet-500/25 text-violet-300',
  },
}

export function SidebarNavigation({ title, subtitle, themeColor, menu, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const styles = themeStyles[themeColor]
  const { logout } = useAuth()

  return (
    <aside
      className={cn(
        // Always in DOM — slides in/out on mobile via transform
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col',
        'border-r border-white/8 p-5',
        'transition-transform duration-300 ease-in-out',
        // Mobile: controlled by isOpen
        isOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop (lg+): always visible, back in normal flow
        'lg:static lg:z-auto lg:w-72 lg:translate-x-0',
        styles.bg,
      )}
    >
      {/* Brand card */}
      <div className={cn('mb-6 rounded-2xl border p-4', styles.card)}>
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 shrink-0">
            <Image src="/logo-icon.png" alt="House9ja" fill className="object-contain" sizes="36px" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">
              house<span className="text-orange-400">9ja</span>
            </h1>
            <p className={cn('text-[10px] uppercase tracking-[0.22em]', styles.title)}>{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-6 overflow-y-auto pr-1">
        {menu.map((section) => (
          <div key={section.group} className="space-y-2">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
              {section.group}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all',
                      isActive
                        ? styles.activeItem
                        : 'border-white/6 bg-white/[0.03] hover:border-white/12 hover:bg-white/6',
                    )}
                  >
                    <span className={cn('rounded-lg p-1.5', isActive ? styles.activeIcon : 'bg-white/6 text-slate-400')}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className={cn('text-sm font-medium', isActive ? 'text-white' : 'text-slate-200')}>
                        {item.label}
                      </div>
                      {item.detail && (
                        <div className="mt-0.5 text-xs leading-4 text-slate-500">{item.detail}</div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="mt-4 border-t border-white/8 pt-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-sm text-slate-300 transition hover:border-white/15 hover:bg-white/6"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  )
}
