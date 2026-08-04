import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { venueTier, type VenueTier } from '@/lib/partner'
import type { NoiseLevel, SpotType } from '@/types'

/**
 * Venue Partner Portal data layer (Phase 3 Part B). Everything here is the
 * owner's OWN data — venue_settings + the linked spot — which RLS permits them
 * to read and write. Guest-facing booking analytics live in src/lib/partner.ts
 * (demo data) because cross-user reads are not allowed by the current policies.
 */

const DEFAULT_SLOTS = ['8am–12pm', '12–3pm', '2–5pm']

export interface PartnerVenue {
  settingsId: string
  spotId: string
  name: string
  neighbourhood: string
  type: SpotType
  tier: VenueTier
  workScore: number
  reviewCount: number
  coverGradient: string | null
  description: string
  mapsUrl: string
  priceEntry: string
  wifiMbps: number
  noiseLevel: NoiseLevel
  sockets: string
  workpassDiscountPct: number
  maxSeatsPerSlot: number
  slotDurationHours: number
  advanceBookingDays: number
  availableSlots: string[]
  payoutMpesaNumber: string | null
  totalEarnedKes: number
  pendingPayoutKes: number
}

interface VenueSettingsRow {
  id: string
  spot_id: string
  workpass_discount_pct: number | null
  max_seats_per_slot: number | null
  slot_duration_hours: number | null
  advance_booking_days: number | null
  available_slots: string[] | null
  payout_mpesa_number: string | null
  total_earned_kes: number | null
  pending_payout_kes: number | null
  created_at: string
  spot: {
    id: string
    name: string
    neighbourhood: string | null
    type: string
    work_score: number | string | null
    review_count: number | null
    cover_gradient: string | null
    description: string | null
    maps_url: string | null
    price_entry: string | null
    is_premium_listing: boolean | null
    is_featured_listing: boolean | null
    type_attributes: Record<string, unknown> | null
  } | null
}

const VENUE_SELECT =
  'id, spot_id, workpass_discount_pct, max_seats_per_slot, slot_duration_hours, advance_booking_days, available_slots, payout_mpesa_number, total_earned_kes, pending_payout_kes, created_at, spot:spots(id, name, neighbourhood, type, work_score, review_count, cover_gradient, description, maps_url, price_entry, is_premium_listing, is_featured_listing, type_attributes)'

function mapVenue(row: VenueSettingsRow): PartnerVenue | null {
  const spot = row.spot
  if (!spot) return null
  const attrs = spot.type_attributes ?? {}
  return {
    settingsId: row.id,
    spotId: row.spot_id,
    name: spot.name,
    neighbourhood: spot.neighbourhood ?? '',
    type: (spot.type as SpotType) ?? 'cafe',
    tier: venueTier(spot.is_premium_listing, spot.is_featured_listing),
    workScore: Number(spot.work_score ?? 0),
    reviewCount: spot.review_count ?? 0,
    coverGradient: spot.cover_gradient,
    description: spot.description ?? '',
    mapsUrl: spot.maps_url ?? '',
    priceEntry: spot.price_entry ?? '',
    wifiMbps: Number(attrs.wifi_mbps ?? 0),
    noiseLevel: (Number(attrs.noise_level ?? 1) as NoiseLevel) ?? 1,
    sockets: (attrs.sockets as string) ?? 'Moderate',
    workpassDiscountPct: row.workpass_discount_pct ?? 30,
    maxSeatsPerSlot: row.max_seats_per_slot ?? 30,
    slotDurationHours: row.slot_duration_hours ?? 4,
    advanceBookingDays: row.advance_booking_days ?? 7,
    availableSlots: row.available_slots ?? DEFAULT_SLOTS,
    payoutMpesaNumber: row.payout_mpesa_number,
    totalEarnedKes: row.total_earned_kes ?? 0,
    pendingPayoutKes: row.pending_payout_kes ?? 0,
  }
}

/** The venue owned by the signed-in user, or null if they have none yet. */
export function useMyVenue() {
  const { user } = useAuth()
  const userId = user?.id
  return useQuery<PartnerVenue | null>({
    queryKey: ['venue', 'mine', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_settings')
        .select(VENUE_SELECT)
        .eq('owner_user_id', userId!)
        .order('created_at', { ascending: true })
        .limit(1)
      if (error) throw error
      const rows = (data as unknown as VenueSettingsRow[]) ?? []
      return rows.length ? mapVenue(rows[0]) : null
    },
  })
}

// ── Create / update a listing (STEP 10) ────────────────────────

export interface VenueFormInput {
  /** Present when editing an existing spot; omit to create a new one. */
  spotId?: string | null
  name: string
  neighbourhood: string
  type: SpotType
  mapsUrl: string
  description: string
  wifiMbps: number
  priceEntry: string
  sockets: string
  noiseLevel: NoiseLevel
  workpassDiscountPct: number
  maxSeatsPerSlot: number
  slotDurationHours: number
  advanceBookingDays: number
  availableSlots: string[]
}

/** Insert-or-update the spot, then upsert its venue_settings (owned by me). */
export function useUpsertVenue() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation<string, Error, VenueFormInput>({
    mutationFn: async (input) => {
      if (!user) throw new Error('You need to be signed in.')

      const priceType = /free|^0|^ksh?\s*0/i.test(input.priceEntry.trim()) || !input.priceEntry.trim()
        ? 'free'
        : 'paid'

      const spotPayload = {
        name: input.name,
        neighbourhood: input.neighbourhood,
        type: input.type,
        maps_url: input.mapsUrl || null,
        description: input.description || null,
        price_entry: input.priceEntry || null,
        price_type: priceType,
        space_family: 'remote_work',
        score_label: 'WorkScore',
        type_attributes: {
          wifi_mbps: input.wifiMbps,
          noise_level: input.noiseLevel,
          sockets: input.sockets,
        },
      }

      let spotId = input.spotId ?? null
      if (spotId) {
        const { error } = await supabase.from('spots').update(spotPayload).eq('id', spotId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('spots')
          .insert(spotPayload)
          .select('id')
          .single()
        if (error) throw error
        spotId = (data as { id: string }).id
      }

      const { error: settingsError } = await supabase.from('venue_settings').upsert(
        {
          spot_id: spotId,
          owner_user_id: user.id,
          workpass_discount_pct: input.workpassDiscountPct,
          max_seats_per_slot: input.maxSeatsPerSlot,
          slot_duration_hours: input.slotDurationHours,
          advance_booking_days: input.advanceBookingDays,
          available_slots: input.availableSlots,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'spot_id' },
      )
      if (settingsError) throw settingsError

      return spotId
    },
    onSuccess: (spotId) => {
      queryClient.invalidateQueries({ queryKey: ['venue'] })
      queryClient.invalidateQueries({ queryKey: ['spots'] })
      queryClient.invalidateQueries({ queryKey: ['spot', spotId] })
    },
  })
}

// ── Payout M-Pesa number (Settings) ────────────────────────────

/** Update the owner's payout M-Pesa number on their venue_settings row. */
export function useUpdatePayoutNumber() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation<void, Error, { spotId: string; mpesaNumber: string }>({
    mutationFn: async ({ spotId, mpesaNumber }) => {
      if (!user) throw new Error('You need to be signed in.')
      const { error } = await supabase
        .from('venue_settings')
        .update({ payout_mpesa_number: mpesaNumber || null, updated_at: new Date().toISOString() })
        .eq('spot_id', spotId)
        .eq('owner_user_id', user.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue'] })
    },
  })
}
