import React from 'react'

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: number
  rounded?: 'full' | 'xl'
  className?: string
}

export default function Avatar({ src, name, size = 40, rounded = 'full', className = '' }: AvatarProps) {
  const shape = rounded === 'full' ? 'rounded-full' : 'rounded-xl'
  const initials = (name ?? '?').slice(0, 2).toUpperCase()
  return (
    <div
      className={`${shape} bg-base-700 flex items-center justify-center font-black text-accent overflow-hidden shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size / 3)) }}
    >
      {src ? (
        <img src={src} alt={name ? `Foto de ${name}` : ''} loading="lazy" className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </div>
  )
}
