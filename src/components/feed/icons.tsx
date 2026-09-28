import React from 'react'

interface IconProps {
  size?: number
  filled?: boolean
  className?: string
}

function Svg({ size = 20, className = '', children, filled = false }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  )
}

export const HeartIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.6 4.5 6.4 4.5c2 0 3.5 1.1 4.3 2.4.8-1.3 2.3-2.4 4.3-2.4 3.8 0 5.5 3.9 4 7.3C19.5 16.4 12 21 12 21z" />
  </Svg>
)

export const CommentIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 20.5l1.4-5.2A8.5 8.5 0 1 1 21 11.5z" />
  </Svg>
)

export const RepostIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M17 2l4 4-4 4" />
    <path d="M3 11V9a3 3 0 0 1 3-3h15" />
    <path d="M7 22l-4-4 4-4" />
    <path d="M21 13v2a3 3 0 0 1-3 3H3" />
  </Svg>
)

export const ShareIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </Svg>
)

export const MoreIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="5" cy="12" r="1.2" fill="currentColor" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    <circle cx="19" cy="12" r="1.2" fill="currentColor" />
  </Svg>
)

export const ImageIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </Svg>
)

export const BackIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 18l-6-6 6-6" />
  </Svg>
)

export const CloseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M18 6L6 18M6 6l12 12" />
  </Svg>
)
