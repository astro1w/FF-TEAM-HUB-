import { useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import { checkForUpdate, CURRENT_VERSION, type UpdateInfo } from '@/services/updateService'

const UPDATE_URL =
  'https://raw.githubusercontent.com/astro1w/FF-TEAM-HUB-/main/public/update/update.json'

export default function UpdateManager() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null)
  const [required, setRequired] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    checkForUpdate(UPDATE_URL)
      .then((result) => {
        if (result.available || result.required) {
          setUpdate(result.info)
          setRequired(result.required)
        }
      })
      .catch(() => {
        setError(true)
      })
  }, [])

  if (error || !update) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-5">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-base-900 p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15 text-3xl">
          🚀
        </div>

        <h2 className="text-xl font-bold text-white">
          Nova atualização
        </h2>

        <p className="mt-2 text-sm text-white/60">
          {update.message}
        </p>

        <div className="mt-4 rounded-2xl bg-white/5 p-3 text-xs text-white/50">
          <div>Versão atual: {CURRENT_VERSION}</div>
          <div>Nova versão: {update.latestVersion}</div>
        </div>

        <div className="mt-5">
          <Button
            className="w-full"
            onClick={() => {
              if (update.apkUrl) {
                window.open(update.apkUrl, '_system')
              }
            }}
            disabled={!update.apkUrl}
          >
            Atualizar agora
          </Button>
        </div>

        {!required && (
          <button
            type="button"
            onClick={() => setUpdate(null)}
            className="mt-3 text-xs text-white/40"
          >
            Atualizar depois
          </button>
        )}

        {required && (
          <p className="mt-3 text-[11px] text-accent-soft">
            Esta atualização é obrigatória.
          </p>
        )}
      </div>
    </div>
  )
}
