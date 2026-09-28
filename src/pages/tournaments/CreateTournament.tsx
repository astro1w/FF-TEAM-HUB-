import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { createTournament } from '@/services/tournamentService'
import type { TournamentFormat } from '@/types/tournament'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import ImagePicker from '@/components/ui/ImagePicker'
import { uploadImage, IMAGE_PRESETS } from '@/services/storageService'

const FORMATS: TournamentFormat[] = ['Battle Royale', 'Liga', 'Eliminação', 'Grupos + Final']

export default function CreateTournament() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [maxTeams, setMaxTeams] = useState(16)
  const [format, setFormat] = useState<TournamentFormat>('Battle Royale')
  const [rules, setRules] = useState('')
  const [prize, setPrize] = useState('')
  const [pointsPerKill, setPointsPerKill] = useState(1)
  const [banner, setBanner] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (profile && !['organizer', 'admin'].includes(profile.role)) {
    return (
      <div className="px-4 pt-10 text-center">
        <p className="font-semibold">Acesso restrito</p>
        <p className="text-white/50 text-sm mt-1">Apenas organizadores podem criar torneios.</p>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!name.trim() || !startsAt) {
      setError('Nome e data inicial são obrigatórios.')
      return
    }
    if (endsAt && new Date(endsAt) < new Date(startsAt)) {
      setError('A data final não pode ser anterior à inicial.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const bannerUrl = banner
        ? await uploadImage('tournament-banners', user.id, banner, IMAGE_PRESETS.banner)
        : undefined
      const t = await createTournament({
        name, description, startsAt, endsAt: endsAt || undefined,
        maxTeams, format, rules, prize, pointsPerKill, bannerUrl
      }, user.id)
      navigate(`/tournaments/${t.id}`, { replace: true })
    } catch (err) {
      console.error(err)
      setError('Não foi possível criar o torneio. Verifica se tens role de organizador.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6">Criar Torneio</h1>
      <form onSubmit={handleSubmit}>
        <ImagePicker label="Banner (opcional)" file={banner} onChange={setBanner} shape="wide" />
        <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} placeholder="MZ Community Cup" required />
        <div className="mb-4">
          <label className="label-text">Descrição</label>
          <textarea className="input-field min-h-[60px] resize-none" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <Input label="Início" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
        <Input label="Fim (opcional)" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        <div className="mb-4">
          <label className="label-text">Formato</label>
          <select className="input-field" value={format} onChange={(e) => setFormat(e.target.value as TournamentFormat)}>
            {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <Input label="Máx. Teams" type="number" min={2} max={128} value={maxTeams} onChange={(e) => setMaxTeams(Number(e.target.value))} />
        <Input label="Pontos por kill" type="number" min={0} step={0.5} value={pointsPerKill} onChange={(e) => setPointsPerKill(Number(e.target.value))} />
        <Input label="Premiação" value={prize} onChange={(e) => setPrize(e.target.value)} placeholder="Ex: 50.000 MZN" />
        <div className="mb-4">
          <label className="label-text">Regras</label>
          <textarea className="input-field min-h-[60px] resize-none" value={rules} onChange={(e) => setRules(e.target.value)} />
        </div>
        {error && <p className="text-accent-soft text-sm mb-3">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">Criar Torneio</Button>
      </form>
    </div>
  )
}
