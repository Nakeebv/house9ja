import { api } from '@/lib/api'
import type { Property } from '@/types'
import { normalizeProperty } from './property-service'

export const favoritesService = {
  /** Toggle favorite on/off; returns { action: 'added' | 'removed' } */
  async toggle(propertyId: string): Promise<{ action: 'added' | 'removed' }> {
    const res = await api.post<any>(`/favorites/${propertyId}`)
    return res?.data ?? res
  },

  /** Check if a property is favorited by the current user */
  async check(propertyId: string): Promise<boolean> {
    const res = await api.get<any>(`/favorites/${propertyId}/check`)
    return res?.saved ?? res?.isFavorited ?? false
  },

  /** Get all favorited properties for the current user */
  async getMyFavorites(): Promise<Property[]> {
    const res = await api.get<any>('/favorites/me')
    const items: any[] = Array.isArray(res) ? res : (res?.data ?? [])
    // Backend returns Favorite records; each contains a nested `property`
    return items.map((fav: any) => normalizeProperty(fav.property ?? fav))
  },
}
