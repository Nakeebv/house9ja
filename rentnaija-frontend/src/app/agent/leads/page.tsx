'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Check, X, MessageSquare, MapPin, Phone, Mail,
  Clock, Filter, Users2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { AdminPanel, AdminTag } from '@/components/admin/admin-shell'
import { leadsService } from '@/lib/services/leads-service'
import { bookingsService } from '@/lib/services/bookings-service'
import type { Lead } from '@/types'
import Link from 'next/link'

type FilterStatus = 'ALL' | 'PENDING' | 'ACCEPTED' | 'DECLINED'

const STATUS_CONFIG = {
  PENDING:  { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Pending' },
  ACCEPTED: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Accepted' },
  DECLINED: { bg: 'bg-red-100',     text: 'text-red-700',     label: 'Declined' },
}

function LeadCard({
  lead,
  onAccept,
  onDecline,
  isPending,
}: {
  lead: Lead
  onAccept: () => void
  onDecline: () => void
  isPending: boolean
}) {
  const initials = lead.tenant
    ? `${lead.tenant.firstName?.[0] ?? ''}${lead.tenant.lastName?.[0] ?? ''}`.toUpperCase()
    : 'T'

  const cfg = STATUS_CONFIG[lead.status]

  return (
    <Card className="border-slate-800 bg-slate-900 shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Tenant info */}
          <div className="flex items-start gap-4">
            <Avatar className="h-11 w-11 border border-slate-700 bg-slate-800 shrink-0">
              <AvatarFallback className="text-slate-300 font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-white">
                {lead.tenant ? `${lead.tenant.firstName} ${lead.tenant.lastName}` : 'Tenant'}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-violet-400">
                <MapPin className="h-3.5 w-3.5" />
                {lead.property?.title ?? 'Property'}
              </p>
              {lead.tenant?.phone && (
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                  <Phone className="h-3 w-3" />
                  {lead.tenant.phone}
                </p>
              )}
              {lead.tenant?.email && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                  <Mail className="h-3 w-3" />
                  {lead.tenant.email}
                </p>
              )}
              {lead.message && (
                <p className="mt-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300">
                  &ldquo;{lead.message}&rdquo;
                </p>
              )}
              <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                {new Date(lead.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            {lead.status === 'PENDING' ? (
              <>
                <Button
                  size="icon"
                  className="h-9 w-9 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                  onClick={onDecline}
                  disabled={isPending}
                  title="Decline lead"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  className="h-9 w-9 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                  onClick={onAccept}
                  disabled={isPending}
                  title="Accept lead"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </>
            ) : lead.status === 'ACCEPTED' ? (
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                  <Check className="h-3 w-3" /> Accepted
                </span>
                {lead.chatId && (
                  <Button
                    asChild
                    size="sm"
                    className="h-8 bg-violet-600 text-white hover:bg-violet-500 rounded-xl text-xs"
                  >
                    <Link href="/agent/chat">
                      <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                      Open Chat
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                <X className="h-3 w-3" /> Declined
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AgentLeadsPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<FilterStatus>('ALL')
  const [activeTab, setActiveTab] = useState<'leads' | 'tours'>('leads')

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['agent-leads'],
    queryFn: () => leadsService.getAgentLeads(),
  })

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['agent-bookings'],
    queryFn: () => bookingsService.getLandlordBookings(),
  })

  const updateLead = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACCEPTED' | 'DECLINED' }) =>
      leadsService.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agent-leads'] }),
  })

  const updateBooking = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
      bookingsService.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agent-bookings'] }),
  })

  const filteredLeads = filter === 'ALL' ? leads : leads.filter((l) => l.status === filter)

  const pendingCount = leads.filter((l) => l.status === 'PENDING').length
  const pendingTourCount = bookings.filter((b) => b.status === 'PENDING').length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white">Lead Pipeline</h1>
        <p className="mt-2 text-sm text-slate-400">
          Manage incoming tenant enquiries and tour requests for your listings.
        </p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('leads')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition
            ${activeTab === 'leads' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          <Users2 className="h-4 w-4" />
          Leads
          {pendingCount > 0 && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{pendingCount}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('tours')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition
            ${activeTab === 'tours' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          <Clock className="h-4 w-4" />
          Tour Requests
          {pendingTourCount > 0 && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{pendingTourCount}</span>
          )}
        </button>
      </div>

      {activeTab === 'leads' && (
        <AdminPanel title="Incoming Leads" description="Accept to open a chat thread with the tenant. Decline to pass.">
          {/* Filter bar */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            {(['ALL', 'PENDING', 'ACCEPTED', 'DECLINED'] as FilterStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition
                  ${filter === s ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                {s === 'ALL' ? `All (${leads.length})` : `${s.charAt(0) + s.slice(1).toLowerCase()} (${leads.filter((l) => l.status === s).length})`}
              </button>
            ))}
          </div>

          {leadsLoading ? (
            <p className="py-8 text-center text-sm text-slate-400">Loading leads…</p>
          ) : filteredLeads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 py-12 text-center">
              <Users2 className="mx-auto mb-3 h-8 w-8 text-slate-600" />
              <p className="text-slate-400">No {filter !== 'ALL' ? filter.toLowerCase() : ''} leads yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  isPending={updateLead.isPending}
                  onAccept={() => updateLead.mutate({ id: lead.id, status: 'ACCEPTED' })}
                  onDecline={() => updateLead.mutate({ id: lead.id, status: 'DECLINED' })}
                />
              ))}
            </div>
          )}
        </AdminPanel>
      )}

      {activeTab === 'tours' && (
        <AdminPanel title="Tour Requests" description="Approve or reject inspection bookings from tenants.">
          {bookingsLoading ? (
            <p className="py-8 text-center text-sm text-slate-400">Loading tour requests…</p>
          ) : bookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 py-12 text-center">
              <Clock className="mx-auto mb-3 h-8 w-8 text-slate-600" />
              <p className="text-slate-400">No tour requests yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card key={booking.id} className="border-slate-800 bg-slate-900">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10 border border-slate-700 bg-slate-800">
                          <AvatarFallback className="text-slate-300 text-sm">
                            {booking.tenant ? `${booking.tenant.firstName?.[0] ?? ''}${booking.tenant.lastName?.[0] ?? ''}`.toUpperCase() : 'T'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-white">
                            {booking.tenant ? `${booking.tenant.firstName} ${booking.tenant.lastName}` : 'Tenant'}
                          </p>
                          <p className="mt-0.5 text-sm text-violet-400">{booking.property?.title ?? 'Property'}</p>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{booking.date} at {booking.time}</span>
                            {booking.tenant?.phone && <span><Phone className="h-3 w-3 inline mr-1" />{booking.tenant.phone}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {booking.status === 'PENDING' ? (
                          <>
                            <Button
                              size="icon"
                              className="h-9 w-9 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                              onClick={() => updateBooking.mutate({ id: booking.id, status: 'REJECTED' })}
                              disabled={updateBooking.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              className="h-9 w-9 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                              onClick={() => updateBooking.mutate({ id: booking.id, status: 'APPROVED' })}
                              disabled={updateBooking.isPending}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <AdminTag
                            tone={
                              booking.status === 'APPROVED' ? 'success'
                              : booking.status === 'REJECTED' ? 'danger'
                              : 'info'
                            }
                          >
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
      )}
    </div>
  )
}
