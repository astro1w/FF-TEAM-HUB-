import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { createInitialProfile } from '@/services/profileService'
import { MOZAMBIQUE_PROVINCES } from '@/types/user'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function Register() {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [country] = useState('Moçambique')
  const [province, setProvince] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function validate(): string | null {
    if (!nickname.trim()) return 'O nickname é obrigatório.'
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Introduz um email válido.'
    if (password.length < 8) return 'A password deve ter pelo menos 8 caracteres.'
    if (password !== confirmPassword) return 'As passwords não coincidem.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname } }
    })

    if (signUpError) {
      setLoading(false)
      setError(signUpError.message === 'User already registered' ? 'Este email já está registado.' : 'Não foi possível criar a conta.')
      return
    }

    if (data.user) {
      try {
        await createInitialProfile(data.user.id, nickname, country, province)
      } catch (profileError) {
        console.error('Erro ao criar perfil inicial:', profileError)
      }
    }

    setLoading(false)

    if (!data.session) {
      // Confirmação de email exigida pelo Supabase.
      navigate('/login', { state: { message: 'Verifica o teu email para confirmar a conta.' } })
    } else {
      navigate('/onboarding')
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-black">
          Cria a tua <span className="text-accent">conta</span>
        </h1>
        <p className="text-white/50 text-sm mt-1">Junta-te à comunidade competitiva</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto">
        <Input label="Nickname" name="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label="Confirmar password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <div className="mb-4">
          <label htmlFor="province" className="label-text">
            Província/cidade
          </label>
          <select
            id="province"
            className="input-field"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
          >
            <option value="">Seleciona a província</option>
            {MOZAMBIQUE_PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-accent-soft text-sm mb-4">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">
          Criar conta
        </Button>

        <p className="text-center text-sm mt-5 text-white/50">
          Já tens conta?{' '}
          <Link to="/login" className="text-accent hover:text-accent-soft font-medium">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  )
}
