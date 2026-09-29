import React from 'react'

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}

/** Interruptor on/off acessível; o pai controla o estado e a persistência (ver Settings.tsx). */
export default function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <label className="flex items-center justify-between gap-3 py-3">
      <span className="min-w-0">
        <span className="block text-[15px]">{label}</span>
        {description && <span className="block text-xs text-white/40 mt-0.5">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`shrink-0 w-12 h-7 rounded-full transition-colors relative disabled:opacity-40 ${
          checked ? 'bg-accent' : 'bg-base-600'
        }`}
      >
        <span
          className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  )
}
