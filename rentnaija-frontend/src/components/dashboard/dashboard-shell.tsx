import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function DashboardHero({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-8 text-white shadow-xl sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm text-slate-300 sm:text-base">{description}</p>
      {actions ? <div className="mt-5 flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  )
}

export function DashboardStat({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="space-y-2 p-5">
        <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">{label}</div>
        <div className="text-3xl font-semibold text-slate-950">{value}</div>
        <div className="text-sm text-slate-500">{detail}</div>
      </CardContent>
    </Card>
  )
}

export function DashboardPanel({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-slate-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
