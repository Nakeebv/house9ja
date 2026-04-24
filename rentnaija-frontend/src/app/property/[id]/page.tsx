'use client'

import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  MapPin, Bed, Bath, Building2, Phone, Mail, Heart, Share2,
  MessageSquare, CheckCircle, ArrowLeft, CalendarDays, Clock, Send,
  ChevronLeft, ChevronRight, X as CloseIcon, ShieldCheck,
} from 'lucide-react'
import { UserAvatar } from '@/components/ui/user-avatar'
import { propertyService } from '@/lib/services/property-service'
import { bookingsService } from '@/lib/services/bookings-service'
import { favoritesService } from '@/lib/services/favorites-service'
import { chatService } from '@/lib/services/chat-service'
import { leadsService } from '@/lib/services/leads-service'
import { useAuth } from '@/lib/auth-context'

function PropertyDetailSkeleton() {
  return (
    <div className="min-h-screen animate-pulse bg-white dark:bg-black">
      <div className="h-[320px] bg-black/5 dark:bg-white/5 sm:h-[420px] lg:h-[520px]" />
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_380px]">
          <div className="space-y-5">
            <div className="h-8 w-2/3 rounded-xl bg-black/5 dark:bg-white/5" />
            <div className="h-5 w-1/3 rounded-xl bg-black/5 dark:bg-white/5" />
            <div className="h-32 rounded-2xl bg-black/5 dark:bg-white/5" />
          </div>
          <div className="space-y-5">
            <div className="h-52 rounded-2xl bg-black/5 dark:bg-white/5" />
            <div className="h-40 rounded-2xl bg-black/5 dark:bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  )
}

function ImageGalleryModal({
  images, startIndex, onClose,
}: { images: string[]; startIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex)
  const prev = () => setCurrent((i) => (i - 1 + images.length) % images.length)
  const next = () => setCurrent((i) => (i + 1) % images.length)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-5xl max-h-screen p-4" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-2 right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20">
          <CloseIcon className="h-5 w-5" />
        </button>
        <p className="absolute -top-2 left-2 z-10 text-sm text-white/50">{current + 1} / {images.length}</p>
        <div className="relative h-[60vh] w-full overflow-hidden rounded-2xl bg-black sm:h-[72vh]">
          <Image src={images[current]} alt={`Photo ${current + 1}`} fill className="object-contain" sizes="(max-width: 768px) 100vw, 80vw" />
        </div>
        {images.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-6 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/22">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={next} className="absolute right-6 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/22">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${i === current ? 'border-white' : 'border-transparent opacity-50 hover:opacity-80'}`}>
              <Image src={img} alt={`Thumb ${i + 1}`} fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Blurred contact row — entices guest to log in
function BlurredContactRow({ icon: Icon, placeholder }: { icon: React.ElementType; placeholder: string }) {
  return (
    <Link
      href="/login"
      className="group relative flex items-center gap-2.5 overflow-hidden rounded-xl border border-black/8 bg-white px-4 py-3 transition hover:border-[#0071e3]/30 hover:shadow-sm dark:border-white/8 dark:bg-[#2d2d2f] dark:hover:border-[#2997ff]/30"
    >
      <Icon className="h-4 w-4 shrink-0 text-[#6e6e73] dark:text-[#a1a1a6]" />
      <span
        className="flex-1 text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]"
        style={{ filter: 'blur(5px)', userSelect: 'none' }}
        aria-hidden="true"
      >
        {placeholder}
      </span>
      <span className="shrink-0 rounded-full bg-[#0071e3] px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-[#2997ff] dark:text-black">
        Unlock
      </span>
    </Link>
  )
}

// Auth-gated block for action panels
function LoginGateBlock({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-black/12 bg-[#f5f5f7]/60 px-5 py-6 text-center dark:border-white/10 dark:bg-[#2d2d2f]/60">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0071e3]/10 dark:bg-[#2997ff]/10">
        <Icon className="h-5 w-5 text-[#0071e3] dark:text-[#2997ff]" />
      </div>
      <div>
        <p className="text-[13px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">{title}</p>
        <p className="mt-0.5 text-[12px] text-[#6e6e73] dark:text-[#a1a1a6]">{description}</p>
      </div>
      <div className="flex gap-2">
        <Link href="/login" className="rounded-full bg-[#0071e3] px-4 py-1.5 text-[12px] font-semibold text-white transition hover:bg-[#0077ed] dark:bg-[#2997ff] dark:text-black">
          Log in
        </Link>
        <Link href="/register" className="rounded-full border border-black/12 px-4 py-1.5 text-[12px] font-semibold text-[#1d1d1f] transition hover:bg-black/5 dark:border-white/12 dark:text-[#f5f5f7] dark:hover:bg-white/8">
          Sign up
        </Link>
      </div>
    </div>
  )
}

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.id as string
  const { user } = useAuth()

  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const openGallery = (i: number) => { setGalleryIndex(i); setGalleryOpen(true) }

  const [viewingDate, setViewingDate] = useState('')
  const [viewingTime, setViewingTime] = useState('10:00')
  const [bookingDone, setBookingDone] = useState(false)
  const [leadMessage, setLeadMessage] = useState('')
  const [leadDone, setLeadDone] = useState(false)

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => propertyService.getById(propertyId),
  })

  const toggleFavorite = useMutation({ mutationFn: () => favoritesService.toggle(propertyId) })
  const requestViewing = useMutation({
    mutationFn: () => bookingsService.create({ propertyId, date: viewingDate, time: viewingTime }),
    onSuccess: () => setBookingDone(true),
  })
  const startConversation = useMutation({
    mutationFn: () => {
      if (!property?.landlord.id) throw new Error('Landlord unavailable')
      return chatService.getOrCreate(propertyId, property.landlord.id)
    },
    onSuccess: () => router.push('/chat'),
  })
  const submitLead = useMutation({
    mutationFn: () => leadsService.create(propertyId, leadMessage || undefined),
    onSuccess: () => setLeadDone(true),
  })

  const handleShare = () => {
    if (navigator.share) navigator.share({ title: property?.title, url: window.location.href })
    else navigator.clipboard.writeText(window.location.href)
  }

  if (isLoading) return <PropertyDetailSkeleton />

  if (!property) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
        <p className="text-xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">Property not found</p>
        <p className="text-sm text-[#6e6e73] dark:text-[#a1a1a6]">This listing may have been removed.</p>
        <Link href="/search" className="mt-2 inline-flex h-11 items-center rounded-full bg-[#0071e3] px-6 text-[14px] font-semibold text-white transition hover:bg-[#0077ed] dark:bg-[#2997ff] dark:text-black">
          Browse listings
        </Link>
      </div>
    )
  }

  const heroImage = property.images[0] ?? '/hero/img-a1.png'
  const priceLabel = property.priceType === 'DAILY' ? '/day' : property.priceType === 'MONTHLY' ? '/mo' : '/yr'

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* ── Hero ── */}
      <div className="relative h-[320px] sm:h-[420px] lg:h-[520px]">
        <button type="button" className="absolute inset-0 h-full w-full focus:outline-none" onClick={() => property.images.length > 0 && openGallery(0)} aria-label="View photos">
          <Image src={heroImage} alt={property.title} fill priority sizes="100vw" className="object-cover" />
        </button>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/20" />

        {property.images.length > 1 && (
          <button type="button" onClick={() => openGallery(0)} className="absolute bottom-5 right-5 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-xs text-white backdrop-blur transition hover:bg-black/70 pointer-events-auto sm:right-8">
            <span>📷</span> {property.images.length} photos
          </button>
        )}

        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 pt-5 sm:px-8">
          <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3.5 py-2 text-sm text-white backdrop-blur transition hover:bg-black/60">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex gap-2">
            <button onClick={() => { if (!user) { router.push('/login'); return }; toggleFavorite.mutate() }} disabled={toggleFavorite.isPending} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur transition hover:bg-black/60" title="Save">
              <Heart className="h-4 w-4" />
            </button>
            <button onClick={handleShare} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur transition hover:bg-black/60" title="Share">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-6 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <p className="text-[36px] font-semibold leading-none tracking-[-0.02em] text-white drop-shadow-lg sm:text-[44px]">
              ₦{property.price.toLocaleString()}
              <span className="ml-1 text-[18px] font-normal text-white/65">{priceLabel}</span>
            </p>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold capitalize ${property.status === 'available' ? 'bg-emerald-500/90 text-white' : 'bg-amber-500/90 text-white'}`}>
              {property.status}
            </span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_380px]">

          {/* ── Left ── */}
          <div className="space-y-6">
            <div>
              <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-[#f5f5f7] sm:text-[32px]">{property.title}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-[#6e6e73] dark:text-[#a1a1a6]">
                <MapPin className="h-4 w-4 shrink-0" />{property.location}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: Bed, label: 'Bedrooms', value: property.bedrooms },
                { icon: Bath, label: 'Bathrooms', value: property.bathrooms },
                { icon: Building2, label: 'Type', value: property.propertyType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 rounded-2xl border border-black/8 bg-[#f5f5f7] p-4 dark:border-white/8 dark:bg-[#1d1d1f]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-[#2d2d2f]">
                    <Icon className="h-5 w-5 text-[#6e6e73] dark:text-[#a1a1a6]" />
                  </div>
                  <div>
                    <p className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">{label}</p>
                    <p className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-black/8 bg-[#f5f5f7] p-6 dark:border-white/8 dark:bg-[#1d1d1f]">
              <h2 className="mb-3 text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">About this property</h2>
              <p className="text-[14px] leading-relaxed text-[#6e6e73] dark:text-[#a1a1a6]">{property.description}</p>
            </div>

            {property.features.length > 0 && (
              <div className="rounded-2xl border border-black/8 bg-[#f5f5f7] p-6 dark:border-white/8 dark:bg-[#1d1d1f]">
                <h2 className="mb-4 text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">Amenities &amp; Features</h2>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {property.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2.5 rounded-xl bg-white px-4 py-2.5 dark:bg-[#2d2d2f]">
                      <CheckCircle className="h-4 w-4 shrink-0 text-[#0071e3] dark:text-[#2997ff]" />
                      <span className="text-[13px] text-[#1d1d1f] dark:text-[#f5f5f7]">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {property.images.length > 0 && (
              <div className="rounded-2xl border border-black/8 bg-[#f5f5f7] p-6 dark:border-white/8 dark:bg-[#1d1d1f]">
                <h2 className="mb-4 text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">Photos</h2>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {property.images.map((img, i) => (
                    <button key={i} type="button" onClick={() => openGallery(i)} className="group relative h-36 overflow-hidden rounded-xl bg-black/5 focus:outline-none dark:bg-white/5">
                      <Image src={img} alt={`Photo ${i + 1}`} fill className="object-cover transition duration-500 group-hover:scale-[1.06]" sizes="200px" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition duration-300 group-hover:bg-black/25">
                        <span className="rounded-full bg-black/50 px-3 py-1 text-[11px] font-medium text-white opacity-0 transition group-hover:opacity-100">View</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-black/8 bg-[#f5f5f7] p-6 dark:border-white/8 dark:bg-[#1d1d1f]">
              <h2 className="mb-4 text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">Property Details</h2>
              <div className="divide-y divide-black/6 dark:divide-white/6">
                {[
                  { label: 'Furnishing', value: property.furnishing.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) },
                  { label: 'Area', value: property.area },
                  { label: 'Listed', value: new Date(property.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) },
                  { label: 'Views', value: property.views.toLocaleString() },
                  { label: 'Reference', value: property.id.slice(0, 12) + '…' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4 py-2.5">
                    <span className="text-[13px] text-[#6e6e73] dark:text-[#a1a1a6]">{label}</span>
                    <span className="text-right text-[13px] font-medium capitalize text-[#1d1d1f] dark:text-[#f5f5f7]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right ── */}
          <div className="space-y-5">

            {/* Contact Landlord */}
            <div className="rounded-2xl border border-black/8 bg-[#f5f5f7] p-6 dark:border-white/8 dark:bg-[#1d1d1f]">
              <h2 className="mb-5 text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">Contact Landlord</h2>

              <div className="flex items-center gap-3">
                <UserAvatar src={property.landlord.avatarUrl} name={property.landlord.name} size={44} isVerified={!!property.landlord.isVerified} gradient="from-emerald-500 to-teal-600" />
                <div>
                  <p className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">{property.landlord.name}</p>
                  {property.landlord.isVerifiedLandlord && (
                    <span className="inline-flex items-center gap-1 text-[12px] text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="h-3 w-3" /> Verified Landlord
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {user ? (
                  <>
                    {property.landlord.phone && (
                      <a href={`tel:${property.landlord.phone}`} className="flex items-center gap-2.5 rounded-xl border border-black/8 bg-white px-4 py-3 text-[13px] text-[#1d1d1f] transition hover:border-[#0071e3]/40 dark:border-white/8 dark:bg-[#2d2d2f] dark:text-[#f5f5f7]">
                        <Phone className="h-4 w-4 shrink-0 text-[#6e6e73]" />{property.landlord.phone}
                      </a>
                    )}
                    {property.landlord.email && (
                      <a href={`mailto:${property.landlord.email}`} className="flex items-center gap-2.5 rounded-xl border border-black/8 bg-white px-4 py-3 text-[13px] text-[#1d1d1f] transition hover:border-[#0071e3]/40 dark:border-white/8 dark:bg-[#2d2d2f] dark:text-[#f5f5f7] truncate">
                        <Mail className="h-4 w-4 shrink-0 text-[#6e6e73]" /><span className="truncate">{property.landlord.email}</span>
                      </a>
                    )}
                  </>
                ) : (
                  <>
                    <BlurredContactRow icon={Phone} placeholder="+234 801 234 5678" />
                    <BlurredContactRow icon={Mail} placeholder="landlord@example.com" />
                    <p className="text-center text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">
                      Click to log in and reveal contact details
                    </p>
                  </>
                )}
              </div>

              <div className="mt-5">
                {user ? (
                  <button onClick={() => startConversation.mutate()} disabled={startConversation.isPending} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0071e3] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[#0077ed] active:scale-[0.98] disabled:opacity-60 dark:bg-[#2997ff] dark:text-black dark:hover:bg-[#409cff]">
                    <MessageSquare className="h-4 w-4" />
                    {startConversation.isPending ? 'Opening chat…' : 'Chat with Landlord'}
                  </button>
                ) : (
                  <Link href="/login" className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0071e3] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[#0077ed] dark:bg-[#2997ff] dark:text-black dark:hover:bg-[#409cff]">
                    <MessageSquare className="h-4 w-4" />Login to Chat
                  </Link>
                )}
              </div>
            </div>

            {/* Send Enquiry */}
            <div className="rounded-2xl border border-black/8 bg-[#f5f5f7] p-6 dark:border-white/8 dark:bg-[#1d1d1f]">
              <h2 className="mb-4 text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">Send Enquiry</h2>
              {leadDone ? (
                <div className="rounded-xl border border-emerald-200/50 bg-emerald-50 p-4 text-center dark:border-emerald-500/20 dark:bg-emerald-500/10">
                  <CheckCircle className="mx-auto mb-2 h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  <p className="font-medium text-emerald-800 dark:text-emerald-300">Enquiry sent!</p>
                  <p className="mt-1 text-[12px] text-emerald-600 dark:text-emerald-400">The agent will review and open a chat.</p>
                </div>
              ) : user ? (
                <>
                  <p className="mb-3 text-[12px] text-[#6e6e73] dark:text-[#a1a1a6]">Send a message to the agent. They will review and open a direct chat.</p>
                  <textarea rows={3} value={leadMessage} onChange={(e) => setLeadMessage(e.target.value)} placeholder="e.g. I'm interested in a 12-month lease. Is the property still available?" className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[13px] text-[#1d1d1f] outline-none transition placeholder:text-[#a1a1a6] focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] dark:border-white/10 dark:bg-[#2d2d2f] dark:text-[#f5f5f7] dark:focus:border-[#2997ff] dark:focus:ring-[#2997ff]" />
                  {submitLead.isError && (
                    <p className="mt-2 text-[12px] text-rose-600">
                      {(submitLead.error as any)?.message === 'You already submitted a lead for this property' ? 'You already sent an enquiry.' : 'Failed to send. Please try again.'}
                    </p>
                  )}
                  <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-black active:scale-[0.98] disabled:opacity-60 dark:bg-[#f5f5f7] dark:text-black dark:hover:bg-white" disabled={submitLead.isPending} onClick={() => submitLead.mutate()}>
                    <Send className="h-4 w-4" />{submitLead.isPending ? 'Sending…' : 'Send Enquiry'}
                  </button>
                </>
              ) : (
                <LoginGateBlock icon={Send} title="Login to send an enquiry" description="Create a free account to message the agent directly." />
              )}
            </div>

            {/* Book Inspection */}
            <div className="rounded-2xl border border-black/8 bg-[#f5f5f7] p-6 dark:border-white/8 dark:bg-[#1d1d1f]">
              <h2 className="mb-4 text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">Book Inspection</h2>
              {bookingDone ? (
                <div className="rounded-xl border border-emerald-200/50 bg-emerald-50 p-5 text-center dark:border-emerald-500/20 dark:bg-emerald-500/10">
                  <CheckCircle className="mx-auto mb-2 h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                  <p className="font-medium text-emerald-800 dark:text-emerald-300">Viewing requested!</p>
                  <p className="mt-1 text-[12px] text-emerald-600 dark:text-emerald-400">The landlord will confirm your inspection date.</p>
                </div>
              ) : user ? (
                <>
                  <div className="space-y-3">
                    <div>
                      <label className="flex items-center gap-1.5 text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                        <CalendarDays className="h-4 w-4 text-[#6e6e73]" /> Preferred date
                      </label>
                      <input type="date" value={viewingDate} onChange={(e) => setViewingDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="mt-1.5 h-11 w-full rounded-xl border border-black/10 bg-white px-3.5 text-[13px] text-[#1d1d1f] outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] dark:border-white/10 dark:bg-[#2d2d2f] dark:text-[#f5f5f7] dark:focus:border-[#2997ff]" />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                        <Clock className="h-4 w-4 text-[#6e6e73]" /> Preferred time
                      </label>
                      <select value={viewingTime} onChange={(e) => setViewingTime(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-black/10 bg-white px-3.5 text-[13px] text-[#1d1d1f] outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3] dark:border-white/10 dark:bg-[#2d2d2f] dark:text-[#f5f5f7] dark:focus:border-[#2997ff]">
                        <option value="09:00">09:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="14:00">02:00 PM</option>
                        <option value="15:00">03:00 PM</option>
                        <option value="16:00">04:00 PM</option>
                      </select>
                    </div>
                  </div>
                  {requestViewing.isError && <p className="mt-2 text-[12px] text-rose-600">Failed to send request. Please try again.</p>}
                  <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#0071e3] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[#0077ed] active:scale-[0.98] disabled:opacity-60 dark:bg-[#2997ff] dark:text-black dark:hover:bg-[#409cff]" disabled={!viewingDate || requestViewing.isPending} onClick={() => requestViewing.mutate()}>
                    {requestViewing.isPending ? 'Sending…' : 'Book Inspection'}
                  </button>
                </>
              ) : (
                <LoginGateBlock icon={CalendarDays} title="Login to book a viewing" description="Sign in to schedule a physical inspection before you pay." />
              )}
            </div>
          </div>
        </div>
      </div>

      {galleryOpen && <ImageGalleryModal images={property.images} startIndex={galleryIndex} onClose={() => setGalleryOpen(false)} />}
    </div>
  )
}
