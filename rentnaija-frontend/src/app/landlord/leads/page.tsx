'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Clock, Check, X, CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AdminPanel, AdminTag } from '@/components/admin/admin-shell'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { bookingsService } from '@/lib/services/bookings-service'
import type { Booking } from '@/types'

export default function LandlordLeadsPage() {
  const queryClient = useQueryClient()

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['landlord-bookings'],
    queryFn: () => bookingsService.getLandlordBookings(),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' | 'RESCHEDULED' }) =>
      bookingsService.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['landlord-bookings'] }),
  })

  const getInitials = (b: Booking) => {
    if (!b.tenant) return 'T'
    return `${b.tenant.firstName?.[0] ?? ''}${b.tenant.lastName?.[0] ?? ''}`.toUpperCase() || 'T'
  }

  const getTenantName = (b: Booking) =>
    b.tenant ? `${b.tenant.firstName} ${b.tenant.lastName}`.trim() : 'Tenant'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white">Viewing Requests</h1>
        <p className="mt-2 text-sm text-slate-400">Manage property inspection requests from interested tenants.</p>
      </div>

      <AdminPanel title="Incoming Bookings" description="Approve, reject or propose a reschedule for property tours.">
        {isLoading ? (
          <p className="text-slate-400 text-sm py-4">Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <p className="text-slate-400 text-sm py-4">No viewing requests yet.</p>
        ) : (
          <div className="grid gap-4 mt-2">
            {bookings.map((booking) => (
              <Card key={booking.id} className="border-slate-800 bg-slate-900 shadow-sm border">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10 border border-slate-700 bg-slate-800">
                        <AvatarFallback className="text-slate-300">{getInitials(booking)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-white">{getTenantName(booking)}</h4>
                        <p className="text-sm font-medium text-emerald-400 mt-0.5">
                          {booking.property?.title ?? 'Property'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {booking.date}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {booking.time}</span>
                          {booking.tenant?.phone && <span>📱 {booking.tenant.phone}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {booking.status === 'PENDING' ? (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
                            onClick={() => updateStatus.mutate({ id: booking.id, status: 'RESCHEDULED' })}
                            disabled={updateStatus.isPending}
                          >
                            <CalendarClock className="h-4 w-4 mr-1.5" /> Reschedule
                          </Button>
                          <Button
                            size="icon"
                            className="h-9 w-9 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                            onClick={() => updateStatus.mutate({ id: booking.id, status: 'REJECTED' })}
                            disabled={updateStatus.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            className="h-9 w-9 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                            onClick={() => updateStatus.mutate({ id: booking.id, status: 'APPROVED' })}
                            disabled={updateStatus.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <AdminTag tone={
                          booking.status === 'APPROVED' ? 'success'
                          : booking.status === 'REJECTED' ? 'danger'
                          : 'info'
                        }>
                          {booking.status}
                        </AdminTag>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </AdminPanel>
    </div>
  )
}
