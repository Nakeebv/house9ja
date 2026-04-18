'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { NIGERIA_STATES } from '@/lib/nigeria-locations'

const slides = [
  { src: '/hero/img-a2.png', alt: 'Contemporary apartment complex' },
  { src: '/hero/img-a3.png', alt: 'Elegant residential property at dusk' },
  { src: '/hero/img-a5.png', alt: 'Urban residential building' },
  { src: '/hero/img-a1.png', alt: 'Modern apartment interior' },
  { src: '/hero/img-a4.png', alt: 'Premium studio apartment' },
]

const TYPES = [
  '', 'APARTMENT', 'DUPLEX', 'BUNGALOW', 'SELF_CONTAINED',
  'SHARED_APARTMENT', 'STUDENT_HOUSING', 'HOSTEL', 'TERRACE', 'MANSIONETTE',
]
const TYPE_LABELS: Record<string, string> = {
  '': 'Any type', APARTMENT: 'Apartment', DUPLEX: 'Duplex',
  BUNGALOW: 'Bungalow', SELF_CONTAINED: 'Self Contained',
  SHARED_APARTMENT: 'Shared Apartment', STUDENT_HOUSING: 'Student Housing',
  HOSTEL: 'Hostel', TERRACE: 'Terrace', MANSIONETTE: 'Mansionette',
}

export function HeroImageShowcase() {
  const router = useRouter()
  const [idx, setIdx] = useState(0)
  const [ready, setReady] = useState(false)
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const [type, setType] = useState('')
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const cities = NIGERIA_STATES.find((s) => s.name === state)?.cities ?? []

  const resetTimer = useCallback(() => {
    if (timer.current) clearInterval(timer.current)
    timer.current = setInterval(() => setIdx((i) => (i + 1) % slides.length), 7000)
  }, [])

  useEffect(() => {
    setReady(true)
    resetTimer()
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [resetTimer])

  const goTo = (i: number) => { setIdx(i); resetTimer() }
  const prev = () => { setIdx((i) => (i - 1 + slides.length) % slides.length); resetTimer() }
  const next = () => { setIdx((i) => (i + 1) % slides.length); resetTimer() }

  const search = () => {
    const p = new URLSearchParams()
    if (state) p.set('state', state)
    if (city) p.set('city', city)
    if (type) p.set('type', type)
    router.push(`/search${p.size ? `?${p}` : ''}`)
  }

  return (
    <section className="relative -mt-[64px] flex min-h-screen flex-col overflow-hidden bg-black">

      {/* ── Slideshow ───────────────────────────────────────────────────── */}
      <div className="absolute inset-0" aria-hidden>
        {slides.map((s, i) => (
          <div
            key={s.src}
            className={`absolute inset-0 transition-opacity duration-[1800ms] ease-in-out ${i === idx ? 'opacity-100' : 'opacity-0'}`}
          >
            <Image
              src={s.src}
              alt={s.alt}
              fill
              priority={i === 0}
              loading={i === 0 ? 'eager' : 'lazy'}
              sizes="100vw"
              className="object-cover"
              style={{ animation: i === idx ? 'kenBurns 8s ease-out forwards' : 'none' }}
            />
          </div>
        ))}

        {/* Overlay — restrained, not opaque */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/70" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pt-28 pb-24 text-center sm:px-8">

        {/* Eyebrow */}
        <p
          className={`mb-5 text-[13px] font-medium uppercase tracking-[0.2em] text-white/60 transition-all duration-700 ${ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
          style={{ transitionDelay: '0ms' }}
        >
          Nigeria&apos;s Verified Rental Platform
        </p>

        {/* Headline — Apple scale */}
        <h1
          className={`max-w-4xl text-[clamp(2.4rem,6vw,5rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-white transition-all duration-700 ${ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '80ms', textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}
        >
          Find your perfect home
          <br />
          <span className="text-white/85">anywhere in Nigeria.</span>
        </h1>

        {/* Subtext */}
        <p
          className={`mt-5 max-w-xl text-base font-normal leading-relaxed text-white/65 sm:text-lg transition-all duration-700 ${ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '160ms' }}
        >
          Verified landlords. Secure chat. Inspections before payment.
        </p>

        {/* ── Search bar ──────────────────────────────────────────────── */}
        <div
          className={`mt-10 w-full max-w-2xl transition-all duration-700 ${ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
          style={{ transitionDelay: '240ms' }}
        >
          <div className="flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-[0_24px_80px_rgba(0,0,0,0.35)] dark:bg-[#1d1d1f] sm:flex-row sm:items-center">
            {/* State */}
            <select
              value={state}
              onChange={(e) => { setState(e.target.value); setCity('') }}
              className="h-11 flex-1 cursor-pointer rounded-xl border-0 bg-transparent px-3.5 text-sm font-medium text-[#1d1d1f] outline-none dark:text-[#f5f5f7] focus:bg-[#f5f5f7] dark:focus:bg-[#2d2d2f] transition-colors"
            >
              <option value="">State</option>
              {NIGERIA_STATES.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>

            <div className="hidden h-7 w-px bg-black/8 dark:bg-white/10 sm:block" />

            {/* City */}
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={!cities.length}
              className="h-11 flex-1 cursor-pointer rounded-xl border-0 bg-transparent px-3.5 text-sm font-medium text-[#1d1d1f] outline-none dark:text-[#f5f5f7] focus:bg-[#f5f5f7] dark:focus:bg-[#2d2d2f] transition-colors disabled:opacity-40 disabled:cursor-default"
            >
              <option value="">{cities.length ? 'City' : 'City'}</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <div className="hidden h-7 w-px bg-black/8 dark:bg-white/10 sm:block" />

            {/* Type */}
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-11 flex-1 cursor-pointer rounded-xl border-0 bg-transparent px-3.5 text-sm font-medium text-[#1d1d1f] outline-none dark:text-[#f5f5f7] focus:bg-[#f5f5f7] dark:focus:bg-[#2d2d2f] transition-colors"
            >
              {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>

            {/* Button */}
            <button
              onClick={search}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0071e3] px-6 text-sm font-semibold text-white transition hover:bg-[#0077ed] active:scale-[0.98] dark:bg-[#2997ff] dark:text-black dark:hover:bg-[#409cff]"
            >
              <Search className="h-4 w-4" />
              Search
            </button>
          </div>

          {/* Popular searches */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-1 gap-y-2">
            <span className="text-xs text-white/35">Try:</span>
            {['Lagos · Lekki', 'Abuja · Maitama', 'Ibadan · Bodija', 'Port Harcourt'].map((label) => {
              const [loc] = label.split(' · ')
              return (
                <button
                  key={label}
                  onClick={() => router.push(`/search?location=${loc}`)}
                  className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[12px] text-white/55 backdrop-blur-sm transition hover:border-white/30 hover:text-white/80"
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Slide controls ──────────────────────────────────────────────── */}
      <div className="absolute left-5 top-1/2 z-20 -translate-y-1/2 sm:left-8">
        <button
          onClick={prev}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
      <div className="absolute right-5 top-1/2 z-20 -translate-y-1/2 sm:right-8">
        <button
          onClick={next}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* ── Dot indicators ──────────────────────────────────────────────── */}
      <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-400 ${i === idx ? 'h-1.5 w-6 bg-white' : 'h-1.5 w-1.5 bg-white/35 hover:bg-white/60'}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
