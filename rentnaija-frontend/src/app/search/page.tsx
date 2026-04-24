'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Search, SlidersHorizontal, Heart, ShieldCheck } from 'lucide-react'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GooglePropertyMap } from '@/components/maps/google-property-map'
import { propertyService } from '@/lib/services/property-service'
import { favoritesService } from '@/lib/services/favorites-service'
import { useAuth } from '@/lib/auth-context'
import { NIGERIA_STATES } from '@/lib/nigeria-locations'

const defaultCenter = { lat: 6.5244, lng: 3.3792, zoom: 10 }

export default function SearchPage() {
  const { user } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    type: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    location: '',
    state: '',
    city: '',
  })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [mapState, setMapState] = useState(defaultCenter)
  const [bounds, setBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null)

  const resolvedLocation = useMemo(
    () => filters.city || filters.state || filters.location || searchQuery,
    [filters.city, filters.state, filters.location, searchQuery],
  )

  const availableCities = useMemo(
    () => NIGERIA_STATES.find((s) => s.name === filters.state)?.cities ?? [],
    [filters.state],
  )

  const { data: searchResult, isLoading } = useQuery({
    queryKey: ['properties', searchQuery, filters, mapState, bounds],
    queryFn: async () => {
      const geocoded = resolvedLocation ? await propertyService.geocodeLocation(resolvedLocation) : null
      if (geocoded) {
        setMapState({ lat: geocoded.latitude, lng: geocoded.longitude, zoom: geocoded.zoom })
      }
      return propertyService.search({
        query: searchQuery,
        location: resolvedLocation,
        type: filters.type,
        minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
        bedrooms: filters.bedrooms ? Number(filters.bedrooms) : undefined,
        state: filters.state || undefined,
        city: filters.city || undefined,
        latitude: geocoded?.latitude ?? mapState.lat,
        longitude: geocoded?.longitude ?? mapState.lng,
        radiusKm: 30,
        bounds,
      })
    },
  })

  const properties = searchResult?.properties ?? []

  const toggleFavorite = useMutation({
    mutationFn: (propertyId: string) => favoritesService.toggle(propertyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  })

  const handleSaveHome = (propertyId: string) => {
    if (!user) {
      router.push('/login')
      return
    }
    toggleFavorite.mutate(propertyId)
  }

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-[1fr_auto] xl:grid-cols-[1.5fr_1fr_auto]">
            <div className="relative sm:col-span-1 xl:col-span-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by city, neighborhood, or property type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-10 text-base"
              />
            </div>
            <Input
              placeholder="Map location, e.g. Lagos"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="h-12 text-base hidden xl:block"
            />
            <Button variant="outline" className="h-12" onClick={() => setFiltersOpen((v) => !v)}>
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-6">
            {/* Mobile location field (hidden in top bar on small screens) */}
            <div className="xl:hidden">
              <Input
                placeholder="Map location, e.g. Lagos"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="h-12 text-base"
              />
            </div>

            {/* Filter panel — always visible on xl, collapsible below */}
            <div className={filtersOpen ? 'block' : 'hidden xl:block'}>
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="space-y-4 p-5">
                  <div>
                    <label className="text-sm font-medium text-slate-700">State</label>
                    <select
                      value={filters.state}
                      onChange={(e) => {
                        handleFilterChange('state', e.target.value)
                        handleFilterChange('city', '')
                      }}
                      className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                    >
                      <option value="">All states</option>
                      {NIGERIA_STATES.map((s) => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  {availableCities.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-slate-700">City / Area</label>
                      <select
                        value={filters.city}
                        onChange={(e) => handleFilterChange('city', e.target.value)}
                        className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                      >
                        <option value="">All cities</option>
                        {availableCities.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-slate-700">Property Type</label>
                    <select
                      value={filters.type}
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                      className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                    >
                      <option value="">Any type</option>
                      <option value="APARTMENT">Apartment</option>
                      <option value="DUPLEX">Duplex</option>
                      <option value="SELF_CONTAINED">Self Contained</option>
                      <option value="BUNGALOW">Bungalow</option>
                      <option value="SHARED_APARTMENT">Shared Apartment</option>
                      <option value="STUDENT_HOUSING">Student Housing</option>
                      <option value="HOSTEL">Hostel</option>
                      <option value="TERRACE">Terrace</option>
                      <option value="MANSIONETTE">Mansionette</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Price Range</label>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      <Input placeholder="Min" value={filters.minPrice} onChange={(e) => handleFilterChange('minPrice', e.target.value)} />
                      <Input placeholder="Max" value={filters.maxPrice} onChange={(e) => handleFilterChange('maxPrice', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Bedrooms</label>
                    <select
                      value={filters.bedrooms}
                      onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                      className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                    >
                      <option value="">Any</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </div>

            <GooglePropertyMap
              properties={properties}
              center={{ lat: mapState.lat, lng: mapState.lng }}
              zoom={mapState.zoom}
              onBoundsChange={setBounds}
              onCenterChange={(next) => setMapState(next)}
            />
          </div>

          <div className="space-y-4">
            {/* Result count bar */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {properties.length} {properties.length === 1 ? 'home' : 'homes'} available
                </h2>
                <p className="text-xs text-slate-500">{resolvedLocation || 'All locations'}</p>
              </div>
            </div>

            {isLoading ? (
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-52 animate-pulse rounded-2xl bg-white shadow-sm" />
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
                <p className="text-slate-500">No properties match your search.</p>
                <p className="mt-1 text-sm text-slate-400">Try adjusting your filters or location.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {properties.map((property) => (
                  <Link key={property.id} href={`/property/${property.id}`} className="group block">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md">
                      <div className="grid md:grid-cols-[260px_minmax(0,1fr)]">
                        {/* Image */}
                        <div className="relative min-h-[200px] overflow-hidden bg-slate-100 md:min-h-[180px]">
                          <Image
                            src={property.images[0] ?? '/hero/img-a1.png'}
                            alt={property.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 260px"
                            className="object-cover transition duration-300 group-hover:scale-[1.02]"
                          />
                          {/* Save button */}
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); handleSaveHome(property.id) }}
                            disabled={toggleFavorite.isPending}
                            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:scale-110 hover:bg-white"
                            title={user ? 'Save' : 'Log in to save'}
                          >
                            <Heart className="h-4 w-4 text-slate-400 hover:text-rose-500" />
                          </button>
                          {/* Status pill */}
                          {property.status !== 'available' && (
                            <span className="absolute bottom-3 left-3 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-medium text-white">
                              Rented
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex flex-col justify-between p-5">
                          <div>
                            {/* Price */}
                            <p className="text-xl font-bold text-slate-900">
                              ₦{property.price.toLocaleString()}
                              <span className="text-sm font-normal text-slate-400">
                                /{(property as any).priceType === 'DAILY' ? 'day' : (property as any).priceType === 'MONTHLY' ? 'mo' : 'yr'}
                              </span>
                            </p>

                            {/* Title */}
                            <h3 className="mt-1 text-base font-semibold text-slate-800 leading-snug group-hover:text-rose-600 transition-colors">
                              {property.title}
                            </h3>

                            {/* Location */}
                            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                              {property.location}
                            </p>

                            {/* Specs row */}
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-sm text-slate-600">
                              <span className="font-medium">{property.bedrooms} <span className="font-normal text-slate-400">bed</span></span>
                              <span className="font-medium">{property.bathrooms} <span className="font-normal text-slate-400">bath</span></span>
                              <span className="capitalize text-slate-500">{property.propertyType.replace(/_/g, ' ').toLowerCase()}</span>
                              {property.furnishing !== 'UNFURNISHED' && (
                                <span className="capitalize text-slate-500">{property.furnishing.replace(/_/g, ' ').toLowerCase()}</span>
                              )}
                            </div>
                          </div>

                          {/* Bottom row — owner identity + trust signals */}
                          <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                            {/* Owner avatar + name + badge */}
                            {property.landlord && (
                              <div className="flex items-center gap-2 min-w-0">
                                <UserAvatar
                                  src={property.landlord.avatarUrl}
                                  name={property.landlord.name}
                                  size={28}
                                  isVerified={property.landlord.isVerified}
                                  gradient="from-emerald-500 to-teal-600"
                                />
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-medium text-slate-700">{property.landlord.name}</p>
                                  {property.landlord.isVerified && (
                                    <p className="flex items-center gap-0.5 text-[10px] text-blue-600 font-medium">
                                      <ShieldCheck className="h-2.5 w-2.5" /> Verified
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                            <span className="shrink-0 text-xs font-medium text-rose-600 transition group-hover:underline">
                              View details →
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
