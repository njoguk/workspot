-- ============================================================================
-- RemoSpot — Spot cover images (feedback round, Phase 3)
--
-- Run this whole file in the Supabase SQL editor. It creates a public Storage
-- bucket for spot cover photos + owner-scoped write policies, and adds lat/lng
-- columns to spots for the upcoming (Phase 4) map location picker.
--
-- `spots.cover_image_url` already exists in docs/SCHEMA.md — no column needed.
-- ============================================================================

-- ── Storage bucket ──────────────────────────────────────────────────────────
-- Public bucket: objects are readable by anyone via their public URL.
INSERT INTO storage.buckets (id, name, public)
VALUES ('spot-images', 'spot-images', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

-- ── Storage RLS (on storage.objects) ────────────────────────────────────────
-- Public read; authenticated users may upload/update/delete only within their
-- own top-level folder (the first path segment must equal their uid).
DROP POLICY IF EXISTS "spot-images public read" ON storage.objects;
CREATE POLICY "spot-images public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'spot-images');

DROP POLICY IF EXISTS "spot-images owner insert" ON storage.objects;
CREATE POLICY "spot-images owner insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'spot-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "spot-images owner update" ON storage.objects;
CREATE POLICY "spot-images owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'spot-images' AND owner = auth.uid());

DROP POLICY IF EXISTS "spot-images owner delete" ON storage.objects;
CREATE POLICY "spot-images owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'spot-images' AND owner = auth.uid());

-- ── Coordinates for the map location picker (Phase 4) ───────────────────────
ALTER TABLE spots ADD COLUMN IF NOT EXISTS latitude  NUMERIC(9,6);
ALTER TABLE spots ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6);
