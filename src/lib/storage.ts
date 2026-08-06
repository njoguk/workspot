import { supabase } from '@/lib/supabase'

/**
 * Supabase Storage helpers for spot cover photos (feedback round, Phase 3).
 * Files live in the public `spot-images` bucket, namespaced by uploader id so
 * the owner-folder RLS policy applies (see docs/storage-migration.sql). Cover
 * photo only for now — a multi-image gallery is a later phase.
 */

const BUCKET = 'spot-images'
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/** Upload a cover image and return its public URL. */
export async function uploadSpotImage(file: File, spotId: string | null): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Please upload a JPG, PNG, or WebP image.')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Image must be 5 MB or smaller.')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sign in to upload images.')

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  // First path segment must be the uploader's id for the owner-folder RLS policy.
  const path = `${user.id}/${spotId ?? 'new'}-${Date.now()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: true,
  })
  if (error) {
    if (/bucket.*not.*found|not found/i.test(error.message)) {
      throw new Error('Image storage isn’t set up yet. Run the storage migration in Supabase.')
    }
    throw error
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/** Best-effort delete of a previously uploaded cover image, given its public URL. */
export async function deleteSpotImage(publicUrl: string): Promise<void> {
  const marker = `/${BUCKET}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return
  const path = publicUrl.slice(idx + marker.length)
  await supabase.storage.from(BUCKET).remove([path])
}
