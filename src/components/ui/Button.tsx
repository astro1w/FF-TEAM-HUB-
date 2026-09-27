import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  loading?: boolean
}

export default function Button({ variant = 'primary', loading, children, className = '', disabled, ...rest }: ButtonProps) {
  const base = variant === 'primary' ? 'btn-primary' : 'btn-secondary'
  return (
    <button className={`${base} ${className}`} disabled={disabled || loading} {...rest}>
      {loading ? 'A processar...' : children}
    </button>
  )
}
