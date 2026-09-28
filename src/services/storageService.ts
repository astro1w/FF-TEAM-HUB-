import { supabase } from '@/lib/supabase'
import { compressImage, type CompressOptions } from '@/lib/imageUtils'

export type ImageBucket = 'avatars' | 'team-logos' | 'post-media' | 'tournament-banners'

/**
 * Comprime e envia uma imagem para o Supabase Storage.
 * `folder` tem de coincidir com o que as políticas do bucket exigem:
 *  - avatars, post-media, tournament-banners → id do utilizador
 *  - team-logos → id da Team (só o capitão pode enviar)
 * Devolve o URL público da imagem.
 */
export async function uploadImage(
  bucket: ImageBucket,
  folder: string,
  file: File,
  opts?: CompressOptions
): Promise<string> {
  const blob = await compressImage(file, opts)
  // Nome único por envio: evita problemas de cache e não precisa de permissão de substituição.
  const path = `${folder}/${Date.now()}.jpg`

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: 'image/jpeg',
    cacheControl: '31536000'
  })
  if (error) throw error

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

export const IMAGE_PRESETS = {
  avatar: { maxSide: 512, quality: 0.85, square: true },
  logo: { maxSide: 512, quality: 0.85, square: true },
  post: { maxSide: 1280, quality: 0.82 },
  banner: { maxSide: 1280, quality: 0.82 }
} satisfies Record<string, CompressOptions>
