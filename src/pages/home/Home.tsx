import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { listTryouts } from '@/services/tryoutService'
import { listTeams } from '@/services/teamService'
import { listScrims } from '@/services/scrimService'
import { listTournaments } from '@/services/tournamentService'
import type { Tryout } from '@/types/tryout'
import type { Team } from '@/types/team'
import type { Scrim } from '@/types/scrim'
import type { Tournament } from '@/types/tournament'
import TryoutCard from '@/components/tryouts/TryoutCard'
import TeamCard from '@/components/teams/TeamCard'
import ScrimCard from '@/components/scrims/ScrimCard'
import TournamentCard from '@/components/tournaments/TournamentCard'
import EmptyState from '@/components/ui/EmptyState'
import LoadingState from '@/components/ui/LoadingState'

export default function Home() {
  const { profile } = useAuth()
  const [tryouts, setTryouts] = useState<Tryout[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [scrims, setScrims] = useState<Scrim[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [t, tm, s, tn] = await Promise.all([
          listTryouts({ status: 'open' }).catch(() => []),
          listTeams({ recruiting: true, country: 'Moçambique' }).catch(() => []),
          listScrims().catch(() => []),
          listTournaments('open').catch(() => [])
        ])
        if (!cancelled) {
          setTryouts(t.slice(0, 3))
          setTeams(tm.slice(0, 3))
          setScrims(s.slice(0, 3))
          setTournaments(tn.slice(0, 3))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="text-xl font-bold">Olá, {profile?.nickname ?? 'Jogador'} 👋</h1>
          <p className="text-white/50 text-sm">Pronto para a próxima competição?</p>
        </div>
        <div className="flex gap-2">
          <Link to="/feed" className="w-10 h-10 rounded-full bg-base-800 border border-base-600 flex items-center justify-center text-lg" aria-label="Feed">📰</Link>
          <Link to="/notifications" className="w-10 h-10 rounded-full bg-base-800 border border-base-600 flex items-center justify-center text-lg" aria-label="Notificações">🔔</Link>
        </div>
      </div>

      <Link to="/explore" className="input-field flex items-center gap-2 mb-6 mt-5 !text-white/40 no-underline">
        <span>🔎</span>
        <span>Procurar jogadores, Teams...</span>
      </Link>

      {loading ? (
        <LoadingState message="A carregar feed..." />
      ) : (
        <>
          <Section title="🔥 Tryouts recentes" link="/tryouts" linkLabel="Ver todos">
            {tryouts.length === 0 ? (
              <EmptyState title="Ainda não existem Tryouts." />
            ) : (
              <div className="space-y-3">{tryouts.map((t) => <TryoutCard key={t.id} tryout={t} />)}</div>
            )}
          </Section>

          <Section title="🏆 Torneios abertos" link="/tournaments" linkLabel="Ver todos">
            {tournaments.length === 0 ? (
              <EmptyState title="Nenhum torneio aberto." />
            ) : (
              <div className="space-y-3">{tournaments.map((t) => <TournamentCard key={t.id} tournament={t} />)}</div>
            )}
          </Section>

          <Section title="⚔️ Scrims próximas" link="/scrims" linkLabel="Ver todas">
            {scrims.length === 0 ? (
              <EmptyState title="Sem Scrims agendadas." />
            ) : (
              <div className="space-y-3">{scrims.map((s) => <ScrimCard key={s.id} scrim={s} />)}</div>
            )}
          </Section>

          <Section title="👥 Teams a recrutar" link="/teams" linkLabel="Ver todas">
            {teams.length === 0 ? (
              <EmptyState title="Nenhuma Team a recrutar." />
            ) : (
              <div className="space-y-3">{teams.map((t) => <TeamCard key={t.id} team={t} />)}</div>
            )}
          </Section>
        </>
      )}
    </div>
  )
}

function Section({ title, children, link, linkLabel }: {
  title: string; children: React.ReactNode; link?: string; linkLabel?: string
}) {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-white/80">{title}</h2>
        {link && <Link to={link} className="text-xs text-accent-soft font-medium">{linkLabel ?? 'Ver'}</Link>}
      </div>
      {children}
    </section>
  )
}
