import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getMyTeams } from '@/services/teamService'
import { createTryout } from '@/services/tryoutService'
import type { Team } from '@/types/team'
import { PLAYER_ROLES } from '@/types/user'
import type { PlayerRole } from '@/types/database'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import LoadingState from '@/components/ui/LoadingState'

export default function CreateTryout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const preselectedTeam = params.get('team')

  const [teams, setTeams] = useState<Team[]>([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [teamId, setTeamId] = useState(preselectedTeam ?? '')
  const [title, setTitle] = useState('')
  const [roleSought, setRoleSought] = useState<PlayerRole>('RUSH')
  const [slots, setSlots] = useState(1)
  const [requirements, setRequirements] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getMyTeams(user.id)
      .then((t) => {
        setTeams(t)
        if (!preselectedTeam && t.length === 1) setTeamId(t[0].id)
      })
      .catch(console.error)
      .finally(() => setLoadingTeams(false))
  }, [user, preselectedTeam])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!teamId) {
      setError('Seleciona a Team.')
      return
    }
    if (title.trim().length < 3) {
      setError('Título demasiado curto.')
      return
    }
    if (slots < 1) {
      setError('Número de vagas deve ser pelo menos 1.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const tryout = await createTryout(
        {
          teamId,
          title: title.trim(),
          roleSought,
          slots,
          requirements: requirements.trim() || undefined,
          description: description.trim() || undefined
        },
        user.id
      )
      navigate(`/tryouts/${tryout.id}`, { replace: true })
    } catch (err) {
      console.error(err)
      setError('Não foi possível publicar o Tryout. Verifica se és capitão desta Team.')
    } finally {
      setLoading(false)
    }
  }

  if (loadingTeams) return <LoadingState message="A carregar as tuas Teams..." />

  if (teams.length === 0) {
    return (
      <div className="px-4 pt-10 max-w-md mx-auto text-center">
        <p className="font-semibold mb-2">Não tens Teams</p>
        <p className="text-white/50 text-sm mb-4">Cria uma Team primeiro para publicar Tryouts.</p>
        <Button onClick={() => navigate('/teams/create')}>Criar Team</Button>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-1">Publicar Tryout</h1>
      <p className="text-white/50 text-sm mb-6">Procura o próximo membro da tua squad.</p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="label-text">Team</label>
          <select className="input-field" value={teamId} onChange={(e) => setTeamId(e.target.value)} required>
            <option value="">Selecionar...</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                [{t.tag}] {t.name}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="🔥 Procuramos RUSH"
          required
        />

        <div className="mb-4">
          <label className="label-text">Função procurada</label>
          <select
            className="input-field"
            value={roleSought}
            onChange={(e) => setRoleSought(e.target.value as PlayerRole)}
          >
            {PLAYER_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Número de vagas"
          type="number"
          min={1}
          max={10}
          value={slots}
          onChange={(e) => setSlots(Number(e.target.value))}
          required
        />

        <div className="mb-4">
          <label className="label-text">Requisitos</label>
          <textarea
            className="input-field min-h-[80px] resize-none"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="- experiência competitiva&#10;- boa comunicação&#10;- disponibilidade à noite"
          />
        </div>

        <div className="mb-4">
          <label className="label-text">Descrição</label>
          <textarea
            className="input-field min-h-[60px] resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mais detalhes sobre o Tryout..."
          />
        </div>

        {error && <p className="text-accent-soft text-sm mb-3">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">
          Publicar Tryout
        </Button>
      </form>
    </div>
  )
}
