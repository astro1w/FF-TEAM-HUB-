import React, { useCallback, useRef, useState } from 'react'

/** Aviso curto no fundo do ecrã (substitui o alert(), que é feio e bloqueia). */
export function useToast() {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const show = useCallback((text: string) => {
    setMessage(text)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setMessage(null), 2400)
  }, [])

  const toast = message ? (
    <div
      role="status"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-base-600 text-white text-sm px-4 py-2 rounded-full shadow-lg max-w-[90%] text-center"
    >
      {message}
    </div>
  ) : null

  return { toast, show }
}
