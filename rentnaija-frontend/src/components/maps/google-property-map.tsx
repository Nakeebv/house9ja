'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Property } from '@/types'

declare global {
  interface Window {
    google?: any
  }
}

const GOOGLE_MAPS_SCRIPT_ID = 'rentnaija-google-maps'

type Bounds = {
  north: number
  south: number
  east: number
  west: number
}

type Props = {
  properties: Property[]
  center: { lat: number; lng: number }
  zoom: number
  onBoundsChange?: (bounds: Bounds) => void
  onCenterChange?: (center: { lat: number; lng: number; zoom: number }) => void
}

function loadGoogleMaps(apiKey: string): Promise<any> {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (window.google?.maps) return Promise.resolve(window.google.maps)

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID)
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google?.maps))
      existing.addEventListener('error', reject)
      return
    }
    const script = document.createElement('script')
    script.id = GOOGLE_MAPS_SCRIPT_ID
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
    script.async = true
    script.defer = true
    script.onload = () => resolve(window.google?.maps)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export function GooglePropertyMap({ properties, center, zoom, onBoundsChange, onCenterChange }: Props) {
  // Callback ref ensures the element is truly mounted in the DOM before we
  // hand it to Google Maps — avoids the IntersectionObserver crash in Strict Mode
  const [mapEl, setMapEl] = useState<HTMLDivElement | null>(null)
  const mapRef = useCallback((node: HTMLDivElement | null) => setMapEl(node), [])

  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const infoWindowRef = useRef<any>(null)
  const [mapError, setMapError] = useState(false)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY

  // Initialise map once the container element + API key are available
  useEffect(() => {
    if (!apiKey || !mapEl) return

    let cancelled = false

    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (!maps || cancelled || !mapEl) return

        // Guard: element must be a real DOM Element
        if (!(mapEl instanceof Element)) return

        const map = new maps.Map(mapEl, {
          center,
          zoom,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          styles: [
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          ],
        })

        infoWindowRef.current = new maps.InfoWindow()
        mapInstanceRef.current = map

        map.addListener('idle', () => {
          const bounds = map.getBounds()
          const currentCenter = map.getCenter()
          if (!bounds || !currentCenter) return

          const ne = bounds.getNorthEast()
          const sw = bounds.getSouthWest()
          onBoundsChange?.({ north: ne.lat(), south: sw.lat(), east: ne.lng(), west: sw.lng() })
          onCenterChange?.({ lat: currentCenter.lat(), lng: currentCenter.lng(), zoom: map.getZoom() ?? zoom })
        })
      })
      .catch(() => setMapError(true))

    return () => { cancelled = true }
    // Only reinitialise when the container element itself changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, mapEl])

  // Pan/zoom when center or zoom props change
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !window.google?.maps) return
    map.panTo(center)
    map.setZoom(zoom)
  }, [center, zoom])

  // Update markers when properties change
  useEffect(() => {
    const map = mapInstanceRef.current
    const maps = window.google?.maps
    if (!map || !maps) return

    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = properties.map((property) => {
      const marker = new maps.Marker({
        map,
        position: { lat: property.latitude, lng: property.longitude },
        title: property.title,
      })

      marker.addListener('click', () => {
        const img = property.images?.[0]
          ? `<img src="${property.images[0]}" alt="Property" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />`
          : ''
        const desc = property.description
          ? property.description.substring(0, 60) + '…'
          : 'Premium verified property available for rent.'

        infoWindowRef.current?.setContent(
          `<div style="max-width:240px;padding:4px;font-family:sans-serif">
            ${img}
            <div style="font-weight:700;font-size:15px;color:#0f172a;margin-bottom:2px">${property.title}</div>
            <div style="font-size:12px;color:#64748b;margin-bottom:6px">📍 ${property.location}</div>
            <div style="font-size:14px;color:#059669;font-weight:600;margin-bottom:6px">₦${property.price.toLocaleString()}/month</div>
            <div style="font-size:12px;color:#475569;line-height:1.4">${desc}</div>
          </div>`,
        )
        infoWindowRef.current?.open({ anchor: marker, map })
      })

      return marker
    })

    return () => {
      markersRef.current.forEach((m) => m.setMap(null))
      markersRef.current = []
    }
  }, [properties])

  if (!apiKey) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-100/80 p-6 text-center text-sm text-slate-500 md:h-[420px]">
        Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the live Google Map.
      </div>
    )
  }

  if (mapError) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-100/80 p-6 text-center text-sm text-slate-500 md:h-[420px]">
        Google Maps could not be loaded. Property results still work below.
      </div>
    )
  }

  return <div ref={mapRef} className="h-[320px] w-full rounded-3xl md:h-[420px]" />
}
