'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, CheckCircle2, XCircle, Eye, Building2, MapPin } from 'lucide-react'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminPageHeader, AdminTag } from '@/components/admin/admin-shell'
import { adminService } from '@/lib/services/admin-service'
import Link from 'next/link'

type Filter = 'ALL' | 'PENDING' | 'APPROVED' | 'CHANGES'

export default function AdminProperties() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('ALL')
  const queryClient = useQueryClient()

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['admin-properties'],
    queryFn: () => adminService.getProperties(),
  })

  const approve = useMutation({
    mutationFn: (id: string) => adminService.approveProperty(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-properties'] }),
  })

  const reject = useMutation({
    mutationFn: (id: string) => adminService.rejectProperty(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-properties'] }),
  })

  const filtered = useMemo(() => {
    let list = properties
    if (filter === 'PENDING') list = list.filter((p) => !p.isVerified && !(p as any).hasPendingEdits)
    if (filter === 'APPROVED') list = list.filter((p) => p.isVerified && !(p as any).hasPendingEdits)
    if (filter === 'CHANGES') list = list.filter((p) => (p as any).hasPendingEdits)
    if (search) list = list.filter((p) => [p.title, p.location, p.address].join(' ').toLowerCase().includes(search.toLowerCase()))
    return list
  }, [properties, filter, search])

  const counts = {
    all: properties.length,
    pending: properties.filter((p) => !p.isVerified && !(p as any).hasPendingEdits).length,
    approved: properties.filter((p) => p.isVerified && !(p as any).hasPendingEdits).length,
    changes: properties.filter((p) => (p as any).hasPendingEdits).length,
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Moderation"
        title="Property Listings"
        description="Review, approve, or reject listings submitted by agents and landlords."
      />

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3">
        {([['ALL', counts.all, 'text-white', 'border-slate-700'], ['PENDING', counts.pending, 'text-amber-300', 'border-amber-500/30'], ['APPROVED', counts.approved, 'text-emerald-300', 'border-emerald-500/30'], ['CHANGES', counts.changes, 'text-blue-300', 'border-blue-500/30']] as const).map(([key, count, color, border]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-2xl border px-4 py-3 text-left transition ${filter === key ? 'bg-slate-800 ' + border : 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/60'}`}
          >
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
            <p className="mt-0.5 text-xs text-slate-400 capitalize">{key === 'ALL' ? 'Total' : key === 'CHANGES' ? 'Edit Requests' : key.toLowerCase()}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          placeholder="Search by title, location, address…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 border-slate-800 bg-slate-900 pl-11 text-white placeholder:text-slate-500"
        />
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 py-16 text-center">
          <Building2 className="mx-auto mb-3 h-8 w-8 text-slate-600" />
          <p className="text-slate-400">No listings match the current filter.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((property) => (
            <article key={property.id} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 transition hover:border-slate-700">
              {/* Thumbnail */}
              <div className="relative h-40 bg-slate-800">
                {property.images?.[0] ? (
                  <Image src={property.images[0]} alt={property.title} fill className="object-cover" sizes="400px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-600">
                    <Building2 className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute right-2 top-2 flex flex-col gap-1 items-end">
                  <AdminTag tone={property.isVerified ? 'success' : 'warning'}>
                    {property.isVerified ? 'Approved' : 'Pending'}
                  </AdminTag>
                  {(property as any).hasPendingEdits && (
                    <AdminTag tone="info">Edit Request</AdminTag>
                  )}
                </div>
              </div>

              <div className="p-4">
                <h3 className="truncate font-semibold text-white">{property.title}</h3>
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                  <MapPin className="h-3 w-3" />
                  {property.location ?? property.address}
                </div>
                <div className="mt-1 text-sm font-medium text-emerald-400">
                  ₦{property.price?.toLocaleString()}<span className="text-xs text-slate-500">/{(property as any).priceType === 'DAILY' ? 'day' : (property as any).priceType === 'MONTHLY' ? 'mo' : 'yr'}</span>
                </div>
                {(property as any).hasPendingEdits && (property as any).pendingData && (
                  <div className="mt-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2 text-xs text-blue-300 space-y-0.5">
                    <p className="font-semibold text-blue-200 mb-1">Proposed changes:</p>
                    {Object.entries((property as any).pendingData as Record<string, any>)
                      .filter(([k]) => !['images', 'features', 'latitude', 'longitude'].includes(k))
                      .slice(0, 4)
                      .map(([k, v]) => (
                        <p key={k}><span className="text-slate-400">{k}:</span> {String(v)}</p>
                      ))}
                  </div>
                )}
                {(property as any).landlord && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <UserAvatar
                      src={(property as any).landlord.avatarUrl}
                      name={`${(property as any).landlord.firstName} ${(property as any).landlord.lastName}`}
                      size={22}
                      isVerified={(property as any).landlord.isVerified}
                      gradient="from-emerald-500 to-teal-600"
                    />
                    <p className="text-xs text-slate-400">
                      {(property as any).landlord.firstName} {(property as any).landlord.lastName}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2">
                  <Button asChild size="sm" variant="ghost" className="h-8 text-slate-400 hover:bg-slate-800 hover:text-white">
                    <Link href={`/property/${property.id}`} target="_blank">
                      <Eye className="mr-1.5 h-3.5 w-3.5" /> Preview
                    </Link>
                  </Button>

                  {(property as any).hasPendingEdits ? (
                    <>
                      <Button
                        size="sm"
                        className="h-8 flex-1 bg-blue-600 text-white hover:bg-blue-500"
                        onClick={() => approve.mutate(property.id)}
                        disabled={approve.isPending}
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Approve Changes
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-rose-400 hover:bg-rose-500/10"
                        onClick={() => reject.mutate(property.id)}
                        disabled={reject.isPending}
                      >
                        Reject
                      </Button>
                    </>
                  ) : !property.isVerified ? (
                    <Button
                      size="sm"
                      className="h-8 flex-1 bg-emerald-600 text-white hover:bg-emerald-500"
                      onClick={() => approve.mutate(property.id)}
                      disabled={approve.isPending}
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Approve
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="h-8 flex-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                      onClick={() => reject.mutate(property.id)}
                      disabled={reject.isPending}
                    >
                      <XCircle className="mr-1.5 h-3.5 w-3.5" /> Revoke
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
