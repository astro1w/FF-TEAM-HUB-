import React from 'react'
import { Link } from 'react-router-dom'
import type { Tournament } from '@/types/tournament'

export default function TournamentCard({ tournament }: { tournament: Tournament }) {
  const date = new Date(tournament.startsAt)
  return (
    <Link to={`/tournaments/${tournament.id}`} className="card block active:scale-[0.98] transition-transform overflow-hidden">
      {tournament.bannerUrl && (
        <img src={tournament.bannerUrl} alt="" className="w-full h-28 object-cover -mx-4 -mt-4 mb-3" style={{ width: 'calc(100% + 2rem)' }} />
      )}
      <h3 className="font-bold truncate">{tournament.name}</h3>
      <p className="text-xs text-white/50 mt-0.5">
        {date.toLocaleDateString('pt-MZ')} · {tournament.format}
      </p>
      <div className="flex gap-1.5 mt-2">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
          tournament.status === 'open' ? 'bg-success/15 text-success' :
          tournament.status === 'live' ? 'bg-accent/20 text-accent-soft' :
          'bg-base-700 text-white/50'
        }`}>{tournament.status}</span>
        <span className="text-[10px] bg-base-700 px-2 py-0.5 rounded-full">
          {tournament.teamCount ?? 0}/{tournament.maxTeams}
        </span>
        {tournament.prize && (
          <span className="text-[10px] bg-warning/15 text-warning px-2 py-0.5 rounded-full">{tournament.prize}</span>
        )}
      </div>
    </Link>
  )
}
