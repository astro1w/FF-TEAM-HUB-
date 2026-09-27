import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'

type Tab = 'players' | 'teams'

export default function Rankings() {
  const [tab, setTab] = useState<Tab>('teams')
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const q =
      tab === 'teams'
        ? supabase
            .from('rankings')
            .select('*, teams(name, tag)')
            .not('team_id', 'is', null)
            .order('points', { ascending: false })
            .limit(50)
        : supabase
            .from('rankings')
            .select('*, profiles(nickname, primary_role)')
            .not('profile_id', 'is', null)
            .order('points', { ascending: false })
            .limit(50)

    q.then(({ data, error }) => {
      if (error) console.error(error)
      setRows(data ?? [])
    }).finally(() => setLoading(false))
  }, [tab])

  return (
    <div className="px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Rankings</h1>
      <p className="text-xs text-white/40 mb-4">
        Rankings da plataforma (não oficiais Garena). Pontos calculados a partir de resultados registados.
      </p>
      <div className="flex gap-2 mb-4">
        {(['teams', 'players'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full ${tab === t ? 'bg-accent text-white' : 'bg-base-700 text-white/70'}`}
          >
            {t === 'teams' ? 'Teams' : 'Jogadores'}
          </button>
        ))}
      </div>
      {loading && <LoadingState />}
      {!loading && rows.length === 0 && (
        <EmptyState
          title="Sem ranking ainda."
          description="Os pontos surgem após resultados de torneios e scrims."
        />
      )}
      {!loading && rows.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 text-xs text-left">
                <th className="pb-2">#</th>
                <th className="pb-2">{tab === 'teams' ? 'Team' : 'Jogador'}</th>
                <th className="pb-2 text-right">Pts</th>
                <th className="pb-2 text-right">W</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="border-t border-base-600">
                  <td className="py-2 text-white/50">{i + 1}</td>
                  <td className="py-2 font-medium">
                    {tab === 'teams'
                      ? `[${r.teams?.tag}] ${r.teams?.name}`
                      : r.profiles?.nickname}
                  </td>
                  <td className="py-2 text-right font-bold text-accent-soft">{r.points}</td>
                  <td className="py-2 text-right text-white/50">{r.wins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
