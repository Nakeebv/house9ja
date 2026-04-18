'use client'

import { useQuery } from '@tanstack/react-query'
import { Calendar, MapPin, Clock, CheckCircle, XCircle, AlertCircle, CalendarClock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RequireAuth } from '@/components/auth/require-auth'
import { DashboardHero, DashboardPanel } from '@/components/dashboard/dashboard-shell'
import Link from 'next/link'
import { bookingsService } from '@/lib/services/bookings-service'
import type { Booking } from '@/types'

const STATUS_CONFIG: Record<Booking['status'], { icon: typeof Clock; bg: string; text: string; label: string }> = {
  PENDING:     { icon: AlertCircle,   bg: 'bg-amber-100',   text: 'text-amber-800',   label: 'Pending Review' },
  APPROVED:    { icon: CheckCircle,   bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Approved' },
  REJECTED:    { icon: XCircle,       bg: 'bg-red-100',     text: 'text-red-800',     label: 'Rejected' },
  RESCHEDULED: { icon: CalendarClock, bg: 'bg-blue-100',    text: 'text-blue-800',    label: 'Rescheduled' },
}

function BookingSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-slate-50 p-5">
      <div className="h-5 w-48 rounded bg-slate-200" />
      <div className="mt-2 h-4 w-32 rounded bg-slate-200" />
      <div className="mt-4 flex gap-4">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="h-4 w-24 rounded bg-slate-200" />
      </div>
    </div>
  )
}

export default function ApplicationsPage() {
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['tenant-bookings'],
    queryFn: () => bookingsService.getTenantBookings(),
  })

  return (
    <RequireAuth roles={['TENANT']}>
      <div className="space-y-8 max-w-5xl mx-auto">
        <DashboardHero
          eyebrow="My Applications"
          title="Track every viewing request you have submitted."
          description="All your property inspection requests are listed here with live status updates from the landlord."
          actions={
            <Link href="/search">
              <Button className="bg-indigo-600 text-white hover:bg-indigo-500 rounded-2xl h-11 px-8 shadow-lg shadow-indigo-500/20">
                Browse Properties
              </Button>
            </Link>
          }
        />

        <DashboardPanel title={`Viewing Requests${bookings.length ? ` (${bookings.length})` : ''}`}>
          {isLoading ? (
            <div className="space-y-3">
              <BookingSkeleton />
              <BookingSkeleton />
              <BookingSkeleton />
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
              <Calendar className="h-10 w-10 text-slate-400" />
              <div>
                <p className="font-medium text-slate-900">No viewing requests yet</p>
                <p className="mt-1 text-sm text-slate-500">Find a property you like and request a viewing from the property page.</p>
              </div>
              <Link href="/search">
                <Button className="bg-indigo-600 text-white hover:bg-indigo-500 rounded-xl mt-2">Browse Properties</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => {
                const cfg = STATUS_CONFIG[booking.status]
                const Icon = cfg.icon
                return (
                  <div key={booking.id} className="group rounded-2xl bg-slate-50 p-5 transition hover:bg-slate-100">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <Link href={`/property/${booking.propertyId}`} className="inline-flex items-center gap-1 font-semibold text-slate-950 hover:text-indigo-600 transition">
                          {booking.property?.title ?? 'Property'}
                          <ArrowRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100 group-hover:translate-x-0.5" />
                        </Link>
                        {booking.property?.city && (
                          <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                            <MapPin className="h-3.5 w-3.5" />
                            {booking.property.city}
                          </div>
                        )}
                      </div>
                      <div className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {cfg.label}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
                        <p className="text-xs text-slate-500">Viewing date</p>
                        <p className="mt-0.5 text-sm font-medium text-slate-900">{booking.date}</p>
                      </div>
                      <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
                        <p className="text-xs text-slate-500">Time</p>
                        <p className="mt-0.5 text-sm font-medium text-slate-900">{booking.time}</p>
                      </div>
                      <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
                        <p className="text-xs text-slate-500">Submitted</p>
                        <p className="mt-0.5 text-sm font-medium text-slate-900">{new Date(booking.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Button variant="outline" size="sm" asChild className="rounded-xl">
                        <Link href={`/property/${booking.propertyId}`}>View Property</Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </DashboardPanel>
      </div>
    </RequireAuth>
  )
}
