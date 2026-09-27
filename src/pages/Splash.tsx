import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function Splash() {
  const navigate = useNavigate()
  const { user, profile, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    const timer = setTimeout(() => {
      if (!user) {
        navigate('/login', { replace: true })
      } else if (profile && !profile.onboardingCompleted) {
        navigate('/onboarding', { replace: true })
      } else {
        navigate('/home', { replace: true })
      }
    }, 900)
    return () => clearTimeout(timer)
  }, [loading, user, profile, navigate])

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-base-900 px-6 text-center">
      <h1 className="text-4xl font-black tracking-tight">
        FF <span className="text-accent">TEAM HUB</span>
      </h1>
      <p className="text-white/60 mt-3">Find your squad. Build your legacy.</p>
      <div className="mt-10 h-1 w-24 rounded-full bg-base-700 overflow-hidden">
        <div className="h-full w-1/2 bg-accent animate-pulse" />
      </div>
    </div>
  )
}
