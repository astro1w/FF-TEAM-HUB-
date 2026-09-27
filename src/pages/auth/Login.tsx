import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Preenche email e password.')
      return
    }

    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (signInError) {
      setError('Credenciais inválidas. Verifica o email e a password.')
      return
    }
    navigate('/home')
  }

  async function handleGoogle() {
    setError(null)
    const { error: oAuthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/home` }
    })
    if (oAuthError) setError('Não foi possível iniciar sessão com Google.')
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-black">
          FF <span className="text-accent">TEAM HUB</span>
        </h1>
        <p className="text-white/50 text-sm mt-1">Entra na tua conta</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto">
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-accent-soft text-sm mb-4">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">
          Entrar
        </Button>

        <button type="button" onClick={handleGoogle} className="btn-secondary w-full mt-3">
          Continuar com Google
        </button>

        <div className="flex justify-between mt-5 text-sm">
          <Link to="/forgot-password" className="text-white/50 hover:text-white">
            Esqueci a password
          </Link>
          <Link to="/register" className="text-accent hover:text-accent-soft font-medium">
            Criar conta
          </Link>
        </div>
      </form>
    </div>
  )
}
