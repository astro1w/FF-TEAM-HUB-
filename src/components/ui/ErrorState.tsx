import React from 'react'

export default function ErrorState({ message = 'Algo correu mal.', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="card text-center py-10 border-accent/40">
      <p className="text-accent-soft font-semibold">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-4">
          Tentar novamente
        </button>
      )}
    </div>
  )
}
