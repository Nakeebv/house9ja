'use client'

import React from 'react'
import { Bell, ChevronDown, Menu, MoonStar, Search, User, LogOut, ShieldCheck } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/auth-context'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsService } from '@/lib/services/notifications-service'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type HeaderBarProps = {
  userRole: 'Admin' | 'Landlord' | 'Tenant' | 'Agent'
  userName: string
  userEmail: string
  avatarInitials: string
  extraTools?: React.ReactNode
  onMenuClick?: () => void
}

export function HeaderBar({ userRole, userName, userEmail, avatarInitials, extraTools, onMenuClick }: HeaderBarProps) {
  const { logout } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.getMyNotifications(),
    refetchInterval: 30000,
  })

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllRead = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <header className="border-b border-white/8 bg-black/20 px-6 py-4 backdrop-blur">
      <div className="flex items-center justify-between gap-3 lg:gap-4">
        <div className="flex items-center gap-3 lg:hidden">
          <Button variant="ghost" className="h-10 w-10 p-0 text-slate-300" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-1.5">
            <div className="relative h-7 w-7 shrink-0">
              <Image src="/logo-icon.png" alt="House9ja" fill className="object-contain" sizes="28px" />
            </div>
            <span className="text-base font-bold text-white">house<span className="text-orange-400">9ja</span></span>
          </div>
        </div>

        <div className="relative hidden flex-1 max-w-xl lg:flex">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder={`Search ${userRole.toLowerCase()} dashboard...`}
            className="h-11 rounded-2xl border-white/8 bg-white/5 pl-11 text-white placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {extraTools}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-11 rounded-2xl border border-white/8 bg-white/5 px-4 text-slate-300 hover:bg-white/10 hover:text-white">
                <Bell className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Alerts</span>
                {unreadCount > 0 && (
                  <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 border-slate-700 bg-[#0e1927] text-slate-200 p-2" align="end" forceMount>
              <DropdownMenuLabel className="font-normal border-b border-slate-800 pb-2 mb-2 flex items-center justify-between">
                <div className="font-semibold text-white">Notifications</div>
                {unreadCount > 0 && (
                  <button onClick={() => markAllRead.mutate()} className="text-xs text-slate-400 hover:text-white transition">Mark all read</button>
                )}
              </DropdownMenuLabel>
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-slate-500 text-center">No notifications yet.</p>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      className="focus:bg-white/10 rounded-xl p-3 flex gap-3 cursor-pointer items-start"
                      onClick={() => {
                        if (!n.isRead) markRead.mutate(n.id)
                        if (n.linkUrl) router.push(n.linkUrl)
                      }}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.isRead ? 'bg-slate-700' : 'bg-blue-400'}`} />
                      <div className="flex-1 space-y-1">
                        <p className={`text-sm font-medium leading-none ${n.isRead ? 'text-slate-400' : 'text-white'}`}>{n.title}</p>
                        <p className="text-xs text-slate-400">{n.message}</p>
                        {n.linkUrl && <p className="text-[10px] text-blue-400 mt-0.5">Tap to open →</p>}
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 rounded-2xl border border-white/8 bg-white/5 px-3 text-slate-200 hover:bg-white/10">
                <Avatar className="mr-3 h-9 w-9">
                  <AvatarFallback className="bg-slate-800 text-slate-300">{avatarInitials}</AvatarFallback>
                </Avatar>
                <div className="hidden text-left sm:block">
                  <div className="text-sm font-medium leading-none">{userName}</div>
                  <div className="mt-1 text-xs text-slate-500">{userRole}</div>
                </div>
                <ChevronDown className="ml-3 h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 border-slate-700 bg-[#0e1927] text-slate-200" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-white">{userName}</p>
                  <p className="text-xs leading-none text-slate-500">{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </Link>
              </DropdownMenuItem>
              {userRole === 'Admin' && (
                <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
                  <Link href="/admin">
                    <ShieldCheck className="mr-2 h-4 w-4 text-orange-400" />
                    <span>Admin Panel</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem onClick={logout} className="text-rose-400 focus:bg-white/10 focus:text-rose-300 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
