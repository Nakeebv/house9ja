'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Heart } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { RequireAuth } from '@/components/auth/require-auth'
import { favoritesService } from '@/lib/services/favorites-service'

export default function SavedHomesPage() {
  const queryClient = useQueryClient()

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesService.getMyFavorites(),
  })

  const removeFavorite = useMutation({
    mutationFn: (propertyId: string) => favoritesService.toggle(propertyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  })

  return (
    <RequireAuth roles={['TENANT']}>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-semibold text-white">Saved Homes</h1>
          <p className="mt-2 text-sm text-slate-400">Properties you have favorited for quick access.</p>
        </div>

      {isLoading ? (
        <div className="text-slate-400 text-sm py-12 text-center">Loading saved properties...</div>
      ) : properties.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-12 text-center">
          <Heart className="mx-auto h-12 w-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white">No saved homes yet</h3>
          <p className="text-slate-400 mt-2 mb-6">Find your dream home and click the heart icon to save it here.</p>
          <Link href="/search">
            <Button className="bg-indigo-600 text-white hover:bg-indigo-500">Browse Properties</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden border-slate-800 bg-slate-900/50 shadow-sm transition hover:border-slate-700 hover:bg-slate-900">
              <div className="grid gap-0 md:grid-cols-[280px_minmax(0,1fr)]">
                <div className="relative min-h-[220px] bg-slate-800">
                  {property.images[0] && (
                    <Image
                      src={property.images[0]}
                      alt={property.title}
                      fill
                      className="object-cover"
                      sizes="280px"
                    />
                  )}
                  <div className="absolute right-2 top-2 z-10 flex gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-white text-rose-500 shadow-md"
                      onClick={() => removeFavorite.mutate(property.id)}
                      disabled={removeFavorite.isPending}
                    >
                      <Heart className="h-4 w-4 fill-rose-500" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col justify-between p-5">
                  <div>
                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <h3 className="text-xl font-semibold text-white">{property.title}</h3>
                      <Badge variant="default" className="bg-emerald-500 text-emerald-950">{property.status}</Badge>
                    </div>
                    <div className="mb-3 flex items-center text-slate-400">
                      <MapPin className="mr-1 h-4 w-4" />
                      {property.location}
                    </div>
                    <div className="mb-4 flex flex-wrap gap-3 text-sm text-slate-400">
                      <span className="bg-slate-800 px-2 py-1 rounded-md">{property.bedrooms} bed</span>
                      <span className="bg-slate-800 px-2 py-1 rounded-md">{property.bathrooms} bath</span>
                      <span className="bg-slate-800 px-2 py-1 rounded-md uppercase tracking-wider text-xs flex items-center">{property.propertyType}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-2xl font-bold text-emerald-400">₦{property.price.toLocaleString()}/mo</div>
                    <Button asChild className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl">
                      <Link href={`/property/${property.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      </div>
    </RequireAuth>
  )
}
