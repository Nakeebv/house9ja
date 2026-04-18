'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PlusCircle, Search, Trash2, DoorClosed, DoorOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { AdminTag, AdminPanel } from '@/components/admin/admin-shell'
import { propertyService } from '@/lib/services/property-service'

export default function LandlordPropertiesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const queryClient = useQueryClient()

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['landlord-properties'],
    queryFn: () => propertyService.getMyListings(),
  })

  const removeProperty = useMutation({
    mutationFn: (propertyId: string) => propertyService.delete(propertyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['landlord-properties'] }),
  })

  const markRented = useMutation({
    mutationFn: (id: string) => propertyService.markRented(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['landlord-properties'] }),
  })

  const markAvailable = useMutation({
    mutationFn: (id: string) => propertyService.markAvailable(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['landlord-properties'] }),
  })

  const filteredProperties = useMemo(
    () =>
      properties.filter((property) =>
        [property.title, property.location, property.address].join(' ').toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [properties, searchQuery],
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">My Properties</h1>
          <p className="mt-2 text-sm text-slate-400">Manage your active and pending property listings.</p>
        </div>
        <Link href="/landlord/properties/new">
          <Button className="bg-blue-600 text-white hover:bg-blue-500 rounded-2xl h-11 px-6">
            <PlusCircle className="mr-2 h-5 w-5" />
            Add New Listing
          </Button>
        </Link>
      </div>

      <AdminPanel title="Your Listings" description="View and maintain the live properties tied to your account.">
        <div className="mb-6 relative max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search your properties..."
            className="h-11 rounded-2xl border-slate-800 bg-slate-900 pl-11 text-white placeholder:text-slate-500"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        {isLoading ? (
          <p className="text-slate-400 text-sm py-4">Loading your properties...</p>
        ) : !filteredProperties.length ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-6 text-sm text-slate-400">
            No properties found. Add your first listing to start managing live inventory here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Title</TableHead>
                  <TableHead className="text-slate-400">Location</TableHead>
                  <TableHead className="text-slate-400">Price</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400 text-center">Views</TableHead>
                  <TableHead className="text-right text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.map((property) => (
                  <TableRow key={property.id} className="border-slate-800 hover:bg-slate-900/80">
                    <TableCell className="font-medium text-white max-w-[200px] truncate">{property.title}</TableCell>
                    <TableCell className="text-slate-400 whitespace-nowrap">{property.location}</TableCell>
                    <TableCell className="text-slate-300 whitespace-nowrap">₦{property.price.toLocaleString()}/mo</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <AdminTag tone={property.isVerified ? 'success' : 'warning'}>
                          {property.isVerified ? 'Approved' : 'Pending'}
                        </AdminTag>
                        <AdminTag tone={property.status === 'rented' ? 'danger' : 'info'}>
                          {property.status === 'rented' ? 'Rented' : 'Available'}
                        </AdminTag>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-slate-400">{property.views}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {property.status === 'rented' ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Mark as available"
                            className="text-emerald-400 hover:bg-emerald-950 hover:text-emerald-300"
                            onClick={() => markAvailable.mutate(property.id)}
                            disabled={markAvailable.isPending}
                          >
                            <DoorOpen className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Mark as rented"
                            className="text-amber-400 hover:bg-amber-950 hover:text-amber-300"
                            onClick={() => markRented.mutate(property.id)}
                            disabled={markRented.isPending}
                          >
                            <DoorClosed className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-rose-400 hover:bg-rose-950 hover:text-rose-300"
                          onClick={() => removeProperty.mutate(property.id)}
                          disabled={removeProperty.isPending}
                        >
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
