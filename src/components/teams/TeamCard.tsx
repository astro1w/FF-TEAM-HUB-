import React from 'react'
import { Link } from 'react-router-dom'
import type { Team } from '@/types/team'

export default function TeamCard({ team }: { team: Team }) {
  return (
    <Link to={`/teams/${team.id}`} className="card block active:scale-[0.98] transition-transform">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-base-700 flex items-center justify-center text-lg font-black text-accent shrink-0 overflow-hidden">
          {team.logoUrl ? (
            <img src={team.logoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            team.tag.slice(0, 2)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold truncate">{team.name}</h3>
            <span className="text-xs text-white/40 font-mono">[{team.tag}]</span>
          </div>
          <p className="text-xs text-white/50 mt-0.5">
            🇲🇿 {team.province ? `${team.province}, ` : ''}{team.country}
            {team.memberCount != null && ` · ${team.memberCount} membros`}
          </p>
          {team.recruiting && (
            <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wide bg-success/15 text-success px-2 py-0.5 rounded-full">
              A recrutar
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
