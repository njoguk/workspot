import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { SCORE_LABEL } from '@/config/platform'
import type {
  NoiseLevel,
  PriceType,
  SocketAvailability,
  SpaceFamily,
  Spot,
  SpotType,
} from '@/types'

/**
 * Data layer for spots (Phase 2 STEP 2). Replaces the src/data/spots.ts mock
 * array with live Supabase queries via React Query. WiFi / noise / sockets are
 * read back out of the `type_attributes` JSONB column.
 */

/** Raw `spots` table row shape (snake_case, docs/SCHEMA.md). */
interface SpotRow {
  id: string
  name: string
  neighbourhood: string | null
  type: string
  space_family: string | null
  score_label: string | null
  description: string | null
  cover_gradient: string | null
  type_attributes: Record<string, unknown> | null
  vibe_tags: string[] | null
  best_times: string[] | null
  work_score: number | string | null
  review_count: number | null
  price_entry: string | null
  price_type: string | null
  is_premium_listing: boolean | null
}

const FALLBACK_GRADIENT =
  'linear-gradient(135deg, var(--color-dark-alt) 0%, var(--color-dark) 100%)'

/** Map a raw DB row → the camelCase frontend Spot model. */
function mapRow(row: SpotRow): Spot {
  const attrs = (row.type_attributes ?? {}) as Record<string, unknown>
  return {
    id: row.id,
    name: row.name,
    neighbourhood: row.neighbourhood ?? '',
    type: (row.type as SpotType) ?? 'cafe',
    spaceFamily: (row.space_family as SpaceFamily) ?? 'remote_work',
    scoreLabel: row.score_label ?? SCORE_LABEL,
    workScore: Number(row.work_score ?? 0),
    wifiMbps: Number(attrs.wifi_mbps ?? 0),
    noiseLevel: (Number(attrs.noise_level ?? 1) as NoiseLevel) ?? 1,
    priceEntry: row.price_entry ?? '',
    priceType: (row.price_type as PriceType) ?? 'free',
    sockets: (attrs.sockets as SocketAvailability) ?? 'Moderate',
    vibeTags: row.vibe_tags ?? [],
    bestTimes: row.best_times ?? [],
    description: row.description ?? '',
    coverGradient: row.cover_gradient ?? FALLBACK_GRADIENT,
    typeAttributes: attrs,
    isPremiumListing: row.is_premium_listing ?? undefined,
  }
}

const SPOT_COLUMNS =
  'id, name, neighbourhood, type, space_family, score_label, description, cover_gradient, type_attributes, vibe_tags, best_times, work_score, review_count, price_entry, price_type, is_premium_listing'

/** All spots, highest WorkScore first. */
export function useSpots() {
  return useQuery<Spot[]>({
    queryKey: ['spots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spots')
        .select(SPOT_COLUMNS)
        .order('work_score', { ascending: false })
      if (error) throw error
      return (data as SpotRow[]).map(mapRow)
    },
  })
}

/** A single spot by id. Returns null when no row matches. */
export function useSpot(id: string | undefined) {
  return useQuery<Spot | null>({
    queryKey: ['spot', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spots')
        .select(SPOT_COLUMNS)
        .eq('id', id!)
        .maybeSingle()
      if (error) throw error
      return data ? mapRow(data as SpotRow) : null
    },
  })
}

/** Top 2 spots by WorkScore — the Explore "Editor's Picks" row. */
export function useFeaturedSpots() {
  return useQuery<Spot[]>({
    queryKey: ['spots', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spots')
        .select(SPOT_COLUMNS)
        .order('work_score', { ascending: false })
        .limit(2)
      if (error) throw error
      return (data as SpotRow[]).map(mapRow)
    },
  })
}
