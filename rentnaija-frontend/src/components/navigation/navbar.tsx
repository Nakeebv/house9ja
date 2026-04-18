'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Menu, X, Search, BookOpen, LayoutDashboard, LogOut, User, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useTheme } from '@/components/theme-provider'

const ROLE_DASHBOARD: Record<string, string> = {
  ADMIN:    '/admin',
  LANDLORD: '/landlord/dashboard',
  AGENT:    '/agent/dashboard',
  TENANT:   '/dashboard',
}

const NAV = [
  { href: '/search',  label: 'Find a Home', icon: Search },
  { href: '/booking', label: 'Book Viewing', icon: BookOpen },
]

const ROLE_GRADIENTS: Record<string, string> = {
  TENANT:   'from-blue-500 to-blue-700',
  LANDLORD: 'from-emerald-500 to-teal-600',
  AGENT:    'from-orange-400 to-orange-600',
  ADMIN:    'from-blue-700 to-indigo-700',
}

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, logout } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()
  const pathname = usePathname()
  const isHome = pathname === '/'

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 56)
    window.addEventListener('scroll', fn, { passive: true })
    fn()
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  const dashboardHref = user ? (ROLE_DASHBOARD[user.role] ?? '/dashboard') : '/dashboard'
  const initials = user?.name ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() : '?'
  const gradient = ROLE_GRADIENTS[user?.role ?? ''] ?? 'from-slate-500 to-slate-600'

  // Transparent on homepage before scroll
  const transparent = isHome && !scrolled && !open

  return (
    <header
      className={[
        'fixed inset-x-0 top-0 z-50 h-[64px] transition-all duration-300',
        transparent
          ? 'border-b border-transparent bg-transparent'
          : 'border-b border-black/8 bg-white/90 backdrop-blur-xl dark:border-white/8 dark:bg-black/90',
      ].join(' ')}
    >
      <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 sm:px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 select-none" aria-label="House9ja home">
          <div className="relative h-8 w-8 shrink-0">
            <Image src="/logo-icon.png" alt="" fill className="object-contain" sizes="32px" />
          </div>
          <span className={`text-[17px] font-bold tracking-tight transition-colors ${transparent ? 'text-white' : 'text-[#1d1d1f] dark:text-[#f5f5f7]'}`}>
            house<span className="text-orange-500">9ja</span>
          </span>
        </Link>

        {/* Desktop centre nav */}
        <div className="hidden items-center gap-0.5 md:flex">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={[
                'rounded-lg px-4 py-2 text-[14px] font-medium transition-colors',
                transparent
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-[#1d1d1f] hover:bg-black/5 dark:text-[#f5f5f7] dark:hover:bg-white/8',
              ].join(' ')}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop right */}
        <div className="hidden items-center gap-2 md:flex">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className={[
              'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
              transparent
                ? 'text-white/60 hover:bg-white/10 hover:text-white'
                : 'text-[#6e6e73] hover:bg-black/6 dark:text-[#a1a1a6] dark:hover:bg-white/8',
            ].join(' ')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user ? (
            <>
              <Link
                href={dashboardHref}
                className={[
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors',
                  transparent
                    ? 'text-white/80 hover:bg-white/10 hover:text-white'
                    : 'text-[#1d1d1f] hover:bg-black/5 dark:text-[#f5f5f7] dark:hover:bg-white/8',
                ].join(' ')}
              >
                <LayoutDashboard className="h-4 w-4 opacity-70" />
                Dashboard
              </Link>

              <Link
                href="/profile"
                className={[
                  'flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 text-[13px] font-medium transition-all',
                  transparent
                    ? 'border-white/20 text-white hover:bg-white/10'
                    : 'border-black/12 text-[#1d1d1f] hover:bg-black/4 dark:border-white/12 dark:text-[#f5f5f7] dark:hover:bg-white/8',
                ].join(' ')}
              >
                <div className="relative h-6 w-6 overflow-hidden rounded-full">
                  {user.avatarUrl ? (
                    <Image src={user.avatarUrl} alt={user.name ?? ''} fill className="object-cover" sizes="24px" />
                  ) : (
                    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient} text-[9px] font-bold text-white`}>
                      {initials}
                    </div>
                  )}
                </div>
                {user.name?.split(' ')[0]}
              </Link>

              <button
                onClick={logout}
                aria-label="Log out"
                className={[
                  'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                  transparent
                    ? 'text-white/50 hover:bg-white/10 hover:text-white'
                    : 'text-[#86868b] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400',
                ].join(' ')}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <button
                  className={[
                    'rounded-lg px-4 py-2 text-[14px] font-medium transition-colors',
                    transparent
                      ? 'text-white/80 hover:bg-white/10 hover:text-white'
                      : 'text-[#1d1d1f] hover:bg-black/5 dark:text-[#f5f5f7] dark:hover:bg-white/8',
                  ].join(' ')}
                >
                  Log in
                </button>
              </Link>
              <Link href="/register">
                <button
                  className={[
                    'rounded-full px-5 py-2 text-[14px] font-semibold transition-all active:scale-[0.98]',
                    transparent
                      ? 'bg-white text-[#1d1d1f] hover:bg-white/90'
                      : 'bg-[#0071e3] text-white hover:bg-[#0077ed] dark:bg-[#2997ff] dark:text-black dark:hover:bg-[#409cff]',
                  ].join(' ')}
                >
                  Get started
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile: theme + hamburger */}
        <div className="flex items-center gap-1 md:hidden">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${transparent ? 'text-white/60 hover:bg-white/10' : 'text-[#6e6e73] hover:bg-black/6 dark:text-[#a1a1a6] dark:hover:bg-white/8'}`}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${transparent ? 'text-white hover:bg-white/10' : 'text-[#1d1d1f] hover:bg-black/6 dark:text-[#f5f5f7] dark:hover:bg-white/8'}`}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-black/8 bg-white/96 px-5 pb-6 pt-3 backdrop-blur-xl dark:border-white/8 dark:bg-black/96 md:hidden">
          <div className="flex flex-col gap-0.5">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-[#1d1d1f] transition hover:bg-black/5 dark:text-[#f5f5f7] dark:hover:bg-white/6"
              >
                <Icon className="h-4 w-4 text-[#6e6e73] dark:text-[#a1a1a6]" />
                {label}
              </Link>
            ))}

            {user ? (
              <>
                <Link href={dashboardHref} className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-[#1d1d1f] transition hover:bg-black/5 dark:text-[#f5f5f7] dark:hover:bg-white/6">
                  <LayoutDashboard className="h-4 w-4 text-[#6e6e73] dark:text-[#a1a1a6]" />
                  Dashboard
                </Link>
                <Link href="/profile" className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-[#1d1d1f] transition hover:bg-black/5 dark:text-[#f5f5f7] dark:hover:bg-white/6">
                  <User className="h-4 w-4 text-[#6e6e73] dark:text-[#a1a1a6]" />
                  Profile
                </Link>
                <div className="mt-2 border-t border-black/6 pt-2 dark:border-white/6">
                  <button
                    onClick={() => { logout(); setOpen(false) }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-500/8"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-2 flex flex-col gap-2 border-t border-black/6 pt-3 dark:border-white/6">
                <Link href="/login">
                  <Button variant="outline" className="w-full rounded-full text-[15px] dark:border-white/12 dark:text-[#f5f5f7]">
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="w-full rounded-full bg-[#0071e3] text-[15px] font-semibold text-white hover:bg-[#0077ed] dark:bg-[#2997ff] dark:text-black">
                    Get started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
