'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PlusCircle, ArrowRight, Calendar, MapPin, Clock, Users2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardHero, DashboardPanel, DashboardStat } from '@/components/dashboard/dashboard-shell'
import { propertyService } from '@/lib/services/property-service'
import { bookingsService } from '@/lib/services/bookings-service'
import { leadsService } from '@/lib/services/leads-service'
import { chatService } from '@/lib/services/chat-service'

export default function AgentDashboardPage() {
  const { data: listings = [] } = useQuery({
    queryKey: ['agent-properties'],
    queryFn: () => propertyService.getMyListings(),
  })

  const { data: bookings = [] } = useQuery({
    queryKey: ['agent-bookings'],
    queryFn: () => bookingsService.getLandlordBookings(),
  })

  const { data: leads = [] } = useQuery({
    queryKey: ['agent-leads'],
    queryFn: () => leadsService.getAgentLeads(),
  })

  const { data: conversations = [] } = useQuery({
    queryKey: ['agent-conversations'],
    queryFn: () => chatService.getMyConversations(),
  })

  const pendingLeads = useMemo(() => leads.filter((l) => l.status === 'PENDING').length, [leads])
  const pendingBookings = useMemo(() => bookings.filter((b) => b.status === 'PENDING').length, [bookings])
  const approvedTours = useMemo(() => bookings.filter((b) => b.status === 'APPROVED').length, [bookings])
  const recentLeads = useMemo(() => leads.slice(0, 3), [leads])
  const recentBookings = useMemo(() => bookings.slice(0, 3), [bookings])

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <DashboardHero
        eyebrow="Agent Dashboard"
        title="Manage listings, leads, and tenant relationships."
        description="Your live workspace — listings, incoming leads, tour requests and conversations all in one place."
        actions={
          <Link href="/agent/properties/new">
            <Button className="bg-violet-500 text-white hover:bg-violet-400">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Listing
            </Button>
          </Link>
        }
      />

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStat
          label="My Listings"
          value={String(listings.length)}
          detail={listings.length ? `${listings.filter((l) => l.isVerified).length} verified` : 'No listings yet'}
        />
        <DashboardStat
          label="Lead Pipeline"
          value={String(leads.length)}
          detail={pendingLeads ? `${pendingLeads} awaiting your response` : 'No pending leads'}
        />
        <DashboardStat
          label="Tours Booked"
          value={String(bookings.length)}
          detail={pendingBookings ? `${pendingBookings} pending approval` : approvedTours ? `${approvedTours} confirmed` : 'No tour requests'}
        />
        <DashboardStat
          label="Active Chats"
          value={String(conversations.length)}
          detail={conversations.length ? 'Tenant conversations open' : 'No chats yet'}
        />
      </div>

      {/* Content panels */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent leads */}
        <DashboardPanel title="Recent Leads">
          <div className="space-y-3 text-sm">
            {recentLeads.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-slate-500">
                No leads yet. Leads appear here when tenants express interest in your listings.
              </div>
            ) : (
              recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 p-4">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-950 truncate">
                      {lead.tenant ? `${lead.tenant.firstName} ${lead.tenant.lastName}` : 'Tenant'}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" />
                      {lead.property?.title ?? 'Property'}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold
                    ${lead.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      lead.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-red-100 text-red-700'}`}>
                    {lead.status}
                  </span>
                </div>
              ))
            )}
            {leads.length > 3 && (
              <Link href="/agent/leads" className="inline-flex items-center gap-1 text-xs text-violet-600 hover:underline mt-1">
                View all {leads.length} leads <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </DashboardPanel>

        {/* Recent tour requests */}
        <DashboardPanel title="Recent Tour Requests">
          <div className="space-y-3 text-sm">
            {recentBookings.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-slate-500">
                No tour requests yet. Requests appear here when tenants book an inspection.
              </div>
            ) : (
              recentBookings.map((booking) => (
                <div key={booking.id} className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-medium text-slate-950">
                    {booking.tenant
                      ? `${booking.tenant.firstName} ${booking.tenant.lastName}`
                      : 'Tenant'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{booking.property?.title ?? 'Property'}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{booking.date}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{booking.time}</span>
                    <span className={`rounded-full px-2 py-0.5 font-semibold
                      ${booking.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        booking.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                        booking.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'}`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))
            )}
            {bookings.length > 3 && (
              <Link href="/agent/leads" className="inline-flex items-center gap-1 text-xs text-violet-600 hover:underline mt-1">
                View all bookings <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </DashboardPanel>
      </div>

      {/* Recent listings */}
      <DashboardPanel title="My Listings">
        <div className="space-y-3 text-sm">
          {listings.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-10 text-center">
              <Users2 className="h-8 w-8 text-slate-400" />
              <p className="text-slate-600">You have no listings yet.</p>
              <Link href="/agent/properties/new">
                <Button size="sm" className="bg-violet-600 text-white hover:bg-violet-500 rounded-xl">
                  Add your first listing
                </Button>
              </Link>
            </div>
          ) : (
            listings.slice(0, 4).map((listing) => (
              <div key={listing.id} className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 p-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-950 truncate">{listing.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3 w-3" />
                    {listing.location}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-emerald-600">₦{listing.price.toLocaleString()}</p>
                  <span className={`text-xs font-medium ${listing.isVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {listing.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
            ))
          )}
          {listings.length > 4 && (
            <Link href="/agent/properties" className="inline-flex items-center gap-1 text-xs text-violet-600 hover:underline">
              View all {listings.length} listings <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </DashboardPanel>
    </div>
  )
}
