import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { createScrim } from '@/services/scrimService'
import { getMyTeams } from '@/services/teamService'
import type { Team } from '@/types/team'
import type { ScrimFormat } from '@/types/scrim'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function CreateScrim() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [teams, setTeams] = useState<Team[]>([])
  const [name, setName] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [format, setFormat] = useState<ScrimFormat>('BR')
  const [maxTeams, setMaxTeams] = useState(12)
  const [rules, setRules] = useState('')
  const [hostTeamId, setHostTeamId] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [roomPassword, setRoomPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getMyTeams(user.id).then((t) => {
      setTeams(t)
      if (t.length === 1) setHostTeamId(t[0].id)
    }).catch(console.error)
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!name.trim() || !scheduledAt) {
      setError('Preenche nome e data/hora.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const scrim = await createScrim({
        name, scheduledAt, format, maxTeams,
        rules: rules || undefined,
        hostTeamId: hostTeamId || undefined,
        roomCode: roomCode || undefined,
        roomPassword: roomPassword || undefined
      }, user.id)
      navigate(`/scrims/${scrim.id}`, { replace: true })
    } catch (err) {
      console.error(err)
      setError('Não foi possível criar a Scrim.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6">Criar Scrim</h1>
      <form onSubmit={handleSubmit}>
        <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} placeholder="Scrim Noite MZ" required />
        <Input label="Data e hora" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required />
        <div className="mb-4">
          <label className="label-text">Formato</label>
          <select className="input-field" value={format} onChange={(e) => setFormat(e.target.value as ScrimFormat)}>
            <option value="BR">Battle Royale</option>
            <option value="CS">Clash Squad</option>
            <option value="Custom">Custom</option>
          </select>
        </div>
        <Input label="Máx. Teams" type="number" min={2} max={48} value={maxTeams} onChange={(e) => setMaxTeams(Number(e.target.value))} />
        {teams.length > 0 && (
          <div className="mb-4">
            <label className="label-text">Team anfitriã</label>
            <select className="input-field" value={hostTeamId} onChange={(e) => setHostTeamId(e.target.value)}>
              <option value="">Nenhuma</option>
              {teams.map((t) => <option key={t.id} value={t.id}>[{t.tag}] {t.name}</option>)}
            </select>
          </div>
        )}
        <Input label="Código da sala (opcional)" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} />
        <Input label="Senha da sala (opcional)" value={roomPassword} onChange={(e) => setRoomPassword(e.target.value)} />
        <div className="mb-4">
          <label className="label-text">Regras</label>
          <textarea className="input-field min-h-[60px] resize-none" value={rules} onChange={(e) => setRules(e.target.value)} />
        </div>
        {error && <p className="text-accent-soft text-sm mb-3">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">Criar Scrim</Button>
      </form>
    </div>
  )
}
