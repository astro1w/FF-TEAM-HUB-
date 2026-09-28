import React, { useState } from 'react'
import { REPORT_REASONS, type ReportReason } from '@/services/reportService'

interface ReportSheetProps {
  open: boolean
  title?: string
  onClose: () => void
  onSubmit: (reason: ReportReason) => Promise<void>
}

/** Folha inferior para escolher o motivo de uma denúncia. */
export default function ReportSheet({ open, title = 'Denunciar', onClose, onSubmit }: ReportSheetProps) {
  const [busy, setBusy] = useState(false)
  if (!open) return null

  async function pick(reason: ReportReason) {
    setBusy(true)
    try {
      await onSubmit(reason)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full bg-base-800 rounded-t-3xl border-t border-base-600 px-4 pt-4 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-base-500 mx-auto mb-4" />
        <h2 className="font-semibold mb-1">{title}</h2>
        <p className="text-xs text-white/50 mb-3">Porque estás a denunciar? A equipa de moderação vai analisar.</p>
        <div className="space-y-2">
          {REPORT_REASONS.map((r) => (
            <button
              key={r.value}
              type="button"
              disabled={busy}
              onClick={() => pick(r.value)}
              className="w-full text-left bg-base-700 rounded-xl2 px-4 py-3 text-sm disabled:opacity-50"
            >
              {r.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} className="w-full mt-3 py-3 text-sm text-white/60">
          Cancelar
        </button>
      </div>
    </div>
  )
}
