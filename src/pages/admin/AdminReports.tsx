import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { listReports, updateReportStatus } from '@/services/adminService'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'

export default function AdminReports() {
  const { profile, user } = useAuth()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      setReports(await listReports())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (profile && !['admin', 'moderator'].includes(profile.role)) {
    return <Navigate to="/home" replace />
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Reports</h1>
      {loading && <LoadingState />}
      {!loading && reports.length === 0 && <EmptyState title="Sem reports." />}
      {!loading && reports.length > 0 && (
        <div className="space-y-2">
          {reports.map((r) => (
            <div key={r.id} className="card">
              <div className="flex justify-between">
                <span className="text-xs font-semibold uppercase text-accent-soft">{r.reason}</span>
                <span className="text-xs text-white/40">{r.status}</span>
              </div>
              <p className="text-sm mt-1">
                {r.target_type} · {r.target_id?.slice(0, 8)}…
              </p>
              {r.details && <p className="text-xs text-white/50 mt-1">{r.details}</p>}
              <p className="text-[10px] text-white/30 mt-1">
                por {(r as any).profiles?.nickname} · {new Date(r.created_at).toLocaleString('pt-MZ')}
              </p>
              {r.status === 'pending' && (
                <div className="flex gap-2 mt-2">
                  <Button
                    className="!py-1 !px-2 text-xs flex-1"
                    onClick={async () => {
                      await updateReportStatus(r.id, 'resolved', user!.id)
                      load()
                    }}
                  >
                    Resolver
                  </Button>
                  <Button
                    className="!py-1 !px-2 text-xs flex-1"
                    variant="secondary"
                    onClick={async () => {
                      await updateReportStatus(r.id, 'dismissed', user!.id)
                      load()
                    }}
                  >
                    Descartar
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
