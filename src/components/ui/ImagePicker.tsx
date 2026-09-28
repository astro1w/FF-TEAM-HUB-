import React, { useEffect, useRef, useState } from 'react'
import { validateImageFile } from '@/lib/imageUtils'

interface ImagePickerProps {
  label: string
  file: File | null
  onChange: (file: File | null) => void
  shape?: 'square' | 'wide'
}

/** Seletor de imagem com pré-visualização. O envio é feito por quem o usa. */
export default function ImagePicker({ label, file, onChange, shape = 'square' }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null
    e.target.value = ''
    if (!picked) return
    const problem = validateImageFile(picked)
    if (problem) {
      setError(problem)
      return
    }
    setError(null)
    onChange(picked)
  }

  const box = shape === 'wide' ? 'w-full h-32' : 'w-20 h-20'

  return (
    <div className="mb-4">
      <span className="label-text">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`${box} rounded-xl2 bg-base-800 border border-dashed border-base-500 flex items-center justify-center overflow-hidden text-white/40 text-xs`}
          aria-label={label}
        >
          {preview ? <img src={preview} alt="" className="w-full h-full object-cover" /> : '+ Imagem'}
        </button>
        {file && shape === 'square' && (
          <button type="button" className="text-xs text-white/50 underline" onClick={() => onChange(null)}>
            Remover
          </button>
        )}
      </div>
      {file && shape === 'wide' && (
        <button type="button" className="text-xs text-white/50 underline mt-1" onClick={() => onChange(null)}>
          Remover imagem
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      {error && <p className="text-accent-soft text-xs mt-1">{error}</p>}
    </div>
  )
}
