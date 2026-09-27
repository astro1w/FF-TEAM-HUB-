import React from 'react'

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  action
}: {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  action?: React.ReactNode
}) {
  return (
    <div className="card text-center py-10">
      <p className="text-white font-semibold">{title}</p>
      {description && <p className="text-white/50 text-sm mt-1">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
      {!action && actionLabel && onAction && (
        <button onClick={onAction} className="btn-secondary mt-4">
          {actionLabel}
        </button>
      )}
    </div>
  )
}
