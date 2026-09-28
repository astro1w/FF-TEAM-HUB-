import React from 'react'
import { Link } from 'react-router-dom'
import type { Scrim } from '@/types/scrim'

export default function ScrimCard({ scrim }: { scrim: Scrim }) {
  const date = new Date(scrim.scheduledAt)
  return (
    <Link to={`/scrims/${scrim.id}`} className="card block active:scale-[0.98] transition-transform">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <h3 className="font-bold truncate">{scrim.name}</h3>
          <p className="text-xs text-white/50 mt-0.5">
            {date.toLocaleDateString('pt-MZ')} · {date.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <div className="flex gap-1.5 mt-2">
            <span className="text-[10px] bg-base-700 px-2 py-0.5 rounded-full">{scrim.format}</span>
            <span className="text-[10px] bg-base-700 px-2 py-0.5 rounded-full">
              {scrim.teamCount ?? 0}/{scrim.maxTeams} teams
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              scrim.status === 'open' ? 'bg-success/15 text-success' :
              scrim.status === 'live' ? 'bg-accent/20 text-accent-soft' :
              'bg-base-700 text-white/50'
            }`}>{scrim.status}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
