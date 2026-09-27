import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTryout, applyToTryout } from '@/services/tryoutService'
import type { Tryout } from '@/types/tryout'
import { useAuth } from '@/hooks/useAuth'
import LoadingState from '@/components/ui/LoadingState'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function TryoutDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [tryout, setTryout] = useState<Tryout | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [experience, setExperience] = useState('')
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const t = await getTryout(id!)
        if (!cancelled) setTryout(t)
      } catch (e) {
        console.error(e)
        if (!cancelled) setError('Não foi possível carregar o Tryout.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id])

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !tryout) return
    setApplying(true)
    setFormError(null)
    try {
      await applyToTryout(
        {
          tryoutId: tryout.id,
          message: message.trim() || undefined,
          experience: experience.trim() || undefined
        },
        user.id
      )
      setApplied(true)
      setShowForm(false)
    } catch (err: any) {
      console.error(err)
      const msg =
        err?.code === '23505' || err?.message?.includes('unique')
          ? 'Já te candidataste a este Tryout.'
          : 'Não foi possível enviar a candidatura.'
      setFormError(msg)
    } finally {
      setApplying(false)
    }
  }

  if (loading) return <LoadingState message="A carregar Tryout..." />
  if (error) return <ErrorState message={error} />
  if (!tryout) {
    return (
      <div className="px-4 pt-10">
        <EmptyState title="Tryout não encontrado." />
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <div className="card mb-4">
        <p className="text-xs text-white/50 font-mono">
          {tryout.teamTag ? `[${tryout.teamTag}]` : ''} {tryout.teamName}
        </p>
        <h1 className="text-xl font-bold mt-1">{tryout.title}</h1>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-xs font-semibold bg-accent/20 text-accent-soft px-2.5 py-1 rounded-full">
            {tryout.roleSought}
          </span>
          <span className="text-xs bg-base-700 text-white/70 px-2.5 py-1 rounded-full">
            {tryout.slots} vaga{tryout.slots !== 1 ? 's' : ''}
          </span>
          <span className="text-xs bg-base-700 text-white/70 px-2.5 py-1 rounded-full capitalize">
            {tryout.status}
          </span>
        </div>
        {tryout.requirements && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-white/80 mb-1">Requisitos</h2>
            <p className="text-sm text-white/60 whitespace-pre-wrap">{tryout.requirements}</p>
          </div>
        )}
        {tryout.description && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-white/80 mb-1">Descrição</h2>
            <p className="text-sm text-white/60 whitespace-pre-wrap">{tryout.description}</p>
          </div>
        )}
        <Link to={`/teams/${tryout.teamId}`} className="text-sm text-accent-soft mt-4 inline-block">
          Ver Team →
        </Link>
      </div>

      {applied ? (
        <div className="card text-center py-6 border-success/30">
          <p className="text-success font-semibold">Candidatura enviada!</p>
          <p className="text-white/50 text-sm mt-1">O capitão será notificado.</p>
        </div>
      ) : showForm ? (
        <form onSubmit={handleApply} className="card">
          <h2 className="font-semibold mb-3">Candidatar-me</h2>
          <div className="mb-4">
            <label className="label-text">Mensagem</label>
            <textarea
              className="input-field min-h-[80px] resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Apresenta-te brevemente..."
              maxLength={500}
            />
          </div>
          <Input
            label="Experiência"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="Ex: 2 anos competitivos, IGL"
          />
          {formError && <p className="text-accent-soft text-sm mb-3">{formError}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={applying} className="flex-1">
              Enviar
            </Button>
          </div>
        </form>
      ) : (
        <Button className="w-full" onClick={() => setShowForm(true)}>
          Candidatar-me
        </Button>
      )}
    </div>
  )
}
