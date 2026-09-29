
import type { ProfileCardSettings } from '@/types/profileCard'

type Props = {
  settings: ProfileCardSettings
  nickname: string
  avatarUrl?: string | null
  competitiveId?: string | null
  role?: string | null
  teamName?: string | null
  rank?: string | null
  kills?: number | null
  matches?: number | null
  wins?: number | null
  points?: number | null
  verified?: boolean
}

export default function SignatureCard({ settings, nickname, avatarUrl, competitiveId, role, teamName, rank, kills, matches, wins, points, verified }: Props) {
  const cardStyle = `${settings.theme || "default"}-${settings.frame || "none"}`

  return (
    <div data-card-style={cardStyle} className={"relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-black p-5 text-white shadow-xl"}>
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-white/10">
              {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-2xl">🐼</div>}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-xl font-black">{nickname}</h2>
                {verified && <span className="text-cyan-300">✓</span>}
              </div>
              <p className="text-xs text-white/50">{competitiveId || 'FTH ID não definido'}</p>
            </div>
          </div>
          <div className="text-2xl">{settings.personalSymbol || '⚡'}</div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          {role && <span className="rounded-full bg-white/10 px-3 py-1">{role}</span>}
          {teamName && <span className="rounded-full bg-white/10 px-3 py-1">{teamName}</span>}
          {rank && <span className="rounded-full bg-white/10 px-3 py-1">🏆 {rank}</span>}
        </div>
        {settings.bio && <p className="mt-4 text-sm leading-relaxed text-white/65">{settings.bio}</p>}
        <div className="mt-5 grid grid-cols-4 gap-2">
          {[['KILLS',kills],['MATCHES',matches],['WINS',wins],['POINTS',points]].map(([label,value]) => <div key={String(label)} className="rounded-2xl border border-white/10 bg-black/20 p-2 text-center"><p className="text-[9px] text-white/40">{label}</p><p className="mt-1 text-sm font-black">{value ?? '—'}</p></div>)}
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3">
          <span className="text-[10px] font-bold tracking-[0.25em] text-white/40">FF TEAM HUB</span>
          <span className="text-[10px] text-white/30">PLAYER SIGNATURE</span>
        </div>
      </div>
    </div>
  )
}