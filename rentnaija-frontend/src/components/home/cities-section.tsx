'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { api } from '@/lib/api'

const CITIES = [
  { name: 'Lagos',         desc: "Nigeria's commercial hub",  image: '/hero/img-a2.png' },
  { name: 'Abuja',         desc: 'The federal capital',       image: '/hero/img-a3.png' },
  { name: 'Ibadan',        desc: 'Southwest heartland',       image: '/hero/img-a5.png' },
  { name: 'Port Harcourt', desc: 'The garden city',           image: '/hero/img-a1.png' },
]

export function CitiesSection() {
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    api.get<Record<string, number>>('/properties/city-counts')
      .then(setCounts)
      .catch(() => {})
  }, [])

  return (
    <section className="bg-white px-5 py-24 dark:bg-black sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-3">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#0071e3] dark:text-[#2997ff]">
            Location
          </p>
          <h2 className="mt-2 text-[32px] font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-[#f5f5f7] sm:text-[40px]">
            Explore by city.
          </h2>
        </div>
        <div className="mb-10 h-px bg-black/8 dark:bg-white/8" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CITIES.map((city) => (
            <Link
              key={city.name}
              href={`/search?location=${encodeURIComponent(city.name)}`}
              className="group relative h-[320px] overflow-hidden rounded-2xl"
            >
              <Image
                src={city.image}
                alt={city.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition duration-700 will-change-transform group-hover:scale-[1.05]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-[12px] font-medium uppercase tracking-wider text-white/50">
                  {city.desc}
                </p>
                <h3 className="mt-1 text-xl font-semibold text-white">{city.name}</h3>

                {counts[city.name] !== undefined && (
                  <p className="mt-1 text-[12px] font-semibold text-orange-400">
                    {counts[city.name].toLocaleString()} listing{counts[city.name] !== 1 ? 's' : ''} available
                  </p>
                )}

                <p className="mt-2 flex items-center gap-1 text-[13px] font-medium text-white/40 transition duration-200 group-hover:text-white/80">
                  Browse listings <ArrowUpRight className="h-3.5 w-3.5" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
