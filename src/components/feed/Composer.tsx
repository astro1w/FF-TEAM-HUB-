import React, { useEffect, useRef, useState } from 'react'
import Avatar from '@/components/ui/Avatar'
import { validateImageFile } from '@/lib/imageUtils'
import { CloseIcon, ImageIcon } from './icons'

const MAX_CHARS = 500

interface ComposerProps {
  avatarUrl?: string | null
  nickname?: string | null
  placeholder: string
  submitLabel?: string
  autoFocus?: boolean
  onSubmit: (body: string, image: File | null) => Promise<void>
}

/** Caixa de escrita ao estilo Threads: avatar à esquerda, texto que cresce, imagem opcional. */
export default function Composer({
  avatarUrl,
  nickname,
  placeholder,
  submitLabel = 'Publicar',
  autoFocus = false,
  onSubmit
}: ComposerProps) {
  const [body, setBody] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const areaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!image) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(image)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  useEffect(() => {
    if (autoFocus) areaRef.current?.focus()
  }, [autoFocus])

  function grow(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`
  }

  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const problem = validateImageFile(file)
    if (problem) {
      setError(problem)
      return
    }
    setError(null)
    setImage(file)
  }

  async function submit() {
    if (!body.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      await onSubmit(body, image)
      setBody('')
      setImage(null)
      if (areaRef.current) areaRef.current.style.height = 'auto'
    } catch (e) {
      console.error(e)
      setError('Não foi possível publicar. Tenta novamente.')
    } finally {
      setBusy(false)
    }
  }

  const left = MAX_CHARS - body.length

  return (
    <div className="flex gap-3 px-4 py-3 border-b border-base-700">
      <Avatar src={avatarUrl} name={nickname} size={40} />
      <div className="flex-1 min-w-0">
        <textarea
          ref={areaRef}
          rows={1}
          value={body}
          maxLength={MAX_CHARS}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(e) => {
            setBody(e.target.value)
            grow(e.target)
          }}
          className="w-full bg-transparent text-[15px] leading-relaxed placeholder-white/35 resize-none focus:outline-none py-2"
        />

        {preview && (
          <div className="relative mt-1 mb-2">
            <img src={preview} alt="Pré-visualização" className="rounded-xl2 w-full max-h-64 object-cover" />
            <button
              type="button"
              onClick={() => setImage(null)}
              aria-label="Remover imagem"
              className="absolute top-2 right-2 bg-black/70 rounded-full p-1.5"
            >
              <CloseIcon size={16} />
            </button>
          </div>
        )}

        {error && <p className="text-accent-soft text-xs mb-1">{error}</p>}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Adicionar imagem"
            className="p-2 -ml-2 text-white/50"
          >
            <ImageIcon />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
          <div className="flex items-center gap-3">
            {left <= 100 && (
              <span className={`text-xs ${left <= 20 ? 'text-accent-soft' : 'text-white/40'}`}>{left}</span>
            )}
            <button
              type="button"
              onClick={submit}
              disabled={!body.trim() || busy}
              className="bg-white text-black text-sm font-semibold rounded-full px-5 py-2 disabled:opacity-30"
            >
              {busy ? 'A enviar…' : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
