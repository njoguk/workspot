/**
 * Seed the Supabase `spots` table from the Phase-1 mock data.
 *
 * Takes the SPOTS array (src/data/spots.ts) and inserts one row per spot into
 * the `spots` table defined in docs/SCHEMA.md. WiFi / noise / sockets are
 * stored inside the `type_attributes` JSONB column; space_family and
 * score_label are forced to their remote-work defaults.
 *
 * Run it:
 *   npx tsx src/scripts/seedSpots.ts
 *
 * (The original brief suggested `npx ts-node --esm`; tsx is used here because
 * it resolves the project's `@/*` path aliases and TS/ESM out of the box.
 * ts-node also works if you have tsconfig-paths configured.)
 *
 * Environment: reads VITE_SUPABASE_URL + a Supabase key from .env.local.
 *   - Prefers SUPABASE_SERVICE_ROLE_KEY if present (bypasses RLS — the clean
 *     way to seed).
 *   - Falls back to VITE_SUPABASE_ANON_KEY. NOTE: with the anon key the
 *     `spots` INSERT RLS policy requires an authenticated user, so a bare
 *     anon seed will be rejected. Either add SUPABASE_SERVICE_ROLE_KEY to
 *     .env.local or run this insert from the Supabase SQL editor instead.
 *
 * Flags:
 *   --reset   Delete all existing spots first, then insert (destructive).
 */

import { createClient } from '@supabase/supabase-js'
import { SPOTS } from '@/data/spots'
import type { Spot } from '@/types'

// ── Load env (.env.local) ──────────────────────────────────────
// process.loadEnvFile is available on Node 20.6+ (this repo targets Node 24).
// If it fails, env may already be present via `node --env-file=...`.
try {
  process.loadEnvFile('.env.local')
} catch {
  /* env already loaded, or file missing — validated below */
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const KEY = SERVICE_KEY ?? ANON_KEY

if (!SUPABASE_URL || !KEY) {
  console.error(
    '✗ Missing Supabase credentials. Set VITE_SUPABASE_URL and ' +
      'SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY) in .env.local.',
  )
  process.exit(1)
}

if (!SERVICE_KEY) {
  console.warn(
    '⚠ Using the anon key. The spots INSERT RLS policy requires an ' +
      'authenticated user, so this may be rejected. Add ' +
      'SUPABASE_SERVICE_ROLE_KEY to .env.local for a clean seed.',
  )
}

const supabase = createClient(SUPABASE_URL, KEY, {
  auth: { persistSession: false },
})

/** DB row shape for an INSERT into `spots` (docs/SCHEMA.md). */
interface SpotInsert {
  name: string
  neighbourhood: string
  type: Spot['type']
  space_family: 'remote_work'
  score_label: 'WorkScore'
  description: string
  cover_gradient: string
  type_attributes: Record<string, unknown>
  vibe_tags: string[]
  best_times: string[]
  work_score: number
  review_count: number
  price_entry: string
  price_type: Spot['priceType']
}

/**
 * Map the frontend Spot model → a spots-table insert row.
 * `id` is intentionally omitted so Postgres generates a UUID (the mock ids
 * '1'..'12' are not valid UUIDs).
 */
function toInsertRow(spot: Spot): SpotInsert {
  return {
    name: spot.name,
    neighbourhood: spot.neighbourhood,
    type: spot.type,
    space_family: 'remote_work',
    score_label: 'WorkScore',
    description: spot.description,
    cover_gradient: spot.coverGradient,
    type_attributes: {
      wifi_mbps: spot.wifiMbps,
      noise_level: spot.noiseLevel,
      sockets: spot.sockets,
    },
    vibe_tags: spot.vibeTags,
    best_times: spot.bestTimes,
    work_score: spot.workScore,
    review_count: 0,
    price_entry: spot.priceEntry,
    price_type: spot.priceType,
  }
}

async function main() {
  const reset = process.argv.includes('--reset')

  const { count, error: countError } = await supabase
    .from('spots')
    .select('id', { count: 'exact', head: true })

  if (countError) {
    console.error(`✗ Could not read spots table: ${countError.message}`)
    console.error('  Have you run the schema migration from docs/SCHEMA.md?')
    process.exit(1)
  }

  if ((count ?? 0) > 0) {
    if (reset) {
      console.log(`↺ --reset: deleting ${count} existing spots…`)
      const { error: delError } = await supabase
        .from('spots')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
      if (delError) {
        console.error(`✗ Delete failed: ${delError.message}`)
        process.exit(1)
      }
    } else {
      console.log(
        `✓ spots table already has ${count} rows — nothing to do. ` +
          'Re-run with --reset to wipe and reseed.',
      )
      process.exit(0)
    }
  }

  const rows = SPOTS.map(toInsertRow)
  console.log(`→ Inserting ${rows.length} spots…`)

  const { data, error } = await supabase.from('spots').insert(rows).select('id, name')

  if (error) {
    console.error(`✗ Insert failed: ${error.message}`)
    if (/row-level security|violates|policy/i.test(error.message)) {
      console.error(
        '  This is the RLS policy blocking the anon key. Use ' +
          'SUPABASE_SERVICE_ROLE_KEY, or paste the rows via the SQL editor.',
      )
    }
    process.exit(1)
  }

  console.log(`✓ Seeded ${data?.length ?? 0} spots:`)
  for (const row of data ?? []) {
    console.log(`  · ${row.name}  (${row.id})`)
  }
  process.exit(0)
}

main().catch((err) => {
  console.error('✗ Unexpected error:', err)
  process.exit(1)
})
