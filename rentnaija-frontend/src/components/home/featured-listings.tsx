'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { MapPin, ShieldCheck, Bed, Bath, ArrowUpRight } from 'lucide-react'
import { propertyService } from '@/lib/services/property-service'

export function FeaturedListings() {
  const { data, isLoading } = useQuery({
    queryKey: ['home-featured'],
    queryFn: () => propertyService.search({ limit: 6, page: 1 }),
    staleTime: 5 * 60_000,
  })

  const list = data?.properties ?? []

  return (
    <section className="bg-[#f5f5f7] px-5 py-24 dark:bg-[#1d1d1f] sm:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#0071e3] dark:text-[#2997ff]">
              Just listed
            </p>
            <h2 className="mt-2 text-[32px] font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-[#f5f5f7] sm:text-[40px]">
              Featured Homes
            </h2>
          </div>
          <Link
            href="/search"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-[#0071e3] transition hover:underline dark:text-[#2997ff]"
          >
            View all listings
            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Thin rule */}
        <div className="mb-10 h-px bg-black/8 dark:bg-white/8" />

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-black/5 dark:bg-white/5" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-black/8 bg-white py-24 text-center dark:border-white/8 dark:bg-[#2d2d2f]">
            <p className="text-[#6e6e73] dark:text-[#a1a1a6]">No listings yet — check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <Link
                key={p.id}
                href={`/property/${p.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.07)] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.13)] hover:-translate-y-1 dark:bg-[#2d2d2f] dark:shadow-none dark:hover:shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
              >
                {/* Image */}
                <div className="relative h-52 overflow-hidden bg-[#e8e8ed] dark:bg-[#3a3a3c]">
                  <Image
                    src={p.images[0] ?? '/hero/img-a1.png'}
                    alt={p.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-500 will-change-transform group-hover:scale-[1.04]"
                  />

                  {/* Verified pill */}
                  {p.landlord?.isVerified && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#0071e3] shadow-sm backdrop-blur dark:bg-black/70 dark:text-[#2997ff]">
                      <ShieldCheck className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col p-5">
                  {/* Price */}
                  <p className="text-[22px] font-semibold tracking-[-0.015em] text-[#1d1d1f] dark:text-[#f5f5f7]">
                    ₦{p.price.toLocaleString()}
                    <span className="ml-1 text-sm font-normal text-[#6e6e73] dark:text-[#a1a1a6]">
                      /{p.priceType === 'DAILY' ? 'day' : p.priceType === 'MONTHLY' ? 'mo' : 'yr'}
                    </span>
                  </p>

                  {/* Title */}
                  <h3 className="mt-1.5 truncate text-base font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                    {p.title}
                  </h3>

                  {/* Location */}
                  <p className="mt-1 flex items-center gap-1 text-[13px] text-[#6e6e73] dark:text-[#a1a1a6]">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{p.location}</span>
                  </p>

                  {/* Divider */}
                  <div className="my-4 h-px bg-black/6 dark:bg-white/6" />

                  {/* Specs */}
                  <div className="flex items-center gap-5 text-[13px] text-[#6e6e73] dark:text-[#a1a1a6]">
                    <span className="flex items-center gap-1.5">
                      <Bed className="h-3.5 w-3.5" />
                      {p.bedrooms} {p.bedrooms === 1 ? 'Bed' : 'Beds'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Bath className="h-3.5 w-3.5" />
                      {p.bathrooms} {p.bathrooms === 1 ? 'Bath' : 'Baths'}
                    </span>
                    <span className="ml-auto capitalize text-[#86868b] dark:text-[#6e6e73]">
                      {p.propertyType.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
