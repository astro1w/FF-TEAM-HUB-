import React from 'react'

export default function LoadingState({ message = 'A carregar...', fullScreen = false }: { message?: string; fullScreen?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 text-white/60 ${fullScreen ? 'h-screen' : 'py-12'}`}>
      <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-accent animate-spin" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
