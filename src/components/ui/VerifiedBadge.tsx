import React from 'react'

export default function VerifiedBadge({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label="Verificado"
      className="inline-block shrink-0 align-middle"
    >
      <title>Verificado</title>
      <path
        d="M12 1.5l2.7 1.9 3.3-.1 1 3.1 2.7 1.9-1 3.1 1 3.1-2.7 1.9-1 3.1-3.3-.1L12 22.5l-2.7-1.9-3.3.1-1-3.1-2.7-1.9 1-3.1-1-3.1 2.7-1.9 1-3.1 3.3.1L12 1.5z"
        fill="#3B9CFF"
      />
      <path d="M7.8 12.3l3 3 5.4-6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
