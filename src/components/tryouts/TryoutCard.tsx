import { Link } from 'react-router-dom'
import type { Tryout } from '@/types/tryout'

export default function TryoutCard({ tryout }: { tryout: Tryout }) {
  return (
    <Link to={`/tryouts/${tryout.id}`} className="card block active:scale-[0.98] transition-transform">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-white/50 font-mono">
            {tryout.teamTag ? `[${tryout.teamTag}]` : ''} {tryout.teamName}
          </p>
          <h3 className="font-bold mt-0.5 truncate">{tryout.title}</h3>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-[10px] font-semibold bg-accent/20 text-accent-soft px-2 py-0.5 rounded-full">
              {tryout.roleSought}
            </span>
            <span className="text-[10px] text-white/50 px-2 py-0.5 rounded-full bg-base-700">
              {tryout.slots} vaga{tryout.slots !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
      {tryout.requirements && (
        <p className="text-xs text-white/40 mt-2 line-clamp-2">{tryout.requirements}</p>
      )}
    </Link>
  )
}
