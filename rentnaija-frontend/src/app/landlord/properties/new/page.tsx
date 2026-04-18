'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Save, ArrowLeft, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminPanel } from '@/components/admin/admin-shell'
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
]

const FURNISHING_OPTIONS = [
  { value: 'UNFURNISHED', label: 'Unfurnished' },
  { value: 'SEMI_FURNISHED', label: 'Semi-Furnished' },
  { value: 'FURNISHED', label: 'Fully Furnished' },
]

export default function AddListingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    propertyType: 'APARTMENT',
    monthlyRent: '',
    state: '',
    city: '',
    area: '',
    address: '',
    bedrooms: '1',
    bathrooms: '1',
    furnishing: 'UNFURNISHED',
    latitude: '0',
    longitude: '0',
  })

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      setError('Cloudinary configuration is missing. Add the Cloudinary environment variables before uploading images.')
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

          const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body,
          })

          const payload = await response.json()
          if (!response.ok) {
            throw new Error(payload?.error?.message || 'Image upload failed')
          }

          return payload.secure_url as string
        }),
      )

      setUploadedImages((prev) => [...prev, ...uploaded])
    } catch (err: any) {
      setError(err?.message || 'Failed to upload selected images.')
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
        state: form.state,
        city: form.city,
        area: form.area,
        address: form.address,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        furnishing: form.furnishing,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        images: uploadedImages,
      })
      router.push('/landlord/properties')
    } catch (err: any) {
      setError(err?.message || 'Failed to create listing. Please try again.')
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
        <p className="mt-2 text-sm text-slate-400">Fill in details beautifully to attract the right tenants.</p>
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
        <AdminPanel title="Basic Details" description="Title and description will be visible on the marketplace search.">
          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Property Title</label>
              <Input required value={form.title} onChange={set('title')} placeholder="e.g. 3BR Luxury Apartment in VIP Zone" className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Description</label>
              <textarea required rows={4} value={form.description} onChange={set('description')} placeholder="Describe the ambiance, features, and neighborhood..." className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
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
                <label className="text-sm font-medium text-slate-300">Monthly Rent (₦)</label>
                <Input required type="number" min="1" value={form.monthlyRent} onChange={set('monthlyRent')} placeholder="Enter amount..." className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white" />
              </div>
            </div>
          </div>
        </AdminPanel>

        <AdminPanel title="Location & Features" description="Specific details help tenants make quick decisions.">
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
              <label className="text-sm font-medium text-slate-300">Full Address</label>
              <Input required value={form.address} onChange={set('address')} placeholder="123 Admiralty Way" className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white" />
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
              <label className="text-sm font-medium text-slate-300">Latitude</label>
              <Input type="number" step="any" value={form.latitude} onChange={set('latitude')} placeholder="6.4474" className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Longitude</label>
              <Input type="number" step="any" value={form.longitude} onChange={set('longitude')} placeholder="3.4722" className="h-12 rounded-xl border-slate-800 bg-slate-900 text-white" />
            </div>
          </div>
        </AdminPanel>

        <AdminPanel title="Photos" description="High-quality images increase viewing requests by 45%.">
          <div className="flex items-center justify-center w-full">
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-800 border-dashed rounded-xl cursor-pointer bg-slate-900/50 hover:bg-slate-900">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Camera className="w-10 h-10 mb-3 text-slate-500" />
                <p className="mb-2 text-sm text-slate-400"><span className="font-semibold text-white">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-slate-500">Upload via Cloudinary — images are stored as URLs</p>
              </div>
              <input id="dropzone-file" type="file" className="hidden" multiple accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>
          <div className="space-y-2 text-sm text-slate-400">
            {isUploading ? <div>Uploading images...</div> : null}
            {uploadedImages.map((image) => (
              <div key={image} className="truncate rounded-xl border border-slate-800 bg-slate-900 px-3 py-2">
                {image}
              </div>
            ))}
          </div>
        </AdminPanel>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" className="text-slate-300 hover:bg-slate-800 hover:text-white" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || isUploading || (user != null && !user.isVerified)} className="bg-blue-600 text-white hover:bg-blue-500 rounded-xl h-11 px-8">
            {isSubmitting ? 'Publishing...' : <><Save className="mr-2 h-4 w-4" /> Publish Listing</>}
          </Button>
        </div>
      </form>
    </div>
  )
}
