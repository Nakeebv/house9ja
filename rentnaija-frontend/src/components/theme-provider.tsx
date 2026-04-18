'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'light',
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('h9ja-theme') as Theme | null
    const system: Theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const resolved = stored ?? system
    setTheme(resolved)
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    setMounted(true)

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onSystemChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('h9ja-theme')) {
        const next: Theme = e.matches ? 'dark' : 'light'
        setTheme(next)
        document.documentElement.classList.toggle('dark', next === 'dark')
      }
    }
    mq.addEventListener('change', onSystemChange)
    return () => mq.removeEventListener('change', onSystemChange)
  }, [])

  const toggle = () => {
    setTheme((prev) => {
      const next: Theme = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('h9ja-theme', next)
      document.documentElement.classList.toggle('dark', next === 'dark')
      return next
    })
  }

  if (!mounted) return <>{children}</>

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>
}

export const useTheme = () => useContext(ThemeCtx)
