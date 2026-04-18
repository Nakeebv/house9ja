import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-400/80">
            {eyebrow}
          </p>
        ) : null}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400 lg:text-base">{description}</p>
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  )
}

export function AdminPanel({
  title,
  description,
  action,
  className,
  contentClassName,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  className?: string
  contentClassName?: string
  children: ReactNode
}) {
  return (
    <Card className={cn('border-slate-800 bg-slate-950/80 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.9)]', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-base text-white">{title}</CardTitle>
          {description ? <CardDescription className="text-slate-400">{description}</CardDescription> : null}
        </div>
        {action}
      </CardHeader>
      <CardContent className={cn('space-y-4', contentClassName)}>{children}</CardContent>
    </Card>
  )
}

export function AdminMetricCard({
  label,
  value,
  detail,
  trend,
}: {
  label: string
  value: string
  detail: string
  trend?: 'positive' | 'negative' | 'warning' | 'neutral'
}) {
  const tone = {
    positive: 'text-emerald-400',
    negative: 'text-rose-400',
    warning: 'text-amber-400',
    neutral: 'text-slate-400',
  }[trend ?? 'neutral']

  return (
    <Card className="border-slate-800 bg-slate-950/90">
      <CardContent className="space-y-3 p-5">
        <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">{label}</div>
        <div className="text-3xl font-semibold text-white">{value}</div>
        <div className={cn('text-sm', tone)}>{detail}</div>
      </CardContent>
    </Card>
  )
}

export function AdminTag({
  children,
  tone = 'default',
}: {
  children: ReactNode
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}) {
  const toneClass = {
    default: 'border-slate-700 bg-slate-900 text-slate-300',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    danger: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    info: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  }[tone]

  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium', toneClass)}>
      {children}
    </span>
  )
}
