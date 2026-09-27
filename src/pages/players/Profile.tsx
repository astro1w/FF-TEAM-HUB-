import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import { Link } from 'react-router-dom'

export default function Profile() {
  const { profile, signOut, user } = useAuth()

  if (!profile) {
    return <div className="px-4 pt-10 text-center text-white/50">Perfil não carregado.</div>
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-md mx-auto">
      <div className="card text-center mb-4">
        <div className="w-20 h-20 rounded-full bg-base-700 mx-auto flex items-center justify-center text-2xl font-black text-accent">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
          ) : (
            profile.nickname.slice(0, 2).toUpperCase()
          )}
        </div>
        <h1 className="text-xl font-bold mt-3">{profile.nickname}</h1>
        {profile.freeFireId && (
          <p className="text-xs text-white/40 font-mono mt-0.5">FF ID: {profile.freeFireId}</p>
        )}
        <p className="text-sm text-white/50 mt-1">
          🇲🇿 {profile.province ? `${profile.province}, ` : ''}{profile.country}
        </p>
        <div className="flex flex-wrap justify-center gap-1.5 mt-3">
          {profile.primaryRole && (
            <span className="text-[10px] font-semibold bg-accent/20 text-accent-soft px-2 py-0.5 rounded-full">
              {profile.primaryRole}
            </span>
          )}
          {profile.secondaryRole && (
            <span className="text-[10px] bg-base-700 text-white/60 px-2 py-0.5 rounded-full">
              {profile.secondaryRole}
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
