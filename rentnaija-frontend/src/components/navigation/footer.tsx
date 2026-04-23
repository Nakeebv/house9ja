'use client'

import Link from 'next/link'
import Image from 'next/image'

const COL = {
  Discover: [
    { label: 'Search Properties',   href: '/search' },
    { label: 'Lagos Listings',       href: '/search?location=Lagos' },
    { label: 'Abuja Listings',       href: '/search?location=Abuja' },
    { label: 'Ibadan Listings',      href: '/search?location=Ibadan' },
    { label: 'Book a Viewing',       href: '/booking' },
  ],
  Platform: [
    { label: 'Create Account',       href: '/register' },
    { label: 'Sign In',              href: '/login' },
    { label: 'Tenant Dashboard',     href: '/dashboard' },
    { label: 'Landlord Portal',      href: '/landlord/dashboard' },
    { label: 'Agent Portal',         href: '/agent/dashboard' },
  ],
  Support: [
    { label: 'Help & Support',       href: '/support' },
    { label: 'Verification',         href: '/verify' },
    { label: 'Terms & Conditions',   href: '/terms' },
    { label: 'Privacy Policy',       href: '#' },
  ],
}

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-black/8 bg-[#f5f5f7] dark:border-white/8 dark:bg-[#1d1d1f]">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">

        {/* Top grid */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand column */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="relative h-8 w-8">
                <Image src="/logo-icon.png" alt="House9ja" fill className="object-contain" sizes="32px" />
              </div>
              <span className="text-[17px] font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">
                house<span className="text-orange-500">9ja</span>
              </span>
            </Link>

            <p className="mt-4 max-w-[260px] text-[14px] leading-relaxed text-[#6e6e73] dark:text-[#a1a1a6]">
              Nigeria's verified rental platform. Find, inspect, and move into your next home — with confidence.
            </p>

            <div className="mt-6 space-y-1.5 text-[13px] text-[#86868b] dark:text-[#6e6e73]">
              <p>support@house9ja.com</p>
              <p>Wuse II, Abuja, Nigeria</p>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(COL).map(([group, links]) => (
            <div key={group}>
              <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#1d1d1f] dark:text-[#f5f5f7]">
                {group}
              </p>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-[14px] text-[#6e6e73] transition-colors hover:text-[#1d1d1f] dark:text-[#a1a1a6] dark:hover:text-[#f5f5f7]"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-start justify-between gap-5 border-t border-black/8 pt-8 dark:border-white/8 sm:flex-row sm:items-center">
          <p className="text-[13px] text-[#86868b] dark:text-[#6e6e73]">
            Copyright &copy; {year} House9ja. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {['Twitter', 'Facebook', 'Instagram', 'LinkedIn'].map((s) => (
              <Link
                key={s}
                href="#"
                className="text-[13px] text-[#86868b] transition-colors hover:text-[#1d1d1f] dark:text-[#6e6e73] dark:hover:text-[#f5f5f7]"
              >
                {s}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </footer>
  )
}
