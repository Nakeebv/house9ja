'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PlusCircle, Search, Trash2, Eye, DoorClosed, DoorOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { AdminTag, AdminPanel } from '@/components/admin/admin-shell'
import { propertyService } from '@/lib/services/property-service'

export default function AgentPropertiesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const queryClient = useQueryClient()

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['agent-properties'],
    queryFn: () => propertyService.getMyListings(),
  })

  const removeProperty = useMutation({
    mutationFn: (propertyId: string) => propertyService.delete(propertyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agent-properties'] }),
  })

  const markRented = useMutation({
    mutationFn: (id: string) => propertyService.markRented(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agent-properties'] }),
  })

  const markAvailable = useMutation({
    mutationFn: (id: string) => propertyService.markAvailable(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agent-properties'] }),
  })

  const filteredProperties = useMemo(
    () =>
      properties.filter((p) =>
        [p.title, p.location, p.address].join(' ').toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [properties, searchQuery],
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">My Listings</h1>
          <p className="mt-2 text-sm text-slate-400">All properties you have posted as an agent.</p>
        </div>
        <Link href="/agent/properties/new">
          <Button className="bg-violet-600 text-white hover:bg-violet-500 rounded-2xl h-11 px-6">
            <PlusCircle className="mr-2 h-5 w-5" />
            Add New Listing
          </Button>
        </Link>
      </div>

      <AdminPanel title="Your Listings" description="Search, view and manage the properties tied to your account.">
        <div className="mb-6 relative max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search your listings..."
            className="h-11 rounded-2xl border-slate-800 bg-slate-900 pl-11 text-white placeholder:text-slate-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isLoading ? (
          <p className="text-slate-400 text-sm py-4">Loading listings…</p>
        ) : !filteredProperties.length ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-10 text-center">
            <p className="text-slate-400 text-sm">No listings yet. Add your first property to start receiving leads.</p>
            <Link href="/agent/properties/new">
              <Button className="mt-4 bg-violet-600 text-white hover:bg-violet-500 rounded-xl" size="sm">
                Add Listing
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Title</TableHead>
                  <TableHead className="text-slate-400">Location</TableHead>
                  <TableHead className="text-slate-400">Rent</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400 text-center">Views</TableHead>
                  <TableHead className="text-right text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.map((p) => (
                  <TableRow key={p.id} className="border-slate-800 hover:bg-slate-900/80">
                    <TableCell className="font-medium text-white max-w-[200px] truncate">{p.title}</TableCell>
                    <TableCell className="text-slate-400 whitespace-nowrap">{p.location}</TableCell>
                    <TableCell className="text-slate-300 whitespace-nowrap">₦{p.price.toLocaleString()}/mo</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <AdminTag tone={p.isVerified ? 'success' : 'warning'}>
                          {p.isVerified ? 'Approved' : 'Pending'}
                        </AdminTag>
                        <AdminTag tone={p.status === 'rented' ? 'danger' : 'info'}>
                          {p.status === 'rented' ? 'Rented' : 'Available'}
                        </AdminTag>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-slate-400">{p.views}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild
                          className="text-slate-400 hover:bg-slate-800 hover:text-white" title="View listing">
                          <Link href={`/property/${p.id}`}><Eye className="h-4 w-4" /></Link>
                        </Button>
                        {p.status === 'rented' ? (
                          <Button variant="ghost" size="icon" title="Mark as available"
                            className="text-emerald-400 hover:bg-emerald-950 hover:text-emerald-300"
                            onClick={() => markAvailable.mutate(p.id)} disabled={markAvailable.isPending}>
                            <DoorOpen className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" title="Mark as rented"
                            className="text-amber-400 hover:bg-amber-950 hover:text-amber-300"
                            onClick={() => markRented.mutate(p.id)} disabled={markRented.isPending}>
                            <DoorClosed className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" title="Delete listing"
                          className="text-rose-400 hover:bg-rose-950 hover:text-rose-300"
                          onClick={() => removeProperty.mutate(p.id)} disabled={removeProperty.isPending}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </AdminPanel>
    </div>
  )
}
