/**
 * Core domain types.
 *
 * `Spot` is the curated frontend model (camelCase) defined in
 * docs/WORKSPOT.md. The remaining types map to Supabase table rows defined
 * in docs/SCHEMA.md and therefore use snake_case column names.
 */

// ── Shared unions ──────────────────────────────────────────────

/** Enables the future CreativeSpot sister platform without a migration. */
export type SpaceFamily = 'remote_work' | 'creative'

/** Quality-score label. Defaults to CONFIG.md SCORE_LABEL ('WorkScore'). */
export type ScoreLabel = 'WorkScore' | 'SpaceScore'

export type SpotType = 'cafe' | 'cowork' | 'hotel' | 'garden'

/** 1 = Quiet · 2 = Moderate · 3 = Loud */
export type NoiseLevel = 1 | 2 | 3

export type PriceType = 'free' | 'paid'

export type SocketAvailability =
  | 'Excellent'
  | 'Abundant'
  | 'Good'
  | 'Moderate'
  | 'Scarce'

// ── Spot (frontend model — docs/WORKSPOT.md) ───────────────────

export interface Spot {
  id: string
  name: string
  neighbourhood: string
  type: SpotType
  spaceFamily: SpaceFamily
  scoreLabel: string // from CONFIG.md SCORE_LABEL
  workScore: number // 0–10, one decimal
  wifiMbps: number
  noiseLevel: NoiseLevel
  priceEntry: string
  priceType: PriceType
  sockets: SocketAvailability
  vibeTags: string[]
  bestTimes: string[]
  description: string
  coverGradient: string
  coverImageUrl?: string | null
  typeAttributes: Record<string, unknown>
  isNew?: boolean
  isPremiumListing?: boolean
  isFeaturedListing?: boolean
}

// ── Database row types (docs/SCHEMA.md) ────────────────────────

export type ProfileRole = 'freelancer' | 'remote_employee' | 'founder' | 'nomad'

export interface Profile {
  id: string
  display_name: string | null
  handle: string | null
  avatar_url: string | null
  role: ProfileRole | null
  interests: string[]
  neighbourhoods: string[]
  workscore_contributions: number
  check_in_streak: number
  longest_streak: number
  last_checkin_date: string | null
  is_workpass: boolean
  workpass_expires_at: string | null
  created_at: string
}

export interface Checkin {
  id: string
  user_id: string
  spot_id: string
  checked_in_at: string
  checked_out_at: string | null
  wifi_speed_tested: number | null
  noise_reported: NoiseLevel | null
  session_note: string | null
}

export interface Review {
  id: string
  user_id: string
  spot_id: string
  space_type: string
  ratings: Record<string, number>
  overall_score: number | null
  primary_metric_value: number | null
  comment: string | null
  quick_tags: string[]
  created_at: string
}

export interface Event {
  id: string
  title: string
  description: string | null
  spot_id: string | null
  event_date: string
  start_time: string
  end_time: string | null
  max_attendees: number | null
  is_free: boolean
  created_at: string
}

export interface RSVP {
  id: string
  user_id: string
  event_id: string
  created_at: string
}

export type PaymentMethod = 'paystack' | 'workpass_credit'

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'payment_failed'
  | 'cancelled'
  | 'completed'

export interface Booking {
  id: string
  user_id: string
  spot_id: string
  slot_date: string
  slot_start: string
  slot_end: string
  price_paid: number
  standard_price: number | null
  workpass_discount: number
  payment_method: PaymentMethod | null
  paystack_reference: string | null
  paystack_access_code: string | null
  status: BookingStatus
  booking_code: string | null
  created_at: string
}
