/**
 * Venue Partner Portal — pure helpers + demo analytics (Phase 3 Part B).
 *
 * The `bookings` RLS policy scopes SELECT to a user's own rows, so a venue owner
 * cannot read guests' bookings for their spot without a SECURITY DEFINER RPC
 * (out of scope for this phase). Until that exists, the dashboard KPIs, charts
 * and bookings table are populated from DETERMINISTIC demo data derived from the
 * venue id — stable per venue, realistic, and shaped exactly like the eventual
 * real payload so the swap is a one-liner later. The listing editor and venue
 * settings, by contrast, read/write the owner's OWN rows and are fully real.
 */

import type { SpotType } from '@/types'

// ── Tiers ──────────────────────────────────────────────────────

export type VenueTier = 'free' | 'premium' | 'featured'

export const TIER_LABEL: Record<VenueTier, string> = {
  free: 'Free',
  premium: 'Premium',
  featured: 'Featured',
}

/** Platform commission taken from each booking (STEP 9 / STEP 12). */
export const COMMISSION_PCT = 15

/** Derive the listing tier from the spot's premium/featured flags. */
export function venueTier(isPremium?: boolean | null, isFeatured?: boolean | null): VenueTier {
  if (isFeatured) return 'featured'
  if (isPremium) return 'premium'
  return 'free'
}

/** Net revenue after the platform commission. */
export function netRevenue(gross: number): number {
  return Math.round(gross * (1 - COMMISSION_PCT / 100))
}

// ── Deterministic RNG (stable demo data per venue) ─────────────

function hashSeed(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let s = seed
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Demo data shapes ───────────────────────────────────────────

export interface DayBookings {
  day: string
  bookings: number
}
export interface KpiSet {
  bookingsThisWeek: number
  revenueNetKes: number
  profileViews: number
  conversionRate: number
}
export type PaymentChannel = 'M-Pesa' | 'Card'
export type BookingChip = 'confirmed' | 'pending' | 'completed'
export interface UpcomingBooking {
  id: string
  guest: string
  date: string
  time: string
  slot: string
  payment: PaymentChannel
  status: BookingChip
}
export interface PeakHour {
  label: string
  count: number
}
export interface VisitorSegment {
  role: string
  pct: number
}
export interface ScorePoint {
  period: string
  score: number
}
export interface HoodRank {
  name: string
  score: number
  isCurrent: boolean
}
export type PayoutState = 'paid' | 'processing'
export interface PayoutRow {
  id: string
  date: string
  amount: number
  status: PayoutState
}
export interface PayoutSummary {
  availableKes: number
  totalEarnedKes: number
  thisMonthKes: number
  commissionPct: number
  history: PayoutRow[]
}
export interface PartnerData {
  kpis: KpiSet
  dailyBookings: DayBookings[]
  upcoming: UpcomingBooking[]
  pendingCount: number
  peakHours: PeakHour[]
  visitorProfile: VisitorSegment[]
  workScoreTrend: ScorePoint[]
  neighbourhoodRanking: HoodRank[]
  payouts: PayoutSummary
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const GUEST_NAMES = [
  'Amina W.', 'Brian O.', 'Cynthia M.', 'David K.', 'Esther N.', 'Felix A.',
  'Grace W.', 'Hassan I.', 'Irene C.', 'James M.', 'Kevin O.', 'Lydia A.',
]
const NEIGHBOURHOODS = [
  'Westlands', 'Kilimani', 'Karen', 'Lavington', 'Gigiri', 'Upperhill', 'CBD',
]

export interface BuildPartnerDataOpts {
  tier: VenueTier
  neighbourhood: string
  workScore: number
  /** Representative member slot price used to scale revenue. */
  avgSlotPrice?: number
}

/**
 * Build a stable, realistic demo dataset for a venue. Same seed → same numbers.
 * Featured/premium venues get proportionally more traffic than free ones.
 */
export function buildPartnerData(seed: string, opts: BuildPartnerDataOpts): PartnerData {
  const rng = mulberry32(hashSeed(seed))
  const int = (min: number, max: number) => Math.floor(min + rng() * (max - min + 1))

  const tierMult = opts.tier === 'featured' ? 1.8 : opts.tier === 'premium' ? 1.3 : 1
  const avgPrice = opts.avgSlotPrice ?? 450

  // Daily bookings Mon–Sun (weekends lighter).
  const dailyBookings: DayBookings[] = WEEKDAYS.map((day, i) => {
    const weekendDip = i >= 5 ? 0.55 : 1
    return { day, bookings: Math.max(0, Math.round(int(4, 14) * tierMult * weekendDip)) }
  })
  const bookingsThisWeek = dailyBookings.reduce((sum, d) => sum + d.bookings, 0)

  const grossThisWeek = bookingsThisWeek * avgPrice
  const kpis: KpiSet = {
    bookingsThisWeek,
    revenueNetKes: netRevenue(grossThisWeek),
    profileViews: Math.round(int(180, 620) * tierMult),
    conversionRate: Math.round((bookingsThisWeek / Math.max(1, int(120, 260) * tierMult)) * 1000) / 10,
  }

  // Upcoming bookings (next few days).
  const slotLabels = ['Morning · 8–12', 'Midday · 12–3', 'Afternoon · 3–6', 'Evening · 6–9']
  const times = ['08:00', '12:00', '15:00', '18:00']
  const today = new Date()
  const upcoming: UpcomingBooking[] = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(today.getTime() + int(0, 4) * 86400000)
    const slotIdx = int(0, slotLabels.length - 1)
    const statusRoll = rng()
    const status: BookingChip = statusRoll > 0.7 ? 'pending' : statusRoll > 0.15 ? 'confirmed' : 'completed'
    return {
      id: `demo-${seed.slice(0, 6)}-${i}`,
      guest: GUEST_NAMES[int(0, GUEST_NAMES.length - 1)],
      date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      time: times[slotIdx],
      slot: slotLabels[slotIdx],
      payment: rng() > 0.35 ? 'M-Pesa' : 'Card',
      status,
    }
  })
  const pendingCount = upcoming.filter((b) => b.status === 'pending').length

  // Peak hours (horizontal bars).
  const peakHours: PeakHour[] = [
    { label: '8–10am', count: int(20, 40) },
    { label: '10–12pm', count: Math.round(int(30, 55) * tierMult) },
    { label: '12–2pm', count: int(18, 34) },
    { label: '2–4pm', count: Math.round(int(28, 50) * tierMult) },
    { label: '4–6pm', count: int(22, 42) },
    { label: '6–9pm', count: int(10, 26) },
  ]

  // Visitor profile — fixed mix per STEP 11.
  const visitorProfile: VisitorSegment[] = [
    { role: 'Freelancer', pct: 52 },
    { role: 'Founder', pct: 24 },
    { role: 'Remote employee', pct: 16 },
    { role: 'Nomad', pct: 8 },
  ]

  // WorkScore trend (last 3 periods, converging to the real score).
  const base = opts.workScore || 8
  const workScoreTrend: ScorePoint[] = [
    { period: '2 mo ago', score: Math.max(1, Math.round((base - 0.6 + rng() * 0.2) * 10) / 10) },
    { period: 'Last mo', score: Math.max(1, Math.round((base - 0.3 + rng() * 0.2) * 10) / 10) },
    { period: 'Now', score: Math.round(base * 10) / 10 },
  ]

  // Neighbourhood ranking — current venue's hood highlighted.
  const hoods = new Set<string>([opts.neighbourhood, ...NEIGHBOURHOODS])
  const neighbourhoodRanking: HoodRank[] = [...hoods]
    .slice(0, 7)
    .map((name) => ({
      name,
      score:
        name === opts.neighbourhood
          ? Math.round(base * 10) / 10
          : Math.round((6.5 + rng() * 2.8) * 10) / 10,
      isCurrent: name === opts.neighbourhood,
    }))
    .sort((a, b) => b.score - a.score)

  // Payouts.
  const totalEarned = Math.round(int(120, 480) * tierMult) * 1000
  const thisMonth = Math.round(int(18, 60) * tierMult) * 1000
  const available = Math.round(thisMonth * (0.4 + rng() * 0.4))
  const history: PayoutRow[] = Array.from({ length: 4 }).map((_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - i - 1, 28)
    return {
      id: `payout-${seed.slice(0, 6)}-${i}`,
      date: d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
      amount: Math.round(int(15, 55) * tierMult) * 1000,
      status: i === 0 ? 'processing' : 'paid',
    }
  })
  const payouts: PayoutSummary = {
    availableKes: available,
    totalEarnedKes: totalEarned,
    thisMonthKes: thisMonth,
    commissionPct: COMMISSION_PCT,
    history,
  }

  return {
    kpis,
    dailyBookings,
    upcoming,
    pendingCount,
    peakHours,
    visitorProfile,
    workScoreTrend,
    neighbourhoodRanking,
    payouts,
  }
}

// ── Listing-editor option sets ─────────────────────────────────

export const SPOT_TYPE_OPTIONS: { value: SpotType; label: string }[] = [
  { value: 'cafe', label: 'Café' },
  { value: 'cowork', label: 'Coworking' },
  { value: 'hotel', label: 'Hotel lobby' },
  { value: 'garden', label: 'Garden / outdoor' },
]

/** Bookable time-slot chips offered in the listing editor (STEP 10). */
export const SLOT_CHOICES = ['7–10am', '8am–12pm', '12–3pm', '2–5pm', 'Evening']
