'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DashboardHero, DashboardPanel, DashboardStat } from '@/components/dashboard/dashboard-shell'
import { RequireAuth } from '@/components/auth/require-auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { favoritesService } from '@/lib/services/favorites-service'
import { bookingsService } from '@/lib/services/bookings-service'
import { chatService } from '@/lib/services/chat-service'

export default function TenantDashboardPage() {
  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesService.getMyFavorites(),
  })

  const { data: bookings = [] } = useQuery({
    queryKey: ['tenant-bookings'],
    queryFn: () => bookingsService.getTenantBookings(),
  })

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => chatService.getMyConversations(),
  })

  const approvedBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'APPROVED').length,
    [bookings],
  )

  return (
    <RequireAuth roles={['TENANT']}>
      <div className="space-y-8 max-w-7xl mx-auto">
        <DashboardHero
          eyebrow="Tenant Portal"
          title="Track saved homes, inspections, and conversations in one place."
          description="Your dashboard now reflects live backend activity instead of demo metrics, so it starts clean and grows with real usage."
          actions={
            <Link href="/search">
              <Button className="bg-indigo-600 text-white hover:bg-indigo-500 rounded-2xl h-11 px-8 shadow-lg shadow-indigo-500/20">
                Explore Marketplace
              </Button>
            </Link>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStat label="Saved Homes" value={String(favorites.length)} detail={favorites.length ? 'Properties you can revisit quickly' : 'No saved properties yet'} />
          <DashboardStat label="Active Chats" value={String(conversations.length)} detail={conversations.length ? 'Open landlord conversations' : 'No conversations yet'} />
          <DashboardStat label="Applications" value={String(bookings.length)} detail={bookings.length ? 'Viewing requests submitted' : 'No viewing requests yet'} />
          <DashboardStat label="Approved Viewings" value={String(approvedBookings)} detail={approvedBookings ? 'Confirmed inspection requests' : 'No approved inspections yet'} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardPanel title="Recent Activity">
            <div className="space-y-3 text-sm text-slate-600">
              {bookings.slice(0, 3).map((booking) => (
                <div key={booking.id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="font-medium text-slate-950">{booking.property?.title ?? 'Property viewing request'}</div>
                  <div className="mt-1 text-slate-600">
                    {booking.status} inspection for {booking.date} at {booking.time}
                  </div>
                </div>
              ))}
              {!bookings.length ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-500">
                  Your dashboard is ready. Save properties or request a viewing to see live activity here.
                </div>
              ) : null}
            </div>
          </DashboardPanel>

          <DashboardPanel title="Quick Access">
            <div className="grid gap-3">
              <Link href="/dashboard/saved" className="rounded-2xl bg-slate-50 p-4 text-slate-700 transition hover:bg-slate-100">
                Review your saved properties
              </Link>
              <Link href="/applications" className="rounded-2xl bg-slate-50 p-4 text-slate-700 transition hover:bg-slate-100">
                Check application and viewing statuses
              </Link>
              <Link href="/profile" className="rounded-2xl bg-slate-50 p-4 text-slate-700 transition hover:bg-slate-100">
                Manage your profile and account status
              </Link>
            </div>
          </DashboardPanel>
        </div>
      </div>
    </RequireAuth>
  )
}
