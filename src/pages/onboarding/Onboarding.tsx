import { useState } from 'react';
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { completeOnboarding } from '@/services/profileService'
import { AVAILABILITIES, MOZAMBIQUE_PROVINCES, PLAYER_ROLES, SKILL_LEVELS } from '@/types/user'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const STEPS = ['Identidade', 'Localização', 'Função & Nível', 'Disponibilidade & Bio'] as const

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    nickname: profile?.nickname ?? '',
    freeFireId: '',
    country: 'Moçambique',
    province: profile?.province ?? '',
    city: '',
    primaryRole: '',
    secondaryRole: '',
    skillLevel: '',
    availability: [] as string[],
    bio: ''
  })

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleAvailability(value: string) {
    setForm((prev) => ({
      ...prev,
      availability: prev.availability.includes(value)
        ? prev.availability.filter((v) => v !== value)
        : [...prev.availability, value]
    }))
  }

  function validateStep(): string | null {
    if (step === 0 && !form.nickname.trim()) return 'O nickname é obrigatório.'
    if (step === 1 && !form.province) return 'Seleciona a tua província.'
    if (step === 2 && (!form.primaryRole || !form.skillLevel)) return 'Seleciona a função principal e o nível.'
    return null
  }

  function goNext() {
    const err = validateStep()
    if (err) {
      setError(err)
      return
    }
    setError(null)
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function goBack() {
    setError(null)
    setStep((s) => Math.max(s - 1, 0))
  }

  async function handleFinish() {
    if (!user) return
    const err = validateStep()
    if (err) {
      setError(err)
      return
    }
    setLoading(true)
    setError(null)
    try {
      await completeOnboarding(user.id, form)
      await refreshProfile()
      navigate('/home')
    } catch (e) {
      console.error(e)
      setError('Não foi possível guardar o teu perfil. Tenta novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-8 max-w-sm mx-auto flex flex-col">
      <div className="mb-6">
        <div className="flex gap-1.5 mb-4">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-accent' : 'bg-base-700'}`} />
          ))}
        </div>
        <h1 className="text-xl font-bold">{STEPS[step]}</h1>
      </div>

      <div className="flex-1">
        {step === 0 && (
          <>
            <Input label="Nickname" value={form.nickname} onChange={(e) => update('nickname', e.target.value)} />
            <Input
              label="Free Fire ID"
              value={form.freeFireId}
              onChange={(e) => update('freeFireId', e.target.value)}
              placeholder="Ex: 123456789"
            />
          </>
        )}

        {step === 1 && (
          <>
            <div className="mb-4">
              <label className="label-text">País</label>
              <input className="input-field opacity-60" value={form.country} disabled />
            </div>
            <div className="mb-4">
              <label className="label-text">Província</label>
              <select className="input-field" value={form.province} onChange={(e) => update('province', e.target.value)}>
                <option value="">Seleciona a província</option>
                {MOZAMBIQUE_PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <Input label="Cidade" value={form.city} onChange={(e) => update('city', e.target.value)} />
          </>
        )}

        {step === 2 && (
          <>
            <div className="mb-4">
              <label className="label-text">Função principal</label>
              <div className="grid grid-cols-3 gap-2">
                {PLAYER_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => update('primaryRole', r)}
                    className={`rounded-xl2 py-2 text-sm font-medium border transition ${
                      form.primaryRole === r ? 'bg-accent border-accent' : 'bg-base-800 border-base-600 text-white/70'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="label-text">Função secundária</label>
              <div className="grid grid-cols-3 gap-2">
                {PLAYER_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => update('secondaryRole', r)}
                    className={`rounded-xl2 py-2 text-sm font-medium border transition ${
                      form.secondaryRole === r ? 'bg-accent border-accent' : 'bg-base-800 border-base-600 text-white/70'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="label-text">Nível competitivo</label>
              <select className="input-field" value={form.skillLevel} onChange={(e) => update('skillLevel', e.target.value)}>
                <option value="">Seleciona o nível</option>
                {SKILL_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="mb-4">
              <label className="label-text">Disponibilidade</label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABILITIES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAvailability(a)}
                    className={`rounded-xl2 py-2 text-sm font-medium border transition ${
                      form.availability.includes(a) ? 'bg-accent border-accent' : 'bg-base-800 border-base-600 text-white/70'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="label-text">Bio</label>
              <textarea
                className="input-field min-h-[100px]"
                value={form.bio}
                onChange={(e) => update('bio', e.target.value)}
                placeholder="Fala um pouco sobre ti como jogador..."
              />
            </div>
          </>
        )}
      </div>

      {error && <p className="text-accent-soft text-sm mb-4">{error}</p>}

      <div className="flex gap-3 pb-6">
        {step > 0 && (
          <Button variant="secondary" onClick={goBack} className="flex-1">
            Voltar
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button onClick={goNext} className="flex-1">
            Continuar
          </Button>
        ) : (
          <Button onClick={handleFinish} loading={loading} className="flex-1">
            Concluir
          </Button>
        )}
      </div>
    </div>
  )
}
