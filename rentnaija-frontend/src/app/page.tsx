import Image from 'next/image'
import Link from 'next/link'
import {
  ShieldCheck, MessageCircle, CalendarCheck,
  Layers, MapPin, CheckCircle,
} from 'lucide-react'
import { HeroImageShowcase } from '@/components/home/hero-image-showcase'
import { FeaturedListings } from '@/components/home/featured-listings'
import { CitiesSection } from '@/components/home/cities-section'

const STEPS = [
  { n: '1', title: 'Search',    desc: 'Browse thousands of verified listings. Filter by state, city, property type, and price — instantly.' },
  { n: '2', title: 'Connect',   desc: 'Message landlords directly through our secure in-app chat. No middlemen, no delays.' },
  { n: '3', title: 'Inspect',   desc: 'Book a physical viewing at a time that suits you. See the property before committing a kobo.' },
  { n: '4', title: 'Move in',   desc: 'Sign your agreement on-platform and move in with complete confidence.' },
]

const TRUST = [
  {
    icon: ShieldCheck,
    title: 'ID-Verified Landlords',
    desc: 'Every landlord submits government-issued ID and proof of ownership before going live. Verified profiles carry a blue badge.',
  },
  {
    icon: MessageCircle,
    title: 'Secure In-App Chat',
    desc: 'All messages stay inside the platform. Share documents, images, and voice notes — fully encrypted.',
  },
  {
    icon: CalendarCheck,
    title: 'Inspection Before Payment',
    desc: "We built inspection scheduling into the core of the platform. We actively discourage paying before you've seen the property.",
  },
  {
    icon: Layers,
    title: 'Honest Listings',
    desc: 'Properties are reviewed before they go live. No duplicates, no ghost listings, no vague "contact for price" entries.',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="bg-white dark:bg-black">

      {/* ── 1 · HERO ──────────────────────────────────────────────────────── */}
      <HeroImageShowcase />

      {/* ── 2 · STAT STRIP ────────────────────────────────────────────────── */}
      <div className="border-b border-black/8 bg-white dark:border-white/8 dark:bg-black">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-around gap-y-6 px-8 py-10">
          {[
            { value: '2,000+',  label: 'Active listings' },
            { value: '500+',    label: 'Verified landlords' },
            { value: '36',      label: 'States covered' },
            { value: '4.8 ★',  label: 'Average rating' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-[#f5f5f7]">
                {value}
              </p>
              <p className="mt-1 text-[13px] text-[#6e6e73] dark:text-[#a1a1a6]">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3 · FEATURED LISTINGS ─────────────────────────────────────────── */}
      <FeaturedListings />

      {/* ── 4 · CITY EXPLORER ─────────────────────────────────────────────── */}
      <CitiesSection />

      {/* ── 5 · IMAGE FEATURE SPLIT ───────────────────────────────────────── */}
      <section className="bg-[#f5f5f7] px-5 py-24 dark:bg-[#1d1d1f] sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Large card */}
            <div className="group relative min-h-[420px] overflow-hidden rounded-2xl">
              <Image
                src="/hero/img-a2.png"
                alt="Modern apartment complex"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-8">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/50">
                  Curated discovery
                </p>
                <h3 className="mt-3 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-white">
                  Homes presented the way you actually need to see them.
                </h3>
                <Link
                  href="/search"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-white/60 transition hover:text-white"
                >
                  Search properties <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Stacked right cards */}
            <div className="flex flex-col gap-5">
              <div className="group relative h-[200px] overflow-hidden rounded-2xl">
                <Image
                  src="/hero/img-a4.png"
                  alt="Premium apartment interior"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h3 className="text-lg font-semibold text-white">See the quality before the commute.</h3>
                  <p className="mt-1 text-[13px] text-white/55">Rich photos so you can evaluate layout and finish from home.</p>
                </div>
              </div>

              <div className="group relative h-[200px] overflow-hidden rounded-2xl">
                <Image
                  src="/hero/img-a5.png"
                  alt="Urban building"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h3 className="text-lg font-semibold text-white">Inspect first. Pay after.</h3>
                  <p className="mt-1 text-[13px] text-white/55">Book a viewing in-app, not over WhatsApp.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6 · HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="bg-white px-5 py-24 dark:bg-black sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-3">
            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#0071e3] dark:text-[#2997ff]">
              Simple process
            </p>
            <h2 className="mt-2 text-[32px] font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-[#f5f5f7] sm:text-[40px]">
              Four steps to your new home.
            </h2>
          </div>
          <div className="mb-10 h-px bg-black/8 dark:bg-white/8" />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ n, title, desc }) => (
              <div
                key={n}
                className="rounded-2xl border border-black/8 bg-[#f5f5f7] p-7 dark:border-white/8 dark:bg-[#1d1d1f]"
              >
                <span className="text-[13px] font-bold text-[#0071e3] dark:text-[#2997ff]">0{n}</span>
                <h3 className="mt-4 text-xl font-semibold tracking-[-0.015em] text-[#1d1d1f] dark:text-[#f5f5f7]">
                  {title}
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed text-[#6e6e73] dark:text-[#a1a1a6]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7 · TRUST ─────────────────────────────────────────────────────── */}
      <section className="bg-[#f5f5f7] px-5 py-24 dark:bg-[#1d1d1f] sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-3">
            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#0071e3] dark:text-[#2997ff]">
              Why House9ja
            </p>
            <h2 className="mt-2 max-w-2xl text-[32px] font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-[#f5f5f7] sm:text-[40px]">
              Built on trust,<br />designed for Nigeria.
            </h2>
          </div>
          <div className="mb-10 h-px bg-black/8 dark:bg-white/8" />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-black/8 bg-white p-7 dark:border-white/8 dark:bg-[#2d2d2f]">
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f5f7] dark:bg-[#3a3a3c]">
                  <Icon className="h-5 w-5 text-[#0071e3] dark:text-[#2997ff]" />
                </div>
                <h3 className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">{title}</h3>
                <p className="mt-2.5 text-[13px] leading-relaxed text-[#6e6e73] dark:text-[#a1a1a6]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8 · CTA ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white px-5 py-28 dark:bg-black sm:px-8">
        {/* Background image — muted, far background */}
        <div className="pointer-events-none absolute inset-0">
          <Image
            src="/backgrounds/luxury-night-house.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-[0.06] dark:opacity-[0.08]"
          />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#0071e3] dark:text-[#2997ff]">
            Get started today
          </p>
          <h2 className="mt-4 text-[36px] font-semibold leading-tight tracking-[-0.025em] text-[#1d1d1f] dark:text-[#f5f5f7] sm:text-[52px]">
            Your next home is
            <br />
            already listed.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base text-[#6e6e73] dark:text-[#a1a1a6]">
            Browse verified listings across Nigeria — free to search, free to enquire, no hidden charges.
          </p>

          <ul className="mx-auto mt-7 flex max-w-md flex-col gap-2 text-left sm:mx-auto">
            {['No hidden fees', 'Verified landlords and agents', 'Book physical inspections on-platform'].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-[14px] text-[#6e6e73] dark:text-[#a1a1a6]">
                <CheckCircle className="h-4 w-4 shrink-0 text-[#0071e3] dark:text-[#2997ff]" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/search"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#0071e3] px-8 text-[15px] font-semibold text-white transition hover:bg-[#0077ed] active:scale-[0.98] dark:bg-[#2997ff] dark:text-black dark:hover:bg-[#409cff]"
            >
              Browse homes
            </Link>
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-full border border-black/12 bg-transparent px-8 text-[15px] font-semibold text-[#1d1d1f] transition hover:bg-black/5 active:scale-[0.98] dark:border-white/15 dark:text-[#f5f5f7] dark:hover:bg-white/8"
            >
              Create free account
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
