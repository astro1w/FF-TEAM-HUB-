import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { listMessages, sendMessage, subscribeMessages } from '@/services/messageService'
import type { Message } from '@/types/message'
import { useAuth } from '@/hooks/useAuth'
import LoadingState from '@/components/ui/LoadingState'
import Button from '@/components/ui/Button'

export default function Chat() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    listMessages(id)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoading(false))

    const unsub = subscribeMessages(id, (msg) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
    })
    return unsub
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !id || !text.trim()) return
    setSending(true)
    try {
      const msg = await sendMessage(id, user.id, text)
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
      setText('')
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  if (loading) return <LoadingState />

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto">
      <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-2">
        {messages.map((m) => {
          const mine = m.senderId === user?.id
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-accent text-white' : 'bg-base-700'}`}>
                {!mine && <p className="text-[10px] text-white/50 mb-0.5">{m.senderNickname}</p>}
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className={`text-[10px] mt-1 ${mine ? 'text-white/60' : 'text-white/30'}`}>
                  {new Date(m.createdAt).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="p-3 border-t border-base-600 flex gap-2 bg-base-900">
        <input
          className="input-field flex-1 !py-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Mensagem..."
          maxLength={4000}
        />
        <Button type="submit" loading={sending} disabled={!text.trim()} className="!px-4 !py-2">
          Enviar
        </Button>
      </form>
    </div>
  )
}
