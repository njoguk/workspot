# Supabase Storage — Spot Cover Images

Cover photos for spots live in a public Supabase Storage bucket named
`spot-images`. This is the first use of Storage in the project.

## One-time setup

Run **`docs/storage-migration.sql`** in the Supabase SQL editor. It:

1. Creates the public `spot-images` bucket (objects readable via their public URL).
2. Adds RLS on `storage.objects` so any authenticated user can upload/update/delete
   only within their own top-level folder (first path segment = their `auth.uid()`),
   while reads are public.
3. Adds `latitude` / `longitude` columns to `spots` for the Phase 4 map picker.

No column is added for the image URL itself — `spots.cover_image_url` already
exists in `docs/SCHEMA.md`; Phase 3 simply starts populating and reading it.

## How the app uses it

- Upload utility: `src/lib/storage.ts` — `uploadSpotImage(file, spotId)` validates
  type (JPG/PNG/WebP) and size (≤ 5 MB), uploads to `${uid}/${spotId}-${ts}.ext`,
  and returns the public URL. `deleteSpotImage(url)` removes it.
- Write: the Partner listing editor (`VenueListingEditor`) uploads a cover photo and
  saves the URL via `useUpsertVenue` → `spots.cover_image_url`.
- Read: `useSpots` maps `cover_image_url → coverImageUrl`; `SpotCard`,
  `SpotCardFeatured`, and the spot-detail hero render the image when present and fall
  back to the CSS `coverGradient` otherwise.

## Deferred

Multi-image galleries, reordering, and explicit thumbnail selection are a later
phase; this round is a single cover photo per spot.
