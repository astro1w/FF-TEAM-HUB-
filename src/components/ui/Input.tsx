import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, id, className = '', ...rest }: InputProps) {
  const inputId = id ?? rest.name
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={inputId} className="label-text">
          {label}
        </label>
      )}
      <input id={inputId} className={`input-field ${className}`} {...rest} />
      {error && <p className="text-accent-soft text-sm mt-1">{error}</p>}
    </div>
  )
}
