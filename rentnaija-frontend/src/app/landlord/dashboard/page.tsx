'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { DashboardHero, DashboardPanel, DashboardStat } from '@/components/dashboard/dashboard-shell'
import { propertyService } from '@/lib/services/property-service'
import { bookingsService } from '@/lib/services/bookings-service'
import { chatService } from '@/lib/services/chat-service'
import { verificationsService } from '@/lib/services/verifications-service'

export default function LandlordDashboardPage() {
  const { data: listings = [] } = useQuery({
    queryKey: ['landlord-properties'],
    queryFn: () => propertyService.getMyListings(),
  })

  const { data: bookings = [] } = useQuery({
    queryKey: ['landlord-bookings'],
    queryFn: () => bookingsService.getLandlordBookings(),
  })

  const { data: conversations = [] } = useQuery({
    queryKey: ['landlord-conversations'],
    queryFn: () => chatService.getMyConversations(),
  })

  const { data: verification } = useQuery({
    queryKey: ['my-verification'],
    queryFn: () => verificationsService.getMine(),
  })

  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'PENDING').length,
    [bookings],
  )

  const verifiedListings = useMemo(
    () => listings.filter((listing) => listing.isVerified).length,
    [listings],
  )

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
        <DashboardHero
          eyebrow="Landlord Dashboard"
          title="Manage listings, viewing requests, and tenant communication from one workspace."
          description="This dashboard now reflects live backend data rather than prefilled portfolio metrics."
          actions={
            <Link href="/landlord/properties/new">
              <Button className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">Add Listing</Button>
            </Link>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStat label="Listings" value={String(listings.length)} detail={listings.length ? `${verifiedListings} verified for discovery` : 'No listings published yet'} />
          <DashboardStat label="Viewing Requests" value={String(bookings.length)} detail={pendingBookings ? `${pendingBookings} awaiting action` : 'No pending requests'} />
          <DashboardStat label="Conversations" value={String(conversations.length)} detail={conversations.length ? 'Tenant chats in progress' : 'No tenant chats yet'} />
          <DashboardStat label="Verification" value={verification?.status ?? 'NONE'} detail={verification ? 'Current landlord verification state' : 'No documents submitted'} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardPanel title="Recent Listings">
            <div className="space-y-3 text-sm text-slate-600">
              {listings.slice(0, 3).map((listing) => (
                <div key={listing.id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="font-medium text-slate-950">{listing.title}</div>
                  <div className="mt-1 text-slate-600">{listing.location}</div>
                </div>
              ))}
              {!listings.length ? <div className="rounded-2xl bg-slate-50 p-4">Create your first listing to start receiving viewing requests.</div> : null}
            </div>
          </DashboardPanel>

          <DashboardPanel title="Latest Viewing Requests">
            <div className="space-y-3 text-sm text-slate-600">
              {bookings.slice(0, 3).map((booking) => (
                <div key={booking.id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="font-medium text-slate-950">{booking.property?.title ?? 'Property viewing request'}</div>
                  <div className="mt-1 text-slate-600">{booking.status} for {booking.date} at {booking.time}</div>
                </div>
              ))}
              {!bookings.length ? <div className="rounded-2xl bg-slate-50 p-4">Tenant viewing requests will appear here as soon as renters start booking inspections.</div> : null}
            </div>
          </DashboardPanel>
        </div>
    </div>
  )
}
