/**
 * Date helpers for streak logic and time-window queries (Phase 2 Part B).
 * We work in the browser's local calendar day — a "day" for streak purposes is
 * the user's local date, matching how check-ins feel to them.
 */

/** Local calendar date as an ISO 'YYYY-MM-DD' string (matches Postgres DATE). */
export function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayStr(now: Date = new Date()): string {
  return toDateStr(now)
}

export function yesterdayStr(now: Date = new Date()): string {
  return toDateStr(new Date(now.getTime() - 24 * 60 * 60 * 1000))
}

/** ISO date `days` days before now — for "active in the last N days" filters. */
export function daysAgoStr(days: number, now: Date = new Date()): string {
  return toDateStr(new Date(now.getTime() - days * 24 * 60 * 60 * 1000))
}
