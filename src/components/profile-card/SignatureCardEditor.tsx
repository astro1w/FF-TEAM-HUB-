
import type { ProfileCardSettings } from '@/types/profileCard'

type Props = {
  settings: ProfileCardSettings
  onChange: (updates: Partial<ProfileCardSettings>) => void
}

const themes: ProfileCardSettings['theme'][] = [
  'default',
  'neon',
  'fire',
  'ice',
  'royal',
  'shadow'
]

const frames: ProfileCardSettings['frame'][] = [
  'none',
  'basic',
  'elite',
  'legendary'
]

const effects: ProfileCardSettings['effect'][] = [
  'none',
  'glow',
  'particles',
  'energy'
]

const patterns: ProfileCardSettings['pattern'][] = [
  'none',
  'grid',
  'lines',
  'hex',
  'carbon'
]

const verificationStyles = [
  { id: 'classic', label: 'Classic', symbol: '✓' },
  { id: 'elite', label: 'Elite', symbol: '✦' },
  { id: 'pro', label: 'Pro', symbol: '⚡' },
  { id: 'legend', label: 'Legend', symbol: '◆' }
]

export default function SignatureCardEditor({ settings, onChange }: Props) {
  const verificationStyle =
    (settings as ProfileCardSettings & { verificationStyle?: string }).verificationStyle || 'classic'

  function update(updates: Partial<ProfileCardSettings>) {
    onChange(updates)
  }

  function setVerificationStyle(value: 'classic' | 'elite' | 'pro' | 'legend') {
    onChange({ verificationStyle: value })
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="text-sm font-bold">Personalizar Signature Card</h3>
        <p className="text-xs text-white/40 mt-1">
          As alterações aparecem na tua card e podem ser guardadas pelo app.
        </p>
      </div>

      <div className="card">
        <p className="text-xs font-semibold text-white/40 tracking-widest mb-3">TEMA</p>
        <div className="grid grid-cols-3 gap-2">
          {themes.map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => update({ theme })}
              className={`rounded-xl px-3 py-3 text-xs font-semibold border ${
                settings.theme === theme
                  ? 'border-accent bg-accent/15 text-accent-soft'
                  : 'border-white/10 bg-white/5 text-white/60'
              }`}
            >
              {theme}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <p className="text-xs font-semibold text-white/40 tracking-widest mb-3">MOLDURA</p>
        <div className="grid grid-cols-2 gap-2">
          {frames.map((frame) => (
            <button
              key={frame}
              type="button"
              onClick={() => update({ frame })}
              className={`rounded-xl px-3 py-3 text-xs font-semibold border ${
                settings.frame === frame
                  ? 'border-accent bg-accent/15 text-accent-soft'
                  : 'border-white/10 bg-white/5 text-white/60'
              }`}
            >
              {frame}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <p className="text-xs font-semibold text-white/40 tracking-widest mb-3">EFEITO</p>
        <div className="grid grid-cols-2 gap-2">
          {effects.map((effect) => (
            <button
              key={effect}
              type="button"
              onClick={() => update({ effect })}
              className={`rounded-xl px-3 py-3 text-xs font-semibold border ${
                settings.effect === effect
                  ? 'border-accent bg-accent/15 text-accent-soft'
                  : 'border-white/10 bg-white/5 text-white/60'
              }`}
            >
              {effect}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <p className="text-xs font-semibold text-white/40 tracking-widest mb-3">PADRÃO</p>
        <div className="grid grid-cols-3 gap-2">
          {patterns.map((pattern) => (
            <button
              key={pattern}
              type="button"
              onClick={() => update({ pattern })}
              className={`rounded-xl px-3 py-3 text-xs font-semibold border ${
                settings.pattern === pattern
                  ? 'border-accent bg-accent/15 text-accent-soft'
                  : 'border-white/10 bg-white/5 text-white/60'
              }`}
            >
              {pattern}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <p className="text-xs font-semibold text-white/40 tracking-widest mb-3">
          SELO DE VERIFICAÇÃO
        </p>

        <div className="grid grid-cols-2 gap-2">
          {verificationStyles.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setVerificationStyle(item.id as 'classic' | 'elite' | 'pro' | 'legend')}
              className={`rounded-xl px-3 py-3 text-xs font-semibold border ${
                verificationStyle === item.id
                  ? 'border-accent bg-accent/15 text-accent-soft'
                  : 'border-white/10 bg-white/5 text-white/60'
              }`}
            >
              <span className="mr-2">{item.symbol}</span>
              {item.label}
            </button>
          ))}
        </div>

        <p className="text-[10px] text-white/30 mt-3">
          O selo só aparece como verificação oficial quando o jogador estiver realmente verificado.
        </p>
      </div>
    </div>
  )
}
