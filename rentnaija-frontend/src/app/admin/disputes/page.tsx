'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminPageHeader, AdminPanel, AdminTag } from '@/components/admin/admin-shell'
import { adminService } from '@/lib/services/admin-service'

export default function AdminDisputesPage() {
  const queryClient = useQueryClient()

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => adminService.getReports(),
  })

  const resolve = useMutation({
    mutationFn: (id: string) => adminService.resolveReport(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
  })

  const dismiss = useMutation({
    mutationFn: (id: string) => adminService.dismissReport(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
  })

  const pending = reports.filter((r) => r.status === 'PENDING')
  const resolved = reports.filter((r) => r.status !== 'PENDING')

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Resolution"
        title="Reports"
        description="Review issues raised by users or against listings from the live admin reports feed."
      />

      <AdminPanel
        title={`Report Queue (${pending.length} pending)`}
        description="Reports requiring a moderation decision."
      >
        {isLoading ? (
          <div className="rounded-2xl bg-slate-900/60 p-4 text-sm text-slate-400">Loading reports...</div>
        ) : !pending.length ? (
          <div className="rounded-2xl bg-slate-900/60 p-4 text-sm text-slate-400 text-center">No pending reports. Queue is clear.</div>
        ) : (
          <div className="grid gap-4">
            {pending.map((report) => (
              <div key={report.id} className="rounded-3xl border border-amber-500/20 bg-slate-900/50 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <AdminTag tone="warning">{report.type}</AdminTag>
                      {report.property && (
                        <span className="text-xs text-slate-400">Property: {report.property.title}</span>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-slate-300">{report.description}</div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>Reporter: {report.reporter ? `${report.reporter.firstName} ${report.reporter.lastName}` : 'Unknown'}</span>
                      {report.reported && (
                        <span>Against: {report.reported.firstName} {report.reported.lastName}</span>
                      )}
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="h-8 bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 border border-emerald-500/20"
                      onClick={() => resolve.mutate(report.id)}
                      disabled={resolve.isPending}
                    >
                      <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Resolve
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 bg-slate-700/50 text-slate-400 hover:bg-slate-700 border border-slate-600/20"
                      onClick={() => dismiss.mutate(report.id)}
                      disabled={dismiss.isPending}
                    >
                      <XCircle className="mr-1.5 h-3.5 w-3.5" /> Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminPanel>

      {resolved.length > 0 && (
        <AdminPanel title={`Resolved (${resolved.length})`} description="Closed moderation decisions.">
          <div className="grid gap-3">
            {resolved.map((report) => (
              <div key={report.id} className="rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3 opacity-70">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-slate-300">{report.type}</div>
                    <div className="text-xs text-slate-500">{report.description}</div>
                  </div>
                  <AdminTag tone={report.status === 'RESOLVED' ? 'success' : 'default'}>{report.status}</AdminTag>
                </div>
              </div>
            ))}
          </div>
        </AdminPanel>
      )}
    </div>
  )
}
