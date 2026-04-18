'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { CalendarDays, CheckCircle2, Clock3, MapPin, MessageSquare, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'

const steps = [
  {
    title: 'Share where you want to rent',
    description: 'Tell us your preferred city, area, rent range, and move-in timing.',
  },
  {
    title: 'Choose inspection windows',
    description: 'Pick realistic viewing slots that fit Lagos traffic, work schedules, and weekend movement.',
  },
  {
    title: 'Arrive prepared',
    description: 'Use the checklist to ask about power, water, service charges, access roads, and tenancy terms.',
  },
]

const checklist = [
  'Confirm if rent is annual, bi-annual, or short-let and ask for the full payment breakdown.',
  'Ask how many hours of power supply the building gets and who handles backup systems.',
  'Check drainage, flood history, access roads, and commute time during peak traffic.',
  'Verify service charges, waste disposal, parking rules, and guest restrictions.',
]

export default function BookingPage() {
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    preferredArea: '',
    budgetRange: '',
    preferredDate: '',
    description: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    if (!form.fullName || !form.phone || !form.preferredArea || !form.budgetRange || !form.preferredDate) {
      setStatus('error')
      return
    }
    setStatus('loading')
    try {
      await api.post('/inquiries', form)
      setStatus('success')
      setForm({ fullName: '', phone: '', preferredArea: '', budgetRange: '', preferredDate: '', description: '' })
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f5fbff_0%,#ffffff_36%,#f8fafc_100%)]">
      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="relative mx-auto grid max-w-6xl gap-6 overflow-hidden rounded-[32px] px-5 py-8 text-white shadow-[0_28px_100px_-44px_rgba(15,23,42,0.75)] sm:px-8 sm:py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:py-14">
          <div className="absolute inset-0">
            <Image
              src="/backgrounds/luxury-night-house.png"
              alt="Luxury night home backdrop for booking page"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.90),rgba(2,6,23,0.76),rgba(2,6,23,0.72))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),rgba(2,6,23,0)_34%),linear-gradient(180deg,rgba(2,6,23,0.18),rgba(2,6,23,0.68))]" />
          </div>

          <div className="relative z-10">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">Book Inspections</p>
            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">Schedule smarter property viewings without the usual confusion.</h1>
            <p className="mt-5 max-w-2xl text-base text-slate-300 sm:text-lg">
              We adapted this experience for the way people rent in Nigeria, where timing, neighborhood context, and payment clarity matter as much as the photos.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-cyan-300" />
                  <p className="font-medium">Flexible viewing windows</p>
                </div>
                <p className="mt-3 text-sm text-slate-300">Plan around weekday traffic, weekend availability, and landlord response times.</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-cyan-300" />
                  <p className="font-medium">More informed inspections</p>
                </div>
                <p className="mt-3 text-sm text-slate-300">Know what to ask before you spend money securing a home that is not a good fit.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Move Better</p>
                <p className="mt-2 text-sm text-slate-200">Shortlist homes with a more premium, confident inspection workflow.</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Ask Better</p>
                <p className="mt-2 text-sm text-slate-200">Use the booking stage to verify payment terms and building realities.</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Decide Better</p>
                <p className="mt-2 text-sm text-slate-200">Reduce rushed choices by showing up with context and a checklist.</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 rounded-[28px] bg-white p-6 text-slate-950 shadow-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-600">Quick Booking Request</p>
            {status === 'success' ? (
              <div className="mt-6 flex flex-col items-center gap-4 py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                <h3 className="text-xl font-semibold text-slate-950">Request submitted!</h3>
                <p className="text-sm text-slate-500">Your viewing request has been received. Our team will be in touch shortly.</p>
                <Button variant="outline" onClick={() => setStatus('idle')} className="mt-2">Submit another request</Button>
              </div>
            ) : (
              <div className="mt-5 grid gap-4">
                <Input
                  placeholder="Full name"
                  value={form.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                />
                <Input
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
                <Input
                  placeholder="Preferred area e.g. Lekki, Wuse 2, Bodija"
                  value={form.preferredArea}
                  onChange={(e) => handleChange('preferredArea', e.target.value)}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    placeholder="Budget range"
                    value={form.budgetRange}
                    onChange={(e) => handleChange('budgetRange', e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder="Preferred date"
                    value={form.preferredDate}
                    onChange={(e) => handleChange('preferredDate', e.target.value)}
                  />
                </div>
                <Textarea
                  placeholder="Share the type of home you want, your move-in timeline, and anything you want to verify during inspection."
                  rows={5}
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
                {status === 'error' && (
                  <p className="text-sm text-rose-500">Please fill in all required fields and try again.</p>
                )}
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleSubmit}
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Submitting…' : 'Submit Viewing Request'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-blue-600">How It Works</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">A simpler inspection flow built for real renters.</h2>
            </div>
            <Link href="/search" className="text-sm font-medium text-blue-600">
              View available homes
            </Link>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-[28px] bg-slate-50 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-lg font-semibold text-white">
                  {index + 1}
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-950">{step.title}</h3>
                <p className="mt-3 text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[32px] bg-gradient-to-br from-blue-600 to-cyan-500 p-8 text-white">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-blue-100">Inspection Checklist</p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Questions worth asking before any payment leaves your account.</h2>
            <div className="mt-8 space-y-4">
              {checklist.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-white/10 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-white" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="relative mb-5 h-48 overflow-hidden rounded-[22px]">
                <Image src="/hero/img-a4.png" alt="Apartment interior for booking guidance" fill sizes="(max-width: 1024px) 100vw, 560px" className="object-cover" />
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h3 className="text-xl font-semibold text-slate-950">Location matters beyond the listing title</h3>
              </div>
              <p className="mt-4 text-slate-600">
                In many cities, two homes with similar rent can offer very different commute times, security conditions, and utility reliability. Booking should help you compare those realities.
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Clock3 className="h-5 w-5 text-blue-600" />
                <h3 className="text-xl font-semibold text-slate-950">Good timing saves money and stress</h3>
              </div>
              <p className="mt-4 text-slate-600">
                Rushed inspections often lead to skipped questions, poor neighborhood checks, and surprise charges. A better booking flow reduces that pressure.
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <h3 className="text-xl font-semibold text-slate-950">Communication should be clearer</h3>
              </div>
              <p className="mt-4 text-slate-600">
                The goal is to give tenants a clearer handoff from listing discovery to landlord conversation, not just another pretty form.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
