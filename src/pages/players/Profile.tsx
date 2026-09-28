import React, { useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import VerifiedBadge from '@/components/ui/VerifiedBadge'
import { Link } from 'react-router-dom'
import { uploadImage, IMAGE_PRESETS } from '@/services/storageService'
import { updateAvatar } from '@/services/profileService'
import { validateImageFile } from '@/lib/imageUtils'
import { ROLE_LABELS } from '@/types/user'

export default function Profile() {
  const { profile, signOut, user, refreshProfile } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !user) return
    const problem = validateImageFile(file)
    if (problem) {
      setPhotoError(problem)
      return
    }
    setUploading(true)
    setPhotoError(null)
    try {
      const url = await uploadImage('avatars', user.id, file, IMAGE_PRESETS.avatar)
      await updateAvatar(user.id, url)
      await refreshProfile()
    } catch (err) {
      console.error(err)
      setPhotoError('Não foi possível enviar a foto. Tenta novamente.')
    } finally {
      setUploading(false)
    }
  }

  if (!profile) {
    return <div className="px-4 pt-10 text-center text-white/50">Perfil não carregado.</div>
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <div className="card text-center mb-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="relative mx-auto block rounded-full"
          aria-label="Alterar foto de perfil"
        >
          <Avatar src={profile.avatarUrl} name={profile.nickname} size={88} />
          <span className="absolute -bottom-1 -right-1 bg-accent text-white text-xs rounded-full w-7 h-7 flex items-center justify-center border-2 border-base-800">
            {uploading ? '…' : '📷'}
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        {photoError && <p className="text-accent-soft text-xs mt-2">{photoError}</p>}
        <h1 className="text-xl font-bold mt-3 flex items-center justify-center gap-1.5">
          {profile.nickname}
          {profile.isVerified && <VerifiedBadge size={18} />}
        </h1>
        <p className="text-xs text-white/40 font-mono mt-0.5">ID: {profile.competitiveId}</p>
        {profile.freeFireId && (
          <p className="text-xs text-white/40 font-mono">FF UID: {profile.freeFireId}</p>
        )}
        <p className="text-sm text-white/50 mt-1">
          🇲🇿 {profile.province ? `${profile.province}, ` : ''}{profile.country}
        </p>
        <div className="flex flex-wrap justify-center gap-1.5 mt-3">
          {profile.primaryRole && (
            <span className="text-[10px] font-semibold bg-accent/20 text-accent-soft px-2 py-0.5 rounded-full">
              {ROLE_LABELS[profile.primaryRole]}
            </span>
          )}
          {profile.secondaryRole && (
            <span className="text-[10px] bg-base-700 text-white/60 px-2 py-0.5 rounded-full">
              {ROLE_LABELS[profile.secondaryRole]}
            </span>
          )}
          {profile.skillLevel && (
            <span className="text-[10px] bg-base-700 text-white/60 px-2 py-0.5 rounded-full">
              {profile.skillLevel}
            </span>
          )}
        </div>
        {profile.bio && <p className="text-sm text-white/60 mt-3">{profile.bio}</p>}
        {profile.availability.length > 0 && (
          <p className="text-xs text-white/40 mt-2">
            Disponibilidade: {profile.availability.join(', ')}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Link to="/teams"><Button variant="secondary" className="w-full">Teams</Button></Link>
        <Link to="/scrims"><Button variant="secondary" className="w-full">Scrims</Button></Link>
        <Link to="/feed"><Button variant="secondary" className="w-full">Feed</Button></Link>
        <Link to="/messages"><Button variant="secondary" className="w-full">Mensagens</Button></Link>
        <Link to="/rankings"><Button variant="secondary" className="w-full">Rankings</Button></Link>
        <Link to="/notifications"><Button variant="secondary" className="w-full">Notificações</Button></Link>
        {(profile.role === 'admin' || profile.role === 'moderator') && (
          <Link to="/admin"><Button variant="secondary" className="w-full">Admin</Button></Link>
        )}
        <Link to="/settings"><Button variant="secondary" className="w-full">Definições</Button></Link>
        <Button variant="secondary" className="w-full !text-accent-soft" onClick={() => signOut()}>
          Terminar sessão
        </Button>
      </div>

      <p className="text-[10px] text-white/30 text-center mt-8">
        Role: {profile.role} · FF TEAM HUB
      </p>
    </div>
  )
}
