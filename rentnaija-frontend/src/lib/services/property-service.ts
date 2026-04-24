import { ApiError, api } from '@/lib/api'
import { knownLocations } from '@/lib/locations'
import type { GeocodedLocation, Property, PropertySearchParams } from '@/types'

/**
 * Maps a raw backend property record to the frontend Property shape.
 * Backend fields: title, description, address, state, city, area (string=neighbourhood),
 * propertyType, monthlyRent, furnishing, isAvailable, isVerified, isFlagged,
 * images[], features[], latitude, longitude, views, landlord { firstName, lastName, ... }
 */
export function normalizeProperty(item: any): Property {
  const firstName = item.landlord?.firstName ?? ''
  const lastName = item.landlord?.lastName ?? ''

  return {
    id: String(item.id ?? ''),
    title: item.title ?? 'Untitled property',
    description: item.description ?? '',
    address: item.address ?? '',
    area: item.area ?? '',
    city: item.city ?? '',
    state: item.state ?? '',
    location: [item.area, item.city, item.state].filter(Boolean).join(', '),
    price: Number(item.monthlyRent ?? item.price ?? 0),
    bedrooms: Number(item.bedrooms ?? 0),
    bathrooms: Number(item.bathrooms ?? 0),
    propertyType: item.propertyType ?? '',
    furnishing: item.furnishing ?? 'UNFURNISHED',
    priceType: item.priceType ?? 'YEARLY',
    images: Array.isArray(item.images) ? item.images : [],
    features: Array.isArray(item.features) ? item.features : [],
    status: item.isAvailable === false ? 'rented' : 'available',
    isVerified: item.isVerified ?? false,
    isFlagged: item.isFlagged ?? false,
    petAllowed: item.petAllowed ?? false,
    maxGuests: item.maxGuests ?? undefined,
    hasPendingEdits: item.hasPendingEdits ?? false,
    pendingData: item.pendingData ?? undefined,
    latitude: Number(item.latitude ?? 0),
    longitude: Number(item.longitude ?? 0),
    views: Number(item.views ?? 0),
    landlord: {
      id: item.landlord?.id ?? '',
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim() || 'Property Manager',
      phone: item.landlord?.phone ?? '',
      email: item.landlord?.email ?? '',
      isVerified: item.landlord?.isVerified ?? false,
      isVerifiedLandlord: item.landlord?.isVerifiedLandlord ?? false,
      avatarUrl: item.landlord?.avatarUrl ?? null,
    },
    createdAt: item.createdAt ?? new Date().toISOString(),
  }
}

export const propertyService = {
  async search(params: PropertySearchParams): Promise<{ properties: Property[]; total: number; page: number; pages: number }> {
    const query = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return

      if (key === 'bounds') {
        const bounds = value as NonNullable<PropertySearchParams['bounds']>
        query.set('north', String(bounds.north))
        query.set('south', String(bounds.south))
        query.set('east', String(bounds.east))
        query.set('west', String(bounds.west))
        return
      }

      query.set(key, String(value))
    })

    const response = await api.get<any>(`/properties${query.size ? `?${query.toString()}` : ''}`)
    const items: any[] = Array.isArray(response?.properties)
      ? response.properties
      : Array.isArray(response)
        ? response
        : []

    return {
      properties: items.map(normalizeProperty),
      total: response?.total ?? items.length,
      page: response?.page ?? 1,
      pages: response?.pages ?? 1,
    }
  },

  async getById(id: string): Promise<Property | null> {
    try {
      const response = await api.get<any>(`/properties/${id}`)
      return normalizeProperty(response?.data ?? response)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null
      throw error
    }
  },

  async getMyListings(): Promise<Property[]> {
    const response = await api.get<any[]>('/properties/landlord/me')
    const items = Array.isArray(response) ? response : []
    return items.map(normalizeProperty)
  },

  async create(data: {
    title: string
    description: string
    address: string
    state: string
    city: string
    area: string
    propertyType: string
    bedrooms: number
    bathrooms: number
    furnishing: string
    monthlyRent: number
    priceType?: string
    latitude: number
    longitude: number
    images?: string[]
    features?: string[]
    petAllowed?: boolean
    maxGuests?: number
  }): Promise<Property> {
    const response = await api.post<any>('/properties', data)
    return normalizeProperty(response?.data ?? response)
  },

  async update(id: string, data: {
    title?: string
    description?: string
    address?: string
    state?: string
    city?: string
    area?: string
    propertyType?: string
    bedrooms?: number
    bathrooms?: number
    furnishing?: string
    monthlyRent?: number
    priceType?: string
    latitude?: number
    longitude?: number
    images?: string[]
    features?: string[]
    petAllowed?: boolean
    maxGuests?: number
  }): Promise<Property> {
    const response = await api.patch<any>(`/properties/${id}`, data)
    return normalizeProperty(response?.data ?? response)
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/properties/${id}`)
  },

  async markRented(id: string): Promise<void> {
    await api.patch(`/properties/${id}/rented`)
  },

  async markAvailable(id: string): Promise<void> {
    await api.patch(`/properties/${id}/available`)
  },

  async geocodeLocation(query: string): Promise<GeocodedLocation | null> {
    const match = knownLocations.find((loc) =>
      loc.label.toLowerCase().includes(query.toLowerCase()),
    )
    return match ?? null
  },
}
