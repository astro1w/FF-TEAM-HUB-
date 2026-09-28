import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getPlayerPage, type PlayerPage } from '@/services/playerService'
import { followProfile, isFollowingProfile, unfollowProfile } from '@/services/followService'
import { listPostsByAuthor } from '@/services/feedService'
import { getOrCreateDm } from '@/services/messageService'
import { createReport, type ReportReason } from '@/services/reportService'
import { useAuth } from '@/hooks/useAuth'
import { usePostActions } from '@/hooks/usePostActions'
import { useToast } from '@/components/ui/Toast'
import { ROLE_LABELS, flagEmoji } from '@/types/user'
import type { Post } from '@/types/post'
import Avatar from '@/components/ui/Avatar'
import VerifiedBadge from '@/components/ui/VerifiedBadge'
import PostItem from '@/components/feed/PostItem'
import ReportSheet from '@/components/feed/ReportSheet'
import { BackIcon } from '@/components/feed/icons'
import LoadingState from '@/components/ui/LoadingState'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast, show } = useToast()
  const [page, setPage] = useState<PlayerPage | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [following, setFollowing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [reporting, setReporting] = useState(false)
  const actions = usePostActions(setPosts)

  const isSelf = !!user && user.id === id

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getPlayerPage(id)
      setPage(data)
      if (data) {
        setPosts(await listPostsByAuthor(id, user?.id))
        if (user && user.id !== id) setFollowing(await isFollowingProfile(user.id, id))
      }
    } catch (e) {
      console.error(e)
      setError('Não foi possível carregar este perfil.')
    } finally {
      setLoading(false)
    }
  }, [id, user?.id])

  useEffect(() => {
    load()
  }, [load])

  async function toggleFollow() {
    if (!user || !id || busy) return
    setBusy(true)
    const was = following
    setFollowing(!was)
    setPage((p) => (p ? { ...p, followers: Math.max(0, p.followers + (was ? -1 : 1)) } : p))
    try {
      if (was) await unfollowProfile(user.id, id)
      else await followProfile(user.id, id)
    } catch (e) {
      console.error(e)
      setFollowing(was)
      setPage((p) => (p ? { ...p, followers: Math.max(0, p.followers + (was ? 1 : -1)) } : p))
      show('Não foi possível atualizar. Tenta novamente.')
    } finally {
      setBusy(false)
    }
  }

  async function openChat() {
    if (!user || !id) return
    try {
      const conversationId = await getOrCreateDm(user.id, id)
      navigate(`/messages/${conversationId}`)
    } catch (e) {
      console.error(e)
      show('Não foi possível abrir a conversa.')
    }
  }

  async function submitReport(reason: ReportReason) {
    if (!user || !id) return
    try {
      await createReport(user.id, 'player', id, reason)
      show('Denúncia enviada. Obrigado.')
    } catch (e) {
      console.error(e)
      show('Não foi possível enviar a denúncia.')
    } finally {
      setReporting(false)
    }
  }

  return (
    <div className="pb-24 max-w-xl mx-auto">
      <header className="sticky top-0 z-30 bg-base-900/90 backdrop-blur border-b border-base-700 flex items-center gap-2 px-2 py-3">
        <button type="button" onClick={() => navigate(-1)} aria-label="Voltar" className="p-2">
          <BackIcon size={22} />
        </button>
        <h1 className="font-semibold">Perfil</h1>
      </header>

      {loading && <LoadingState />}
      {error && (
        <div className="px-4 pt-4">
          <ErrorState message={error} onRetry={load} />
        </div>
      )}
      {!loading && !error && !page && (
        <div className="px-4 pt-4">
          <EmptyState title="Jogador não encontrado." description="O perfil pode ter sido removido ou estar indisponível." />
        </div>
      )}

      {!loading && page && (
        <>
          <section className="px-4 pt-4">
            {/* COMPETITIVE ID */}
            <div className="card">
              <p className="text-[10px] tracking-widest text-white/40 font-semibold mb-3">COMPETITIVE ID</p>
              <div className="flex items-center gap-3">
                <Avatar src={page.profile.avatarUrl} name={page.profile.nickname} size={64} />
                <div className="min-w-0">
                  <h2 className="text-lg font-bold flex items-center gap-1.5">
                    <span className="truncate">{page.profile.nickname}</span>
                    {page.profile.isVerified && <VerifiedBadge size={18} />}
                  </h2>
                  <p className="text-sm text-white/60">
                    {flagEmoji(page.profile.countryCode)} {page.profile.province ? `${page.profile.province}, ` : ''}
                    {page.profile.country}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {page.profile.primaryRole && (
                  <span className="text-[11px] font-semibold bg-accent/20 text-accent-soft px-2 py-0.5 rounded-full">
                    {ROLE_LABELS[page.profile.primaryRole]}
                  </span>
                )}
                {page.profile.secondaryRole && (
                  <span className="text-[11px] bg-base-700 text-white/60 px-2 py-0.5 rounded-full">
                    {ROLE_LABELS[page.profile.secondaryRole]}
                  </span>
                )}
                {page.profile.skillLevel && (
                  <span className="text-[11px] bg-base-700 text-white/60 px-2 py-0.5 rounded-full">
                    {page.profile.skillLevel}
                  </span>
                )}
              </div>

              {page.team && (
                <Link to={`/teams/${page.team.id}`} className="flex items-center gap-2 mt-3 text-sm">
                  <Avatar src={page.team.logoUrl} name={page.team.tag} size={28} rounded="xl" />
                  <span className="font-medium">
                    [{page.team.tag}] {page.team.name}
                  </span>
                  <span className="text-white/40 text-xs">· {page.team.teamRole}</span>
                </Link>
              )}

              <div className="mt-3 pt-3 border-t border-base-600 font-mono text-xs text-white/50 space-y-0.5">
                <p>ID: {page.profile.competitiveId}</p>
                {page.profile.freeFireId && <p>FF UID: {page.profile.freeFireId}</p>}
              </div>
            </div>

            <div className="flex gap-5 mt-4 text-sm">
              <span>
                <strong>{page.followers}</strong> <span className="text-white/50">seguidores</span>
              </span>
              <span>
                <strong>{page.following}</strong> <span className="text-white/50">a seguir</span>
              </span>
            </div>

            {page.profile.bio && <p className="text-sm text-white/70 mt-3 whitespace-pre-wrap">{page.profile.bio}</p>}
            {page.profile.availability.length > 0 && (
              <p className="text-xs text-white/40 mt-2">Disponibilidade: {page.profile.availability.join(', ')}</p>
            )}

            {isSelf ? (
              <Link to="/profile" className="btn-secondary block text-center mt-4">
                Ir para o meu perfil
              </Link>
            ) : (
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={toggleFollow}
                  disabled={busy}
                  className={`flex-1 rounded-xl2 py-3 font-semibold transition-colors ${
                    following ? 'bg-base-700 text-white border border-base-500' : 'bg-white text-black'
                  }`}
                >
                  {following ? 'A seguir' : 'Seguir'}
                </button>
                <button type="button" onClick={openChat} className="flex-1 btn-secondary">
                  Mensagem
                </button>
              </div>
            )}
          </section>

          <section className="px-4 mt-6">
            <h3 className="text-xs tracking-widest text-white/40 font-semibold mb-2">ESTATÍSTICAS</h3>
            <EmptyState
              title="Ainda sem estatísticas registadas."
              description="Aparecem aqui quando houver resultados registados na plataforma."
            />
          </section>

          <section className="px-4 mt-6">
            <h3 className="text-xs tracking-widest text-white/40 font-semibold mb-2">CONQUISTAS</h3>
            {page.achievements.length === 0 ? (
              <EmptyState title="Ainda sem conquistas." description="São atribuídas por eventos reais na plataforma." />
            ) : (
              <div className="flex flex-wrap gap-2">
                {page.achievements.map((a) => (
                  <span key={a.title + a.earnedAt} className="card !py-2 !px-3 text-sm">
                    {a.icon} {a.title}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="mt-6">
            <h3 className="text-xs tracking-widest text-white/40 font-semibold mb-1 px-4">PUBLICAÇÕES</h3>
            {posts.length === 0 ? (
              <div className="px-4">
                <EmptyState title="Ainda sem publicações." />
              </div>
            ) : (
              posts.map((p) => (
                <PostItem
                  key={p.id}
                  post={p}
                  currentUserId={actions.currentUserId}
                  canModerate={actions.canModerate}
                  onLike={actions.onLike}
                  onRepost={actions.onRepost}
                  onShare={actions.onShare}
                  onDelete={actions.onDelete}
                  onReport={actions.onReport}
                  onReply={(post) => navigate(`/feed/${post.id}`)}
                />
              ))
            )}
          </section>

          {!isSelf && (
            <div className="text-center mt-8">
              <button type="button" onClick={() => setReporting(true)} className="text-xs text-white/40 underline">
                Denunciar este perfil
              </button>
            </div>
          )}
        </>
      )}

      {toast}
      <ReportSheet
        open={reporting}
        title="Denunciar perfil"
        onClose={() => setReporting(false)}
        onSubmit={submitReport}
      />
      {actions.overlays}
    </div>
  )
}
