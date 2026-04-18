import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Footer } from '@/components/navigation/footer'
import { Navbar } from '@/components/navigation/navbar'
import { Providers } from './providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "House9ja — Find Verified Homes Across Nigeria",
  description: 'Search verified rental homes across Nigeria. Apartments, duplexes, studios — chat with landlords, book inspections, move in with confidence.',
  keywords: ['rent', 'property', 'apartment', 'Nigeria', 'Lagos', 'Abuja', 'house9ja'],
  icons: {
    icon: [{ url: '/logo-icon.png', type: 'image/png' }],
    apple: [{ url: '/logo-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/logo-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/logo-icon.png" />
        <link rel="preload" as="image" href="/hero/img-a2.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var stored = localStorage.getItem('h9ja-theme');
                var system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                var theme = stored || system;
                if (theme === 'dark') document.documentElement.classList.add('dark');
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <Navbar />
          <main className="min-h-screen pt-[64px]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
