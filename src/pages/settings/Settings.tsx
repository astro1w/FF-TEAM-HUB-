import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import Toggle from '@/components/ui/Toggle'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingState from '@/components/ui/LoadingState'
import { ROLE_LABELS, PLAYER_ROLES, SKILL_LEVELS, AVAILABILITIES, MOZAMBIQUE_PROVINCES } from '@/types/user'
import {
  COMPETITIVE_STATUS_LABELS,
  MUTABLE_NOTIFICATION_TYPES,
  NOTIFICATION_LABELS,
  VISIBILITY_LABELS,
  type MutableNotificationType,
  type PrivacySettings,
  type AccountSettings
} from '@/types/settings'
import { setPresenceVisible } from '@/services/presenceService'
import {
  changeEmail,
  changePassword,
  getAccountSettings,
  getMutedNotificationTypes,
  getPrivacySettings,
  requestAccountDeletion,
  sendPasswordReset,
  setNotificationEnabled,
  signOutSessions,
  updateAppPreferences,
  updateBasicProfile,
  updateCompetitiveProfile,
  updatePrivacySettings
} from '@/services/settingsService'

type SectionId = 'conta' | 'competitivo' | 'privacidade' | 'notificacoes' | 'seguranca' | 'app' | null

function Section({
  title,
  id,
  open,
  onToggle,
  children
}: {
  title: string
  id: SectionId
  open: SectionId
  onToggle: (id: SectionId) => void
  children: React.ReactNode
}) {
  const isOpen = open === id
  return (
    <div className="card !p-0 overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(isOpen ? null : id)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-[15px]">{title}</span>
        <span className={`text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {isOpen && <div className="px-4 pb-4 border-t border-base-700">{children}</div>}
    </div>
  )
}

export default function Settings() {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const { toast, show } = useToast()
  const [open, setOpen] = useState<SectionId>(null)
  const [loading, setLoading] = useState(true)

  // Conta
  const [nickname, setNickname] = useState('')
  const [bio, setBio] = useState('')
  const [freeFireId, setFreeFireId] = useState('')
  const [savingAccount, setSavingAccount] = useState(false)
  const [email, setEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [savingSecurity, setSavingSecurity] = useState(false)

  // Perfil competitivo
  const [province, setProvince] = useState<string>('')
  const [primaryRole, setPrimaryRole] = useState<string>('')
  const [secondaryRole, setSecondaryRole] = useState<string>('')
  const [skillLevel, setSkillLevel] = useState<string>('')
  const [availability, setAvailability] = useState<string[]>([])
  const [account, setAccount] = useState<AccountSettings | null>(null)
  const [savingCompetitive, setSavingCompetitive] = useState(false)

  // Privacidade
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null)

  // Notificações
  const [muted, setMuted] = useState<Set<MutableNotificationType>>(new Set())

  // Eliminar conta
  const [deleteReason, setDeleteReason] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!user || !profile) return
    setNickname(profile.nickname)
    setBio(profile.bio ?? '')
    setFreeFireId(profile.freeFireId ?? '')
    setEmail(user.email ?? '')
    setProvince(profile.province ?? '')
    setPrimaryRole(profile.primaryRole ?? '')
    setSecondaryRole(profile.secondaryRole ?? '')
    setSkillLevel(profile.skillLevel ?? '')
    setAvailability(profile.availability ?? [])

    Promise.all([getPrivacySettings(user.id), getAccountSettings(user.id), getMutedNotificationTypes(user.id)])
      .then(([p, a, m]) => {
        setPrivacy(p)
        setAccount(a)
        setMuted(m)
        setPresenceVisible(p.showOnlineStatus).catch(console.error)
      })
      .catch((e) => {
        console.error(e)
        show('Não foi possível carregar algumas definições.')
      })
      .finally(() => setLoading(false))
  }, [user?.id, profile?.id])

  if (!user || !profile || loading) return <LoadingState />

  async function saveAccount() {
    setSavingAccount(true)
    try {
      await updateBasicProfile(user!.id, { nickname, bio, freeFireId })
      await refreshProfile()
      show('Perfil atualizado')
    } catch (e) {
      console.error(e)
      show('Não foi possível guardar. Tenta novamente.')
    } finally {
      setSavingAccount(false)
    }
  }

  async function saveCompetitive() {
    if (!account) return
    setSavingCompetitive(true)
    try {
      await updateCompetitiveProfile(user!.id, {
        countryCode: profile!.countryCode,
        province: province || null,
        primaryRole: primaryRole || null,
        secondaryRole: secondaryRole || null,
        skillLevel: skillLevel || null,
        availability,
        competitiveStatus: account.competitiveStatus
      })
      await refreshProfile()
      show('Perfil competitivo atualizado')
    } catch (e) {
      console.error(e)
      show('Não foi possível guardar. Tenta novamente.')
    } finally {
      setSavingCompetitive(false)
    }
  }

  async function togglePrivacy<K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) {
    if (!privacy) return
    const prev = privacy
    setPrivacy({ ...privacy, [key]: value })
    try {
      await updatePrivacySettings(user!.id, { [key]: value })
      if (key === 'showOnlineStatus') await setPresenceVisible(value as boolean)
    } catch (e) {
      console.error(e)
      setPrivacy(prev)
      show('Não foi possível guardar. Tenta novamente.')
    }
  }

  async function toggleNotification(type: MutableNotificationType, enabled: boolean) {
    const prev = new Set(muted)
    setMuted((cur) => {
      const next = new Set(cur)
      enabled ? next.delete(type) : next.add(type)
      return next
    })
    try {
      await setNotificationEnabled(type, enabled)
    } catch (e) {
      console.error(e)
      setMuted(prev)
      show('Não foi possível guardar. Tenta novamente.')
    }
  }

  async function toggleCompetitiveStatus(value: AccountSettings['competitiveStatus']) {
    if (!account) return
    const prev = account
    setAccount({ ...account, competitiveStatus: value })
    try {
      await updateCompetitiveProfile(user!.id, {
        countryCode: profile!.countryCode,
        province: province || null,
        primaryRole: primaryRole || null,
        secondaryRole: secondaryRole || null,
        skillLevel: skillLevel || null,
        availability,
        competitiveStatus: value
      })
    } catch (e) {
      console.error(e)
      setAccount(prev)
      show('Não foi possível guardar. Tenta novamente.')
    }
  }

  async function handleChangeEmail() {
    if (!newEmail.trim()) return
    setSavingSecurity(true)
    try {
      await changeEmail(newEmail.trim())
      show('Verifica a nova caixa de email para confirmar a alteração.')
      setNewEmail('')
    } catch (e) {
      console.error(e)
      show('Não foi possível alterar o email.')
    } finally {
      setSavingSecurity(false)
    }
  }

  async function handleChangePassword() {
    if (newPassword.length < 6) {
      show('A palavra-passe precisa de pelo menos 6 caracteres.')
      return
    }
    setSavingSecurity(true)
    try {
      await changePassword(newPassword)
      setNewPassword('')
      show('Palavra-passe alterada')
    } catch (e) {
      console.error(e)
      show('Não foi possível alterar a palavra-passe.')
    } finally {
      setSavingSecurity(false)
    }
  }

  async function handleSignOutOthers() {
    try {
      await signOutSessions('others')
      show('Sessões terminadas nos outros dispositivos.')
    } catch (e) {
      console.error(e)
      show('Não foi possível terminar as outras sessões.')
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await requestAccountDeletion(deleteReason)
      show('Pedido enviado. A tua conta foi suspensa e será eliminada em breve.')
      await signOut()
      navigate('/login', { replace: true })
    } catch (e) {
      console.error(e)
      show('Não foi possível processar o pedido.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-xl mx-auto space-y-3">
      {toast}
      <h1 className="text-xl font-bold mb-1">Definições</h1>

      {/* CONTA */}
      <Section title="Conta" id="conta" open={open} onToggle={setOpen}>
        <Input label="Nome de exibição" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={30} />
        <Input label="UID Free Fire" value={freeFireId} onChange={(e) => setFreeFireId(e.target.value)} maxLength={20} />
        <div className="mb-4">
          <label className="label-text" htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            className="input-field resize-none"
            rows={3}
            maxLength={200}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <Button onClick={saveAccount} loading={savingAccount} disabled={!nickname.trim()} className="w-full">
          Guardar
        </Button>
        <p className="text-xs text-white/40 mt-3">
          ID competitivo: <span className="font-mono">{profile.competitiveId}</span> (não pode ser alterado)
        </p>
        <p className="text-xs text-white/40 mt-1">Email atual: {email || '—'}</p>
      </Section>

      {/* PERFIL COMPETITIVO */}
      <Section title="Perfil competitivo" id="competitivo" open={open} onToggle={setOpen}>
        <div className="mb-4">
          <label className="label-text" htmlFor="province">Província</label>
          <select id="province" className="input-field" value={province} onChange={(e) => setProvince(e.target.value)}>
            <option value="">—</option>
            {MOZAMBIQUE_PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="label-text" htmlFor="primaryRole">Função principal</label>
            <select id="primaryRole" className="input-field" value={primaryRole} onChange={(e) => setPrimaryRole(e.target.value)}>
              <option value="">—</option>
              {PLAYER_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text" htmlFor="secondaryRole">Função secundária</label>
            <select id="secondaryRole" className="input-field" value={secondaryRole} onChange={(e) => setSecondaryRole(e.target.value)}>
              <option value="">—</option>
              {PLAYER_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label className="label-text" htmlFor="skillLevel">Nível de experiência</label>
          <select id="skillLevel" className="input-field" value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)}>
            <option value="">—</option>
            {SKILL_LEVELS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <p className="label-text">Disponibilidade</p>
          <div className="flex flex-wrap gap-2">
            {AVAILABILITIES.map((a) => {
              const active = availability.includes(a)
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvailability((prev) => (active ? prev.filter((x) => x !== a) : [...prev, a]))}
                  className={`text-xs px-3 py-1.5 rounded-full border ${
                    active ? 'bg-accent border-accent text-white' : 'border-base-600 text-white/60'
                  }`}
                >
                  {a}
                </button>
              )
            })}
          </div>
        </div>
        {account && (
          <div className="mb-4">
            <p className="label-text">Disponibilidade para recrutamento</p>
            <div className="flex flex-col gap-2">
              {(Object.keys(COMPETITIVE_STATUS_LABELS) as (keyof typeof COMPETITIVE_STATUS_LABELS)[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleCompetitiveStatus(s)}
                  className={`text-left text-sm px-3 py-2 rounded-xl2 border ${
                    account.competitiveStatus === s ? 'bg-accent/15 border-accent text-white' : 'border-base-600 text-white/60'
                  }`}
                >
                  {COMPETITIVE_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        )}
        <Button onClick={saveCompetitive} loading={savingCompetitive} className="w-full">
          Guardar
        </Button>
      </Section>

      {/* PRIVACIDADE */}
      <Section title="Privacidade" id="privacidade" open={open} onToggle={setOpen}>
        {privacy && (
          <div className="divide-y divide-base-700">
            <div className="py-3">
              <p className="text-[15px] mb-2">Quem pode enviar-me mensagens</p>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(VISIBILITY_LABELS) as (keyof typeof VISIBILITY_LABELS)[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => togglePrivacy('whoCanMessage', v)}
                    className={`text-xs px-3 py-1.5 rounded-full border ${
                      privacy.whoCanMessage === v ? 'bg-accent border-accent text-white' : 'border-base-600 text-white/60'
                    }`}
                  >
                    {VISIBILITY_LABELS[v]}
                  </button>
                ))}
              </div>
            </div>
            <div className="py-3">
              <p className="text-[15px] mb-2">Quem pode comentar nas minhas publicações</p>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(VISIBILITY_LABELS) as (keyof typeof VISIBILITY_LABELS)[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => togglePrivacy('whoCanComment', v)}
                    className={`text-xs px-3 py-1.5 rounded-full border ${
                      privacy.whoCanComment === v ? 'bg-accent border-accent text-white' : 'border-base-600 text-white/60'
                    }`}
                  >
                    {VISIBILITY_LABELS[v]}
                  </button>
                ))}
              </div>
            </div>
            <Toggle
              label="Mostrar estado online"
              checked={privacy.showOnlineStatus}
              onChange={(v) => togglePrivacy('showOnlineStatus', v)}
            />
            <Toggle
              label="Mostrar UID do Free Fire no perfil"
              checked={privacy.showUid}
              onChange={(v) => togglePrivacy('showUid', v)}
            />
            <Toggle
              label="Mostrar estatísticas no perfil"
              checked={privacy.showStats}
              onChange={(v) => togglePrivacy('showStats', v)}
            />
            <p className="text-xs text-white/35 pt-2">
              "Quem pode ver o perfil" ainda não está disponível — o perfil é visível a todos por agora.
            </p>
          </div>
        )}
        <Link to="/settings/blocked" className="block mt-3">
          <Button variant="secondary" className="w-full">Jogadores bloqueados</Button>
        </Link>
      </Section>

      {/* NOTIFICAÇÕES */}
      <Section title="Notificações" id="notificacoes" open={open} onToggle={setOpen}>
        <div className="divide-y divide-base-700">
          {MUTABLE_NOTIFICATION_TYPES.map((t) => (
            <Toggle
              key={t}
              label={NOTIFICATION_LABELS[t]}
              checked={!muted.has(t)}
              onChange={(v) => toggleNotification(t, v)}
            />
          ))}
        </div>
        <p className="text-xs text-white/35 pt-2">
          Candidaturas, scrims, torneios e atualizações de equipa continuam sempre ativos por agora.
        </p>
      </Section>

      {/* SEGURANÇA */}
      <Section title="Segurança" id="seguranca" open={open} onToggle={setOpen}>
        <Input
          label="Novo email"
          type="email"
          placeholder={email}
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
        />
        <Button onClick={handleChangeEmail} loading={savingSecurity} disabled={!newEmail.trim()} variant="secondary" className="w-full mb-4">
          Alterar email
        </Button>

        <Input
          label="Nova palavra-passe"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Button onClick={handleChangePassword} loading={savingSecurity} disabled={!newPassword} variant="secondary" className="w-full mb-4">
          Alterar palavra-passe
        </Button>

        <Button variant="secondary" className="w-full mb-2" onClick={() => sendPasswordReset(email).then(() => show('Email de recuperação enviado.')).catch(() => show('Não foi possível enviar o email.'))}>
          Enviar email de recuperação
        </Button>
        <Button variant="secondary" className="w-full mb-2" onClick={handleSignOutOthers}>
          Terminar sessão noutros dispositivos
        </Button>
        <Button variant="secondary" className="w-full !text-accent-soft" onClick={() => signOut()}>
          Terminar sessão
        </Button>
      </Section>

      {/* APARÊNCIA E IDIOMA */}
      <Section title="Aparência e idioma" id="app" open={open} onToggle={setOpen}>
        {account && (
          <>
            <div className="mb-4">
              <p className="label-text">Tema</p>
              <div className="flex gap-2">
                {(['system', 'dark', 'light'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      updateAppPreferences(user!.id, { theme: t })
                        .then(refreshProfile)
                        .catch(() => show('Não foi possível guardar.'))
                    }
                    className={`text-xs px-3 py-1.5 rounded-full border ${
                      account.themePreference === t ? 'bg-accent border-accent text-white' : 'border-base-600 text-white/60'
                    }`}
                  >
                    {t === 'system' ? 'Seguir sistema' : t === 'dark' ? 'Escuro' : 'Claro'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/35 mt-2">
                A tua escolha fica guardada; a app ainda só tem o visual escuro implementado.
              </p>
            </div>
            <div>
              <p className="label-text">Idioma</p>
              <div className="flex gap-2">
                {(['pt', 'en'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() =>
                      updateAppPreferences(user!.id, { locale: l })
                        .then(refreshProfile)
                        .catch(() => show('Não foi possível guardar.'))
                    }
                    className={`text-xs px-3 py-1.5 rounded-full border ${
                      account.locale === l ? 'bg-accent border-accent text-white' : 'border-base-600 text-white/60'
                    }`}
                  >
                    {l === 'pt' ? 'Português' : 'English'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/35 mt-2">A tradução para inglês ainda não está pronta.</p>
            </div>
          </>
        )}
      </Section>

      {/* ELIMINAR CONTA */}
      <div className="card border-accent/30">
        <p className="font-semibold text-accent-soft mb-1">Eliminar conta</p>
        <p className="text-xs text-white/50 mb-3">
          Esta ação suspende a tua conta de imediato e pede a eliminação definitiva. Não é reversível.
        </p>
        {!confirmDelete ? (
          <Button variant="secondary" className="w-full !text-accent-soft" onClick={() => setConfirmDelete(true)}>
            Eliminar conta
          </Button>
        ) : (
          <div>
            <textarea
              className="input-field resize-none mb-2"
              rows={2}
              placeholder="Porque estás a sair? (opcional)"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
            />
            <p className="text-sm mb-3">Tens a certeza? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(false)}>
                Cancelar
              </Button>
              <Button className="flex-1 !bg-accent-soft" loading={deleting} onClick={handleDelete}>
                Confirmar eliminação
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
