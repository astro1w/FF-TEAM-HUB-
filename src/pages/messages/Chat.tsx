import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  getConversationMeta,
  listMessages,
  markConversationRead,
  MESSAGE_PAGE_SIZE,
  sendMessage,
  subscribeConversation
} from '@/services/messageService'
import type { ConversationMeta, Message } from '@/types/message'
import { useAuth } from '@/hooks/useAuth'
import { usePresence } from '@/hooks/usePresence'
import Avatar from '@/components/ui/Avatar'
import VerifiedBadge from '@/components/ui/VerifiedBadge'
import LoadingState from '@/components/ui/LoadingState'
import ErrorState from '@/components/ui/ErrorState'
import EmptyState from '@/components/ui/EmptyState'
import { BackIcon } from '@/components/feed/icons'

type LoadState = 'loading' | 'ready' | 'error' | 'notfound'

function newClientId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-MZ', { weekday: 'long', day: 'numeric', month: 'long' })
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })

export default function Chat() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const online = usePresence(user?.id)

  const [state, setState] = useState<LoadState>('loading')
  const [meta, setMeta] = useState<ConversationMeta | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [text, setText] = useState('')
  const [newBelow, setNewBelow] = useState(0)
  const [viewport, setViewport] = useState<{ height: number; top: number } | null>(null)

  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const textRef = useRef('') // espelho síncrono: impede duplo toque no botão
  const atBottomRef = useRef(true)
  const stickRef = useRef(false) // pedir scroll para o fim no próximo render
  const anchorRef = useRef<{ height: number; top: number } | null>(null) // preserva posição ao carregar antigas

  const scrollToBottom = useCallback((smooth = false) => {
    const el = listRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  const markRead = useCallback(() => {
    if (!id || document.visibilityState !== 'visible') return
    markConversationRead(id).catch(console.error)
  }, [id])

  // Insere ou substitui (mensagem otimista → confirmada) sem nunca duplicar.
  const upsert = useCallback((msg: Message) => {
    setMessages((prev) => {
      const i = prev.findIndex((m) => m.id === msg.id || (!!msg.clientId && m.clientId === msg.clientId))
      if (i === -1) return [...prev, msg]
      const next = prev.slice()
      next[i] = msg
      return next
    })
  }, [])

  // ---- carregar conversa ----
  const load = useCallback(async () => {
    if (!id || !user) return
    setState('loading')
    setMessages([])
    setNewBelow(0)
    try {
      const [m, msgs] = await Promise.all([getConversationMeta(id, user.id), listMessages(id)])
      if (!m) {
        setState('notfound')
        return
      }
      setMeta(m)
      stickRef.current = true
      setMessages(msgs)
      setHasMore(msgs.length === MESSAGE_PAGE_SIZE)
      setState('ready')
      markRead()
    } catch (e) {
      console.error(e)
      setState('error')
    }
  }, [id, user?.id, markRead])

  useEffect(() => {
    load()
  }, [load])

  // ---- tempo real ----
  useEffect(() => {
    if (!id || !user || state !== 'ready') return
    const unsub = subscribeConversation(id, {
      onMessage: (msg) => {
        if (msg.senderId !== user.id) {
          if (atBottomRef.current) {
            stickRef.current = true
            markRead()
          } else {
            setNewBelow((n) => n + 1)
          }
        }
        upsert(msg)
      },
      onOtherRead: (uid, readAt) => {
        if (uid !== user.id) setMeta((m) => (m ? { ...m, otherLastReadAt: readAt } : m))
      }
    })
    const onVisible = () => document.visibilityState === 'visible' && atBottomRef.current && markRead()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      unsub()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [id, user?.id, state, upsert, markRead])

  // ---- scroll: só desce quando é suposto ----
  useLayoutEffect(() => {
    const el = listRef.current
    if (!el) return
    if (anchorRef.current) {
      el.scrollTop = el.scrollHeight - anchorRef.current.height + anchorRef.current.top
      anchorRef.current = null
    } else if (stickRef.current) {
      stickRef.current = false
      el.scrollTop = el.scrollHeight
      atBottomRef.current = true
    }
  }, [messages])

  function onScroll() {
    const el = listRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    atBottomRef.current = atBottom
    if (atBottom && newBelow > 0) {
      setNewBelow(0)
      markRead()
    }
  }

  // ---- teclado móvel: a área visível acompanha o visualViewport ----
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => {
      setViewport({ height: vv.height, top: vv.offsetTop })
      window.scrollTo(0, 0)
      if (atBottomRef.current) requestAnimationFrame(() => scrollToBottom())
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [scrollToBottom])

  async function loadOlder() {
    if (!id || loadingOlder || messages.length === 0) return
    const oldest = messages.find((m) => m.status !== 'sending' && m.status !== 'failed')
    if (!oldest) return
    setLoadingOlder(true)
    try {
      const older = await listMessages(id, oldest.createdAt)
      const el = listRef.current
      if (el) anchorRef.current = { height: el.scrollHeight, top: el.scrollTop }
      setMessages((prev) => [...older.filter((o) => !prev.some((p) => p.id === o.id)), ...prev])
      setHasMore(older.length === MESSAGE_PAGE_SIZE)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingOlder(false)
    }
  }

  // ---- envio ----
  async function deliver(m: Message) {
    try {
      const saved = await sendMessage(m.conversationId, m.senderId, m.body, m.clientId!)
      upsert(saved)
    } catch (e) {
      console.error(e)
      setMessages((prev) => prev.map((x) => (x.clientId === m.clientId ? { ...x, status: 'failed' } : x)))
    }
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault()
    const body = textRef.current.trim()
    if (!body || !user || !id) return
    textRef.current = '' // bloqueia um segundo envio no mesmo toque
    setText('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    const local: Message = {
      id: `local-${newClientId()}`,
      clientId: newClientId(),
      conversationId: id,
      senderId: user.id,
      body,
      createdAt: new Date().toISOString(),
      status: 'sending'
    }
    stickRef.current = true
    setMessages((prev) => [...prev, local])
    inputRef.current?.focus() // mantém o teclado aberto
    void deliver(local)
  }

  function retry(m: Message) {
    setMessages((prev) => prev.map((x) => (x.clientId === m.clientId ? { ...x, status: 'sending' } : x)))
    void deliver(m)
  }

  function discard(m: Message) {
    setMessages((prev) => prev.filter((x) => x.clientId !== m.clientId))
  }

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    textRef.current = e.target.value
    setText(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // No desktop Enter envia; no telemóvel Enter faz nova linha.
    if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(pointer: fine)').matches) {
      e.preventDefault()
      submit()
    }
  }

  const lastMineId = [...messages].reverse().find((m) => m.senderId === user?.id && m.status === 'sent')?.id
  const isOnline = !!meta?.otherId && meta.otherShowOnline && online.has(meta.otherId)
  const name = meta?.otherNickname ?? 'Conversa'

  return (
    <div
      className="fixed left-0 right-0 z-[60] bg-base-900 flex flex-col max-w-xl mx-auto"
      style={{ height: viewport ? viewport.height : '100dvh', top: viewport ? viewport.top : 0 }}
    >
      <header
        className="flex items-center gap-2 px-2 pb-2.5 border-b border-base-700 bg-base-900 shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)' }}
      >
        <button type="button" onClick={() => navigate('/messages')} aria-label="Voltar" className="p-2">
          <BackIcon size={22} />
        </button>
        {meta?.otherId ? (
          <Link to={`/players/${meta.otherId}`} className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative shrink-0">
              <Avatar src={meta.otherAvatar} name={name} size={40} />
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-base-900" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[15px] flex items-center gap-1">
                <span className="truncate">{name}</span>
                {meta.otherVerified && <VerifiedBadge size={14} />}
              </p>
              <p className={`text-xs ${isOnline ? 'text-success' : 'text-white/40'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </Link>
        ) : (
          <h1 className="font-semibold flex-1">{name}</h1>
        )}
      </header>

      {state === 'loading' && (
        <div className="flex-1">
          <LoadingState />
        </div>
      )}
      {state === 'error' && (
        <div className="flex-1 px-4 pt-6">
          <ErrorState message="Não foi possível carregar a conversa." onRetry={load} />
        </div>
      )}
      {state === 'notfound' && (
        <div className="flex-1 px-4 pt-6">
          <EmptyState title="Conversa não encontrada." description="Não existe ou não tens acesso a ela." />
        </div>
      )}

      {state === 'ready' && (
        <>
          <div className="relative flex-1 min-h-0">
            <div
              ref={listRef}
              onScroll={onScroll}
              className="absolute inset-0 overflow-y-auto overscroll-contain px-3 py-3 space-y-1.5"
            >
              {hasMore && (
                <div className="text-center pb-2">
                  <button
                    type="button"
                    onClick={loadOlder}
                    disabled={loadingOlder}
                    className="text-xs text-white/60 underline disabled:opacity-50"
                  >
                    {loadingOlder ? 'A carregar…' : 'Ver mensagens anteriores'}
                  </button>
                </div>
              )}
              {messages.length === 0 && (
                <p className="text-center text-sm text-white/40 pt-10">Ainda não há mensagens. Diz olá 👋</p>
              )}
              {messages.map((m, i) => {
                const mine = m.senderId === user?.id
                const prev = messages[i - 1]
                const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString()
                const read = !!meta?.otherLastReadAt && new Date(meta.otherLastReadAt) >= new Date(m.createdAt)
                return (
                  <React.Fragment key={m.clientId ?? m.id}>
                    {newDay && (
                      <p className="text-center text-[11px] text-white/35 py-2 capitalize">{dayLabel(m.createdAt)}</p>
                    )}
                    <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug ${
                          mine ? 'bg-accent text-white rounded-br-md' : 'bg-base-700 rounded-bl-md'
                        } ${m.status === 'sending' ? 'opacity-70' : ''} ${m.status === 'failed' ? 'ring-1 ring-accent-soft' : ''}`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <p className={`text-[10px] mt-0.5 text-right ${mine ? 'text-white/65' : 'text-white/35'}`}>
                          {timeLabel(m.createdAt)}
                        </p>
                      </div>
                      {mine && m.status === 'sending' && <span className="text-[10px] text-white/40 mt-0.5">A enviar…</span>}
                      {mine && m.status === 'failed' && (
                        <span className="text-[11px] text-accent-soft mt-0.5">
                          Falhou ·{' '}
                          <button type="button" className="underline" onClick={() => retry(m)}>
                            Tentar novamente
                          </button>{' '}
                          ·{' '}
                          <button type="button" className="underline" onClick={() => discard(m)}>
                            Descartar
                          </button>
                        </span>
                      )}
                      {mine && m.id === lastMineId && (
                        <span className={`text-[10px] mt-0.5 ${read ? 'text-accent-soft' : 'text-white/40'}`}>
                          {read ? 'Lida' : 'Enviada'}
                        </span>
                      )}
                    </div>
                  </React.Fragment>
                )
              })}
            </div>

            {newBelow > 0 && (
              <button
                type="button"
                onClick={() => {
                  setNewBelow(0)
                  scrollToBottom(true)
                  markRead()
                }}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white text-black text-sm font-semibold rounded-full px-4 py-2 shadow-lg"
              >
                Nova mensagem ↓{newBelow > 1 ? ` (${newBelow})` : ''}
              </button>
            )}
          </div>

          <form
            onSubmit={submit}
            className="flex items-end gap-2 px-3 pt-2 border-t border-base-700 bg-base-900 shrink-0"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={text}
              onChange={onChange}
              onKeyDown={onKeyDown}
              maxLength={4000}
              placeholder="Mensagem…"
              aria-label="Escrever mensagem"
              enterKeyHint="enter"
              className="flex-1 bg-base-800 rounded-2xl px-4 py-2.5 text-base leading-snug resize-none focus:outline-none placeholder-white/35 max-h-[120px]"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              aria-label="Enviar"
              className="shrink-0 h-11 px-5 rounded-full bg-accent text-white text-sm font-semibold disabled:opacity-30"
            >
              Enviar
            </button>
          </form>
        </>
      )}
    </div>
  )
}
