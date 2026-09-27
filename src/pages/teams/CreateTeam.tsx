import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { createTeam } from '@/services/teamService'
import { MOZAMBIQUE_PROVINCES } from '@/types/user'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function CreateTeam() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [tag, setTag] = useState('')
  const [province, setProvince] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    if (name.trim().length < 2) {
      setError('Nome da Team deve ter pelo menos 2 caracteres.')
      return
    }
    if (tag.trim().length < 2 || tag.trim().length > 8) {
      setError('Tag deve ter entre 2 e 8 caracteres.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const team = await createTeam(
        {
          name: name.trim(),
          tag: tag.trim(),
          country: 'Moçambique',
          province: province || undefined,
          description: description.trim() || undefined
        },
        user.id
      )
      await refreshProfile()
      navigate(`/teams/${team.id}`, { replace: true })
    } catch (err: any) {
      console.error(err)
      const msg = err?.message?.includes('unique') || err?.code === '23505'
        ? 'Já existe uma Team com esta tag.'
        : 'Não foi possível criar a Team. Tenta novamente.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-1">Criar Team</h1>
      <p className="text-white/50 text-sm mb-6">Define a identidade da tua squad.</p>

      <form onSubmit={handleSubmit}>
        <Input
          label="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: F4TAL MZ"
          maxLength={48}
          required
        />
        <Input
          label="Tag"
          value={tag}
          onChange={(e) => setTag(e.target.value.toUpperCase())}
          placeholder="Ex: F4TAL"
          maxLength={8}
          required
        />
        <div className="mb-4">
          <label className="label-text">Província</label>
          <select
            className="input-field"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
          >
            <option value="">Selecionar...</option>
            {MOZAMBIQUE_PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="label-text">Descrição</label>
          <textarea
            className="input-field min-h-[88px] resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Quem sois e o que procurais..."
            maxLength={500}
          />
        </div>

        {error && <p className="text-accent-soft text-sm mb-3">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">
          Criar Team
        </Button>
      </form>
    </div>
  )
}
