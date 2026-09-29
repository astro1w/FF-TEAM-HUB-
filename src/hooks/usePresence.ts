import { useEffect, useState } from 'react'
import { subscribePresence } from '@/services/presenceService'

/** Conjunto de ids de jogadores online neste momento. */
export function usePresence(userId?: string): Set<string> {
  const [online, setOnline] = useState<Set<string>>(new Set())
  useEffect(() => {
    if (!userId) return
    return subscribePresence(userId, (s) => setOnline(new Set(s)))
  }, [userId])
  return online
}
