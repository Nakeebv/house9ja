'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Camera, Save, ArrowLeft, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminPanel } from '@/components/admin/admin-shell'
import Link from 'next/link'
import { propertyService } from '@/lib/services/property-service'
import { api } from '@/lib/api'

declare global {
  interface Window {
    initPlacesAutocompleteEdit?: () => void
  }
}

const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'DUPLEX', label: 'Duplex' },
  { value: 'BUNGALOW', label: 'Bungalow' },
  { value: 'SELF_CONTAINED', label: 'Self Contained' },
  { value: 'SHARED_APARTMENT', label: 'Shared Apartment' },
  { value: 'SHORTLET', label: 'Shortlet Apartment' },
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

const AMENITIES = [
  'WiFi', 'Generator', 'Water Supply', 'Security', 'Parking',
  'Air Conditioning', 'Swimming Pool', 'Gym', 'Elevator', 'CCTV',
  'Gated Compound', 'Balcony', 'Laundry Room', 'Prepaid Meter',
]

type UploadedImage = { url: string; publicId: string; name: string }

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [isApproved, setIsApproved] = useState(false)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
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
    petAllowed: false,
    maxGuests: '',
  })

  const addressRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)

  useEffect(() => {
    propertyService.getById(id).then((property) => {
      if (!property) { router.push('/landlord/properties'); return }
      setIsApproved(property.isVerified)
      setSelectedAmenities(property.features ?? [])
      setImages(property.images.map((url, i) => ({ url, publicId: url, name: `photo-${i + 1}` })))
      setForm({
        title: property.title,
        description: property.description,
        propertyType: property.propertyType,
        priceType: property.priceType,
        monthlyRent: String(property.price),
        state: property.state,
        city: property.city,
        area: property.area,
        address: property.address,
        bedrooms: String(property.bedrooms),
        bathrooms: String(property.bathrooms),
        furnishing: property.furnishing,
        latitude: String(property.latitude),
        longitude: String(property.longitude),
        petAllowed: property.petAllowed ?? false,
        maxGuests: property.maxGuests ? String(property.maxGuests) : '',
      })
      setLoading(false)
    }).catch(() => router.push('/landlord/properties'))
  }, [id, router])

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const toggleAmenity = (amenity: string) =>
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity],
    )

  // ── Google Places Autocomplete ────────────────────────────────────────────
  useEffect(() => {
    if (loading) return
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
        const get = (type: string) => components.find((c: any) => c.types.includes(type))?.long_name ?? ''
        setForm((prev) => ({
          ...prev,
          address: place.formatted_address ?? prev.address,
          latitude: String(lat),
          longitude: String(lng),
          state: get('administrative_area_level_1') || prev.state,
          city: get('locality') || get('administrative_area_level_2') || prev.city,
          area: get('sublocality_level_1') || get('neighborhood') || get('sublocality') || prev.area,
        }))
      })
    }

    if (window.google?.maps?.places) { initAutocomplete(); return }
    const scriptId = 'google-maps-places'
    if (document.getElementById(scriptId)) {
      document.getElementById(scriptId)!.addEventListener('load', initAutocomplete)
      return
    }
    window.initPlacesAutocompleteEdit = initAutocomplete
    const script = document.createElement('script')
    script.id = scriptId
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initPlacesAutocompleteEdit`
    script.async = true
    document.head.appendChild(script)
  }, [loading])

  // ── Signed image upload ───────────────────────────────────────────────────
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return
    setIsUploading(true)
    setError('')
    try {
      const { signature, timestamp, api_key, cloud_name } = await api.post<any>('/upload/sign', { folder: 'properties' })
      const uploaded = await Promise.all(files.map(async (file) => {
        const body = new FormData()
        body.append('file', file)
        body.append('folder', 'properties')
        body.append('timestamp', String(timestamp))
        body.append('api_key', api_key)
        body.append('signature', signature)
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, { method: 'POST', body })
        const payload = await res.json()
        if (!res.ok) throw new Error(payload?.error?.message || 'Upload failed')
        return { url: payload.secure_url as string, publicId: payload.public_id as string, name: file.name }
      }))
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
      await propertyService.update(id, {
        title: form.title,
        description: form.description,
        propertyType: form.propertyType,
        priceType: form.priceType,
        monthlyRent: rent,
        state: form.state,
        city: form.city,
        area: form.area,
        address: form.address,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        furnishing: form.furnishing,
        latitude: Number(form.latitude) || 0,
        longitude: Number(form.longitude) || 0,
        images: images.map((i) => i.url),
        features: selectedAmenities,
        petAllowed: form.petAllowed,
        maxGuests: form.maxGuests ? Number(form.maxGuests) : undefined,
      })
      router.push('/landlord/properties')
    } catch (err: any) {
      setError(err?.message || 'Failed to update listing.')
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    )
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
        <h1 className="text-3xl font-semibold text-white">Edit Listing</h1>
        <p className="mt-2 text-sm text-slate-400">Update your property details.</p>
      </div>

      {isApproved && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
          <Clock className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="font-medium text-amber-300">Changes require re-approval</p>
            <p className="mt-0.5 text-sm text-amber-400/80">
              This listing is live. Your changes will be held for admin review before going live. The current listing stays visible until approved.
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
              <input ref={addressRef} type="text" required value={form.address} onChange={set('address')} placeholder="Start typing an address in Nigeria…" className="flex h-12 w-full rounded-xl border border-slate-800 bg-slate-900 px-4 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">State</label>
                <Input required value={form.state} onChange={set('state')} className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">City</label>
                <Input required value={form.city} onChange={set('city')} className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Area / Neighbourhood</label>
                <Input required value={form.area} onChange={set('area')} className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white" />
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
          </div>
        </AdminPanel>

        {/* ── Amenities ── */}
        <AdminPanel title="Amenities" description="Select all features available at this property.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {AMENITIES.map((amenity) => {
              const checked = selectedAmenities.includes(amenity)
              return (
                <button key={amenity} type="button" onClick={() => toggleAmenity(amenity)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${checked ? 'border-blue-500 bg-blue-500/10 text-blue-300' : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'}`}>
                  <span className={`h-4 w-4 shrink-0 rounded-sm border flex items-center justify-center ${checked ? 'border-blue-500 bg-blue-500' : 'border-slate-600'}`}>
                    {checked && <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </span>
                  {amenity}
                </button>
              )
            })}
          </div>
        </AdminPanel>

        {/* ── Guest Policy ── */}
        <AdminPanel title="Guest Policy" description="Specify rules for pets and guest capacity.">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-200">Pets Allowed</p>
                <p className="text-xs text-slate-500 mt-0.5">Allow tenants with pets</p>
              </div>
              <button type="button" onClick={() => setForm((prev) => ({ ...prev, petAllowed: !prev.petAllowed }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${form.petAllowed ? 'bg-blue-500' : 'bg-slate-700'}`}>
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.petAllowed ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Max Guests Allowed <span className="text-slate-500">(optional)</span></label>
              <Input type="number" min="1" value={form.maxGuests} onChange={set('maxGuests')} placeholder="e.g. 4" className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white" />
            </div>
          </div>
        </AdminPanel>

        {/* ── Photos ── */}
        <AdminPanel title="Photos" description="High-quality images increase viewing requests by 45%.">
          <div className="space-y-4">
            <label htmlFor="edit-photo-upload" className="flex flex-col items-center justify-center w-full h-36 border-2 border-slate-800 border-dashed rounded-xl cursor-pointer bg-slate-900/50 hover:bg-slate-900 transition-colors">
              <Camera className="w-8 h-8 mb-2 text-slate-500" />
              <p className="text-sm text-slate-400">
                {isUploading ? <span className="animate-pulse text-blue-400">Uploading…</span> : <><span className="font-semibold text-white">Click to add more photos</span></>}
              </p>
              <input id="edit-photo-upload" type="file" className="hidden" multiple accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
            </label>
            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {images.map((img) => (
                  <div key={img.publicId} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                    <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removeImage(img.publicId)}
                      className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100">
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
          <Button type="submit" disabled={isSubmitting || isUploading} className="bg-blue-600 text-white hover:bg-blue-500 rounded-xl h-11 px-8">
            {isSubmitting ? 'Saving…' : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
          </Button>
        </div>
      </form>
    </div>
  )
}
