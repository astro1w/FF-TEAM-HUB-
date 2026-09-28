export const MAX_INPUT_BYTES = 15 * 1024 * 1024

export interface CompressOptions {
  /** Lado maior máximo, em píxeis. */
  maxSide?: number
  /** Qualidade JPEG (0 a 1). */
  quality?: number
  /** Recorta ao centro num quadrado (avatares e logos). */
  square?: boolean
}

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'O ficheiro escolhido não é uma imagem.'
  if (file.size > MAX_INPUT_BYTES) return 'Imagem demasiado grande (máximo 15 MB).'
  return null
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    img.src = src
  })
}

/**
 * Redimensiona e comprime a imagem no próprio telemóvel antes do envio,
 * para poupar dados e ficar sempre abaixo dos limites do armazenamento.
 */
export async function compressImage(file: File, opts: CompressOptions = {}): Promise<Blob> {
  const { maxSide = 1280, quality = 0.82, square = false } = opts
  const problem = validateImageFile(file)
  if (problem) throw new Error(problem)

  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    let sx = 0
    let sy = 0
    let sw = img.width
    let sh = img.height

    if (square) {
      const side = Math.min(img.width, img.height)
      sx = Math.round((img.width - side) / 2)
      sy = Math.round((img.height - side) / 2)
      sw = side
      sh = side
    }

    const scale = Math.min(1, maxSide / Math.max(sw, sh))
    const w = Math.max(1, Math.round(sw * scale))
    const h = Math.max(1, Math.round(sh * scale))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('O teu telemóvel não suporta o processamento de imagens.')

    // Fundo escuro para PNGs com transparência
    ctx.fillStyle = '#0B0F14'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    )
    if (!blob) throw new Error('Não foi possível processar a imagem.')
    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}
