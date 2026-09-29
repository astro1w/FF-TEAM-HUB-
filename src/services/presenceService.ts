import { supabase } from '@/lib/supabase'

// Presença online através do Realtime que a app já usa. Um único canal partilhado por toda a app.
// Nota: enquanto não existir a definição de privacidade "mostrar estado online", todos aparecem.
type Listener = (online: Set<string>) => void

let channel: ReturnType<typeof supabase.channel> | null = null
let online = new Set<string>()
const listeners = new Set<Listener>()
let selfVisible = true
let subscribed = false

export function subscribePresence(userId: string, listener: Listener): () => void {
  listeners.add(listener)
  listener(online)

  if (!channel) {
    const ch = supabase.channel('presence:online', { config: { presence: { key: userId } } })
    ch.on('presence', { event: 'sync' }, () => {
      online = new Set(Object.keys(ch.presenceState()))
      listeners.forEach((l) => l(online))
    }).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        subscribed = true
        if (selfVisible) await ch.track({ at: Date.now() })
      }
    })
    channel = ch
  }

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && channel) {
      supabase.removeChannel(channel)
      channel = null
      online = new Set()
      subscribed = false
    }
  }
}

/** Respeita Definições > Privacidade > "Mostrar estado online": deixa de aparecer para os outros. */
export async function setPresenceVisible(visible: boolean): Promise<void> {
  selfVisible = visible
  if (!channel || !subscribed) return
  if (visible) await channel.track({ at: Date.now() })
  else await channel.untrack()
}
