'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { AdminMetricCard, AdminPageHeader, AdminPanel, AdminTag } from '@/components/admin/admin-shell'
import { adminService } from '@/lib/services/admin-service'
import { Phone, MapPin, CalendarDays } from 'lucide-react'

export default function AdminDashboard() {
  const { data: overview } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => adminService.getOverview(),
  })

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.getUsers(),
  })

  const { data: properties = [] } = useQuery({
    queryKey: ['admin-properties'],
    queryFn: () => adminService.getProperties(),
  })

  const { data: verifications = [] } = useQuery({
    queryKey: ['admin-verifications'],
    queryFn: () => adminService.getVerifications(),
  })

  const { data: reports = [] } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => adminService.getReports(),
  })

  const { data: inquiries = [] } = useQuery({
    queryKey: ['admin-inquiries'],
    queryFn: () => adminService.getInquiries(),
  })

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Overview"
        title="Admin Analytics Dashboard"
        description="Monitor live marketplace health, verification workload, moderation queues, and reported issues from the production backend."
        actions={
          <>
            <Link href="/admin/properties">
              <Button className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">Moderate Properties</Button>
            </Link>
            <Link href="/admin/verifications">
              <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800">
                Review Verifications
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard label="Total Users" value={String(overview?.users ?? 0)} detail="Accounts currently in the platform" trend="positive" />
        <AdminMetricCard label="Listings" value={String(overview?.properties ?? 0)} detail="Properties available or under review" trend="positive" />
        <AdminMetricCard label="Pending Verifications" value={String(overview?.pendingVerifications ?? 0)} detail="Landlord documents awaiting decision" trend="warning" />
        <AdminMetricCard label="Open Reports" value={String(overview?.openDisputes ?? 0)} detail="Reported issues requiring moderation" trend="warning" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <AdminPanel title="Newest Users" description="Recently created accounts from the live admin user feed.">
          <div className="space-y-3">
            {users.slice(0, 5).map((user) => (
              <div key={user.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium text-white">{user.firstName} {user.lastName}</div>
                    <div className="text-sm text-slate-400">{user.email}</div>
                  </div>
                  <div className="text-right">
                    <AdminTag tone={user.isVerified ? 'success' : 'warning'}>{user.role}</AdminTag>
                    <div className="mt-2 text-xs text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            ))}
            {!users.length ? <div className="rounded-2xl bg-slate-900/60 px-4 py-4 text-sm text-slate-400">No users available yet.</div> : null}
          </div>
        </AdminPanel>

        <AdminPanel title="Recent Reports" description="Backend-backed list of unresolved or recently created reports.">
          <div className="space-y-3">
            {reports.slice(0, 5).map((report) => (
              <div key={report.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium text-white">{report.type}</div>
                    <div className="text-sm text-slate-400">{report.description}</div>
                  </div>
                  <AdminTag tone={report.status === 'PENDING' ? 'warning' : 'default'}>{report.status}</AdminTag>
                </div>
              </div>
            ))}
            {!reports.length ? <div className="rounded-2xl bg-slate-900/60 px-4 py-4 text-sm text-slate-400">No reports in the moderation queue.</div> : null}
          </div>
        </AdminPanel>
      </div>

      <AdminPanel title="Booking Requests" description="Viewing requests submitted via the public booking form.">
        <div className="space-y-3">
          {inquiries.slice(0, 8).map((inquiry) => (
            <div key={inquiry.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="font-medium text-white">{inquiry.fullName}</div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{inquiry.phone}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{inquiry.preferredArea}</span>
                    <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{inquiry.preferredDate}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">Budget: {inquiry.budgetRange}</div>
                  {inquiry.description && <div className="mt-1 text-xs text-slate-500 line-clamp-2">{inquiry.description}</div>}
                </div>
                <div className="shrink-0 text-xs text-slate-500">{new Date(inquiry.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
          {!inquiries.length && (
            <div className="rounded-2xl bg-slate-900/60 px-4 py-4 text-sm text-slate-400">No booking requests yet.</div>
          )}
        </div>
      </AdminPanel>

      <div className="grid gap-6 md:grid-cols-2">
        <AdminPanel title="Pending Verifications" description="Latest landlord verification submissions waiting for action.">
          <div className="space-y-3">
            {verifications.slice(0, 5).map((verification) => (
              <div key={verification.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium text-white">{verification.landlord.firstName} {verification.landlord.lastName}</div>
                    <div className="text-sm text-slate-400">{verification.landlord.email}</div>
                  </div>
                  <AdminTag tone={verification.status === 'PENDING' ? 'warning' : verification.status === 'APPROVED' ? 'success' : 'danger'}>
                    {verification.status}
                  </AdminTag>
                </div>
              </div>
            ))}
            {!verifications.length ? <div className="rounded-2xl bg-slate-900/60 px-4 py-4 text-sm text-slate-400">No verification submissions found.</div> : null}
          </div>
        </AdminPanel>

        <AdminPanel title="Latest Listings" description="Recently created properties from the moderation feed.">
          <div className="space-y-4">
            {properties.slice(0, 5).map((property) => (
              <div key={property.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium text-white">{property.title}</div>
                    <div className="text-sm text-slate-400">{property.location}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-emerald-400">₦{property.price.toLocaleString()}</div>
                    <div className="mt-1 text-xs text-slate-500">{property.isVerified ? 'Verified' : 'Pending review'}</div>
                  </div>
                </div>
              </div>
            ))}
            {!properties.length ? <div className="rounded-2xl bg-slate-900/60 px-4 py-4 text-sm text-slate-400">No properties available yet.</div> : null}
          </div>
        </AdminPanel>
      </div>
    </div>
  )
}
