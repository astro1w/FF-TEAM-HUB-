import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listScrims } from '@/services/scrimService'
import type { Scrim } from '@/types/scrim'
import ScrimCard from '@/components/scrims/ScrimCard'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import Button from '@/components/ui/Button'

export default function Scrims() {
  const [scrims, setScrims] = useState<Scrim[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setScrims(await listScrims())
    } catch (e) {
      console.error(e)
      setError('Não foi possível carregar Scrims.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Scrims</h1>
        <Link to="/scrims/create"><Button className="!py-2 !px-3 text-sm">+ Criar</Button></Link>
      </div>
      {loading && <LoadingState message="A carregar Scrims..." />}
      {error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && scrims.length === 0 && (
        <EmptyState title="Sem Scrims agendadas." description="Cria a primeira scrim da comunidade." />
      )}
      {!loading && !error && scrims.length > 0 && (
        <div className="space-y-3">{scrims.map((s) => <ScrimCard key={s.id} scrim={s} />)}</div>
      )}
    </div>
  )
}
