/**
 * Slot-booking domain constants + pure helpers (Phase 3 monetisation).
 *
 * Slot definitions, pricing, occupancy classification and small formatters
 * live here so the booking pages, confirmation page and My Bookings page all
 * agree on the same numbers. No React, no Supabase — pure functions only.
 */

import { formatTime } from '@/lib/time'

// ── Slots ──────────────────────────────────────────────────────

export interface SlotDef {
  /** Stable key used in UI lists. */
  key: string
  label: string
  /** Postgres TIME strings ('HH:MM:SS') stored on the booking row. */
  start: string
  end: string
  /** Standard (non-member) price in KES. */
  standard: number
}

/**
 * The four bookable day slots. Standard prices per docs/BUILD_PLAN.md STEP 5
 * (Morning 700, Midday 600, Afternoon 500) with an added Evening slot at the
 * afternoon rate so every spot exposes four windows.
 */
export const SLOTS: SlotDef[] = [
  { key: 'morning', label: 'Morning', start: '08:00:00', end: '12:00:00', standard: 700 },
  { key: 'midday', label: 'Midday', start: '12:00:00', end: '15:00:00', standard: 600 },
  { key: 'afternoon', label: 'Afternoon', start: '15:00:00', end: '18:00:00', standard: 500 },
  { key: 'evening', label: 'Evening', start: '18:00:00', end: '21:00:00', standard: 500 },
]

/** Default seats per slot when a spot has no readable venue_settings row. */
export const DEFAULT_MAX_SEATS = 30

/** Default WorkPass discount when a spot has no readable venue_settings row. */
export const DEFAULT_DISCOUNT_PCT = 30

/** Look a slot up by its `slot_start` TIME (as stored on a booking row). */
export function slotByStart(start: string | null | undefined): SlotDef | undefined {
  if (!start) return undefined
  return SLOTS.find((s) => s.start === start)
}

// ── Pricing ────────────────────────────────────────────────────

/** WorkPass saving in KES for a standard price at a given discount %. */
export function workpassDiscount(standard: number, pct: number): number {
  return Math.round((standard * pct) / 100)
}

/** Member price in KES after applying the WorkPass discount. */
export function workpassPrice(standard: number, pct: number): number {
  return standard - workpassDiscount(standard, pct)
}

/** "KES 1,200" — grouped thousands, no decimals. */
export function formatKES(amount: number): string {
  return `KES ${Math.round(amount).toLocaleString('en-KE')}`
}

// ── Occupancy ──────────────────────────────────────────────────

export type SlotAvailability = 'open' | 'filling' | 'full'

/** Classify a slot's fill level for the colour-coded availability bar. */
export function slotAvailability(booked: number, max: number): SlotAvailability {
  if (max <= 0) return 'open'
  if (booked >= max) return 'full'
  if (booked / max >= 0.6) return 'filling'
  return 'open'
}

/** Fraction filled, clamped 0–1, for the availability bar width. */
export function occupancyRatio(booked: number, max: number): number {
  if (max <= 0) return 0
  return Math.min(1, Math.max(0, booked / max))
}

// ── Time / duration ────────────────────────────────────────────

/** "8:00 AM – 12:00 PM" for a slot's start/end TIME strings. */
export function slotRangeLabel(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`
}

function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m)
}

/** Whole-hour duration between two TIME strings, e.g. 4. */
export function slotDurationHours(start: string, end: string): number {
  return Math.round((minutesOf(end) - minutesOf(start)) / 60)
}

/** Human duration label, e.g. "4 hours" / "1 hour". */
export function slotDurationLabel(start: string, end: string): string {
  const h = slotDurationHours(start, end)
  return `${h} hour${h === 1 ? '' : 's'}`
}

// ── Calendar export (.ics) ─────────────────────────────────────

/** Pack a local date + TIME into an iCalendar floating datetime. */
function icsStamp(dateStr: string, time: string): string {
  const d = dateStr.replace(/-/g, '')
  const t = time.replace(/:/g, '').padEnd(6, '0').slice(0, 6)
  return `${d}T${t}`
}

/**
 * Build a minimal single-event .ics document string for a booking, suitable
 * for a client-side download / "Add to Calendar" action.
 */
export function bookingICS(params: {
  title: string
  location: string
  description: string
  dateStr: string
  start: string
  end: string
  uid: string
}): string {
  const { title, location, description, dateStr, start, end, uid } = params
  const esc = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RemoSpot//WorkPass//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${icsStamp(dateStr, start)}`,
    `DTEND:${icsStamp(dateStr, end)}`,
    `SUMMARY:${esc(title)}`,
    `LOCATION:${esc(location)}`,
    `DESCRIPTION:${esc(description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
