'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Save, ArrowLeft, ShieldAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminPanel } from '@/components/admin/admin-shell'
import Link from 'next/link'
import { propertyService } from '@/lib/services/property-service'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'

declare global {
  interface Window {
    google: any
    initPlacesAutocomplete?: () => void
  }
}

const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'DUPLEX', label: 'Duplex' },
  { value: 'BUNGALOW', label: 'Bungalow' },
  { value: 'SELF_CONTAINED', label: 'Self Contained' },
  { value: 'SHARED_APARTMENT', label: 'Shared Apartment' },
  { value: 'STUDENT_HOUSING', label: 'Student Housing' },
  { value: 'HOSTEL', label: 'Hostel' },
  { value: 'TERRACE', label: 'Terrace' },
  { value: 'MANSIONETTE', label: 'Mansionette' },
  { value: 'OFFICE', label: 'Office' },
]

const FURNISHING_OPTIONS = [
  { value: 'UNFURNISHED', label: 'Unfurnished' },
  { value: 'SEMI_FURNISHED', label: 'Semi-Furnished' },
  { value: 'FURNISHED', label: 'Fully Furnished' },
]

const PRICE_TYPES = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
]

const PRICE_LABELS: Record<string, string> = {
  DAILY: 'Price per Day (₦)',
  MONTHLY: 'Monthly Rent (₦)',
  YEARLY: 'Yearly Rent (₦)',
}

type UploadedImage = { url: string; publicId: string; name: string }

export default function AddListingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [images, setImages] = useState<UploadedImage[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    propertyType: 'APARTMENT',
    priceType: 'YEARLY',
    monthlyRent: '',
    state: '',
    city: '',
    area: '',
    address: '',
    bedrooms: '1',
    bathrooms: '1',
    furnishing: 'UNFURNISHED',
    latitude: '',
    longitude: '',
  })

  const addressRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  // ── Google Places Autocomplete ────────────────────────────────────────────
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return

    const initAutocomplete = () => {
      if (!addressRef.current || !window.google?.maps?.places) return
      const ac = new window.google.maps.places.Autocomplete(addressRef.current, {
        componentRestrictions: { country: 'ng' },
        fields: ['formatted_address', 'geometry', 'address_components'],
      })
      autocompleteRef.current = ac

      ac.addListener('place_changed', () => {
        const place = ac.getPlace()
        if (!place.geometry?.location) return

        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        const components = place.address_components ?? []

        const get = (type: string) =>
          components.find((c: any) => c.types.includes(type))?.long_name ?? ''

        const state  = get('administrative_area_level_1')
        const city   = get('locality') || get('administrative_area_level_2')
        const area   = get('sublocality_level_1') || get('neighborhood') || get('sublocality')

        setForm((prev) => ({
          ...prev,
          address:   place.formatted_address ?? prev.address,
          latitude:  String(lat),
          longitude: String(lng),
          state:     state  || prev.state,
          city:      city   || prev.city,
          area:      area   || prev.area,
        }))
      })
    }

    if (window.google?.maps?.places) {
      initAutocomplete()
      return
    }

    const scriptId = 'google-maps-places'
    if (document.getElementById(scriptId)) {
      document.getElementById(scriptId)!.addEventListener('load', initAutocomplete)
      return
    }

    window.initPlacesAutocomplete = initAutocomplete
    const script = document.createElement('script')
    script.id = scriptId
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initPlacesAutocomplete`
    script.async = true
    document.head.appendChild(script)
  }, [])

  // ── Signed image upload ───────────────────────────────────────────────────
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    setIsUploading(true)
    setError('')

    try {
      const { signature, timestamp, api_key, cloud_name } = await api.post<any>('/upload/sign', { folder: 'properties' })

      const uploaded = await Promise.all(
        files.map(async (file) => {
          const body = new FormData()
          body.append('file', file)
          body.append('folder', 'properties')
          body.append('timestamp', String(timestamp))
          body.append('api_key', api_key)
          body.append('signature', signature)

          const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
            method: 'POST',
            body,
          })
          const payload = await res.json()
          if (!res.ok) throw new Error(payload?.error?.message || 'Upload failed')

          return {
            url: payload.secure_url as string,
            publicId: payload.public_id as string,
            name: file.name,
          }
        }),
      )

      setImages((prev) => [...prev, ...uploaded])
    } catch (err: any) {
      setError(err?.message || 'Failed to upload images.')
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  const removeImage = (publicId: string) =>
    setImages((prev) => prev.filter((img) => img.publicId !== publicId))

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const rent = Number(form.monthlyRent)
    if (!rent || rent <= 0) { setError('Enter a valid rent amount.'); return }
    if (images.length === 0) { setError('Upload at least one photo.'); return }

    setIsSubmitting(true)
    setError('')

    try {
      await propertyService.create({
        title:        form.title,
        description:  form.description,
        propertyType: form.propertyType,
        priceType:    form.priceType,
        monthlyRent:  rent,
        state:        form.state,
        city:         form.city,
        area:         form.area,
        address:      form.address,
        bedrooms:     Number(form.bedrooms),
        bathrooms:    Number(form.bathrooms),
        furnishing:   form.furnishing,
        latitude:     Number(form.latitude) || 0,
        longitude:    Number(form.longitude) || 0,
        images:       images.map((i) => i.url),
      })
      router.push('/landlord/properties')
    } catch (err: any) {
      setError(err?.message || 'Failed to create listing.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 text-slate-400">
        <Link href="/landlord/properties">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <span className="text-sm">Back to properties</span>
      </div>

      <div>
        <h1 className="text-3xl font-semibold text-white">Add New Listing</h1>
        <p className="mt-2 text-sm text-slate-400">Fill in details to attract the right tenants.</p>
      </div>

      {user && !user.isVerified && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="font-medium text-amber-300">Account not verified</p>
            <p className="mt-0.5 text-sm text-amber-400/80">
              Complete identity verification before publishing listings.{' '}
              <Link href="/verify" className="underline hover:text-amber-200">Start →</Link>
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Basic Details ── */}
        <AdminPanel title="Basic Details" description="Title and description will be visible on the marketplace.">
          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Property Title</label>
              <Input required value={form.title} onChange={set('title')} placeholder="e.g. 3BR Luxury Apartment in Lekki" className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Description</label>
              <textarea required rows={4} value={form.description} onChange={set('description')} placeholder="Describe the property, features, and neighbourhood…" className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Property Type</label>
                <select value={form.propertyType} onChange={set('propertyType')} className="flex h-12 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-white">
                  {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Furnishing</label>
                <select value={form.furnishing} onChange={set('furnishing')} className="flex h-12 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-white">
                  {FURNISHING_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Billing Cycle</label>
                <select value={form.priceType} onChange={set('priceType')} className="flex h-12 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-white">
                  {PRICE_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">{PRICE_LABELS[form.priceType]}</label>
                <Input required type="number" min="1" value={form.monthlyRent} onChange={set('monthlyRent')} placeholder="Enter amount…" className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white" />
              </div>
            </div>
          </div>
        </AdminPanel>

        {/* ── Location ── */}
        <AdminPanel title="Location" description="Start typing the address — autocomplete will fill in the rest.">
          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Search Address</label>
              <input
                ref={addressRef}
                type="text"
                required
                value={form.address}
                onChange={set('address')}
                placeholder="Start typing an address in Nigeria…"
                className="flex h-12 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500">Google Maps will auto-fill state, city, and area below.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">State</label>
                <Input required value={form.state} onChange={set('state')} placeholder="Lagos" className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">City</label>
                <Input required value={form.city} onChange={set('city')} placeholder="Lagos" className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Area / Neighbourhood</label>
                <Input required value={form.area} onChange={set('area')} placeholder="Lekki Phase 1" className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Bedrooms</label>
                <Input required type="number" min="0" value={form.bedrooms} onChange={set('bedrooms')} className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Bathrooms</label>
                <Input required type="number" min="1" value={form.bathrooms} onChange={set('bathrooms')} className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white" />
              </div>
            </div>
            {form.latitude && form.longitude && (
              <p className="text-xs text-emerald-400">
                📍 Coordinates captured: {Number(form.latitude).toFixed(5)}, {Number(form.longitude).toFixed(5)}
              </p>
            )}
          </div>
        </AdminPanel>

        {/* ── Photos ── */}
        <AdminPanel title="Photos" description="High-quality images increase viewing requests by 45%.">
          <div className="space-y-4">
            <label htmlFor="photo-upload" className="flex flex-col items-center justify-center w-full h-36 border-2 border-slate-800 border-dashed rounded-xl cursor-pointer bg-slate-900/50 hover:bg-slate-900 transition-colors">
              <Camera className="w-8 h-8 mb-2 text-slate-500" />
              <p className="text-sm text-slate-400">
                {isUploading
                  ? <span className="animate-pulse text-blue-400">Uploading…</span>
                  : <><span className="font-semibold text-white">Click to upload</span> or drag and drop</>}
              </p>
              <p className="text-xs text-slate-500 mt-1">PNG, JPG, WebP — max 10MB each</p>
              <input id="photo-upload" type="file" className="hidden" multiple accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {images.map((img) => (
                  <div key={img.publicId} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                    <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(img.publicId)}
                      className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Remove image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AdminPanel>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" className="text-slate-300 hover:bg-slate-800 hover:text-white" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isUploading || (user != null && !user.isVerified)}
            className="bg-blue-600 text-white hover:bg-blue-500 rounded-xl h-11 px-8"
          >
            {isSubmitting ? 'Publishing…' : <><Save className="mr-2 h-4 w-4" /> Publish Listing</>}
          </Button>
        </div>
      </form>
    </div>
  )
}
