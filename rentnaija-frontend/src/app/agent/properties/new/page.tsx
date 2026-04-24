'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Save, ArrowLeft, X, MapPin, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminPanel } from '@/components/admin/admin-shell'
import Image from 'next/image'
import Link from 'next/link'
import { propertyService } from '@/lib/services/property-service'
import { useAuth } from '@/lib/auth-context'

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
  { value: 'SHORTLET', label: 'Shortlet Apartment' },
]

const FURNISHING_OPTIONS = [
  { value: 'UNFURNISHED', label: 'Unfurnished' },
  { value: 'SEMI_FURNISHED', label: 'Semi-Furnished' },
  { value: 'FURNISHED', label: 'Fully Furnished' },
]

const AMENITIES = [
  'WiFi', 'Generator', 'Water Supply', 'Security', 'Parking',
  'Air Conditioning', 'Swimming Pool', 'Gym', 'Elevator', 'CCTV',
  'Gated Compound', 'Balcony', 'Laundry Room', 'Prepaid Meter',
]

export default function AgentAddListingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [error, setError] = useState('')
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const geocodeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    propertyType: 'APARTMENT',
    monthlyRent: '',
    priceType: 'YEARLY',
    state: '',
    city: '',
    area: '',
    address: '',
    bedrooms: '1',
    bathrooms: '1',
    furnishing: 'UNFURNISHED',
    latitude: '',
    longitude: '',
    petAllowed: false,
    maxGuests: '',
  })

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const toggleAmenity = (amenity: string) =>
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity],
    )

  // ── Geocode address when user stops typing ───────────────────────────────
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, address: value }))

    if (geocodeTimeout.current) clearTimeout(geocodeTimeout.current)
    if (!value.trim()) return

    geocodeTimeout.current = setTimeout(async () => {
      setIsGeocoding(true)
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
        if (!apiKey) return

        const query = encodeURIComponent(`${value}, Nigeria`)
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${apiKey}`,
        )
        const data = await res.json()
        const loc = data?.results?.[0]?.geometry?.location
        if (loc) {
          setForm((prev) => ({
            ...prev,
            latitude: String(loc.lat.toFixed(6)),
            longitude: String(loc.lng.toFixed(6)),
          }))
        }
      } catch {
        // geocoding is optional — silently ignore errors
      } finally {
        setIsGeocoding(false)
      }
    }, 800)
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      setError('Cloudinary environment variables are not configured.')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const body = new FormData()
          body.append('file', file)
          body.append('upload_preset', uploadPreset)
          body.append('folder', 'properties')
          const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body })
          const payload = await res.json()
          if (!res.ok) throw new Error(payload?.error?.message || 'Upload failed')
          return payload.secure_url as string
        }),
      )
      setUploadedImages((prev) => [...prev, ...uploaded])
    } catch (err: any) {
      setError(err?.message || 'Failed to upload images.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      await propertyService.create({
        title: form.title,
        description: form.description,
        propertyType: form.propertyType,
        monthlyRent: Number(form.monthlyRent),
        priceType: form.priceType,
        state: form.state,
        city: form.city,
        area: form.area,
        address: form.address,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        furnishing: form.furnishing,
        latitude: form.latitude ? Number(form.latitude) : 0,
        longitude: form.longitude ? Number(form.longitude) : 0,
        images: uploadedImages,
        features: selectedAmenities,
        petAllowed: form.petAllowed,
        maxGuests: form.maxGuests ? Number(form.maxGuests) : undefined,
      })
      router.push('/agent/properties')
    } catch (err: any) {
      setError(err?.message || 'Failed to create listing. Please try again.')
      setIsSubmitting(false)
    }
  }

  const hasCoords = form.latitude && form.longitude && form.latitude !== '0' && form.longitude !== '0'

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 text-slate-400">
        <Link href="/agent/properties">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-800 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <span className="text-sm">Back to listings</span>
      </div>

      <div>
        <h1 className="text-3xl font-semibold text-white">Add New Listing</h1>
        <p className="mt-2 text-sm text-slate-400">Complete all sections to maximise your listing visibility.</p>
      </div>

      {user && !user.isVerified && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="font-medium text-amber-300">Account not verified</p>
            <p className="mt-0.5 text-sm text-amber-400/80">
              You must complete identity verification before publishing listings.{' '}
              <Link href="/verify" className="underline hover:text-amber-200">Start verification →</Link>
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
        {/* Basic Details */}
        <AdminPanel title="Basic Details" description="Title and description appear on the marketplace search.">
          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Property Title *</label>
              <Input
                required
                value={form.title}
                onChange={set('title')}
                placeholder="e.g. Modern 3BR Apartment in Lekki Phase 1"
                className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Description *</label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={set('description')}
                placeholder="Describe the property, neighbourhood, what makes it stand out…"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <div className="grid gap-6 sm:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Property Type</label>
                <select
                  value={form.propertyType}
                  onChange={set('propertyType')}
                  className="flex h-12 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-white"
                >
                  {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Furnishing</label>
                <select
                  value={form.furnishing}
                  onChange={set('furnishing')}
                  className="flex h-12 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-white"
                >
                  {FURNISHING_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Rent Amount (₦) *</label>
                <Input
                  required
                  type="number"
                  min="1"
                  value={form.monthlyRent}
                  onChange={set('monthlyRent')}
                  placeholder="1200000"
                  className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Pricing Model</label>
                <select
                  value={form.priceType}
                  onChange={set('priceType')}
                  className="flex h-12 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-white"
                >
                  <option value="YEARLY">Per Year</option>
                  <option value="MONTHLY">Per Month</option>
                  <option value="DAILY">Per Day</option>
                </select>
              </div>
            </div>
          </div>
        </AdminPanel>

        {/* Location */}
        <AdminPanel title="Location" description="Enter the address — coordinates are auto-filled via geocoding.">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">State *</label>
              <Input required value={form.state} onChange={set('state')} placeholder="Lagos" className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">City *</label>
              <Input required value={form.city} onChange={set('city')} placeholder="Lagos" className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Area / Neighbourhood *</label>
              <Input required value={form.area} onChange={set('area')} placeholder="Lekki Phase 1" className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Full Address *</label>
              <div className="relative">
                <Input
                  required
                  value={form.address}
                  onChange={handleAddressChange}
                  placeholder="123 Admiralty Way, Lekki Phase 1"
                  className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white pr-10"
                />
                {isGeocoding && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-400 border-t-transparent block" />
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Bedrooms</label>
              <Input required type="number" min="1" value={form.bedrooms} onChange={set('bedrooms')} className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Bathrooms</label>
              <Input required type="number" min="1" value={form.bathrooms} onChange={set('bathrooms')} className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Latitude
                <span className="ml-2 text-slate-500 font-normal text-xs">{hasCoords ? '(auto-filled)' : '(optional)'}</span>
              </label>
              <Input
                type="number"
                step="any"
                value={form.latitude}
                onChange={set('latitude')}
                placeholder="6.4474"
                className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Longitude
                <span className="ml-2 text-slate-500 font-normal text-xs">{hasCoords ? '(auto-filled)' : '(optional)'}</span>
              </label>
              <Input
                type="number"
                step="any"
                value={form.longitude}
                onChange={set('longitude')}
                placeholder="3.4722"
                className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white"
              />
            </div>
          </div>

          {/* Map preview */}
          {hasCoords && (
            <div className="mt-4 rounded-xl overflow-hidden border border-slate-700 h-48">
              <iframe
                title="Map preview"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://maps.google.com/maps?q=${form.latitude},${form.longitude}&z=16&output=embed`}
              />
            </div>
          )}

          {hasCoords && (
            <p className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
              <MapPin className="h-3 w-3" />
              Location pinned at {Number(form.latitude).toFixed(4)}, {Number(form.longitude).toFixed(4)}
            </p>
          )}
        </AdminPanel>

        {/* Amenities */}
        <AdminPanel title="Amenities" description="Select all features available in or around the property.">
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((amenity) => {
              const selected = selectedAmenities.includes(amenity)
              return (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition
                    ${selected
                      ? 'bg-violet-600 text-white ring-2 ring-violet-500'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  {amenity}
                </button>
              )
            })}
          </div>
          {selectedAmenities.length > 0 && (
            <p className="mt-3 text-xs text-slate-400">{selectedAmenities.length} amenities selected</p>
          )}
        </AdminPanel>

        {/* Guest Policy */}
        <AdminPanel title="Guest Policy" description="Specify rules for pets and guest capacity.">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-200">Pets Allowed</p>
                <p className="text-xs text-slate-500 mt-0.5">Allow tenants with pets</p>
              </div>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, petAllowed: !prev.petAllowed }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${form.petAllowed ? 'bg-violet-500' : 'bg-slate-700'}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.petAllowed ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Max Guests Allowed <span className="text-slate-500">(optional)</span></label>
              <Input type="number" min="1" value={form.maxGuests} onChange={set('maxGuests')} placeholder="e.g. 4" className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white" />
            </div>
          </div>
        </AdminPanel>

        {/* Photos */}
        <AdminPanel title="Photos" description="Upload high-quality photos via Cloudinary. First image is the cover.">
          <label
            htmlFor="agent-image-upload"
            className="flex flex-col items-center justify-center w-full h-44 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-900/50 hover:bg-slate-900 transition"
          >
            <Camera className="w-8 h-8 mb-2 text-slate-500" />
            <p className="text-sm text-slate-400">
              <span className="font-semibold text-white">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP — hosted on Cloudinary</p>
            <input
              id="agent-image-upload"
              type="file"
              className="hidden"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
            />
          </label>

          {isUploading && (
            <p className="mt-3 text-sm text-violet-400">Uploading images…</p>
          )}

          {uploadedImages.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {uploadedImages.map((url, i) => (
                <div key={url} className="group relative aspect-square overflow-hidden rounded-xl bg-slate-800">
                  <Image src={url} alt={`Upload ${i + 1}`} fill className="object-cover" sizes="120px" />
                  <button
                    type="button"
                    onClick={() => setUploadedImages((prev) => prev.filter((u) => u !== url))}
                    className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-slate-900/80 text-white group-hover:flex"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 rounded bg-slate-900/80 px-1.5 py-0.5 text-xs text-white">Cover</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </AdminPanel>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="ghost"
            className="text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isUploading || (user != null && !user.isVerified)}
            className="bg-violet-600 text-white hover:bg-violet-500 rounded-xl h-11 px-8"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Publishing…
              </span>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Publish Listing</>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
