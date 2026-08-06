/**
 * Badge definitions, extracted so both the full Profile badge grid and the
 * compact inline `BadgeTag` (community feed, people cards, reviews) share one
 * source of truth. Nothing is persisted — badges are derived from aggregate
 * counts. A persisted `user_badges` table is the scale path if this gets heavy.
 */

export interface BadgeInput {
  gardenCheckins: number
  wifiTests: number
  eventsAttended: number
  distinctHoods: number
  reviewCount: number
  longestStreak: number
}

export interface Badge {
  id: string
  emoji: string
  label: string
  earned: boolean
}

/** The full badge set shown on the profile (earned + not-yet-earned). */
export function deriveBadges(input: BadgeInput): Badge[] {
  return [
    { id: 'garden-lover', emoji: '🌿', label: 'Garden Lover', earned: input.gardenCheckins >= 5 },
    { id: 'wifi-tester', emoji: '⚡', label: 'WiFi Tester', earned: input.wifiTests >= 5 },
    { id: 'streak-7', emoji: '🔥', label: '7 Day Streak', earned: input.longestStreak >= 7 },
    { id: 'streak-14', emoji: '🔥', label: '14 Day Streak', earned: input.longestStreak >= 14 },
    { id: 'workcation-pro', emoji: '🎉', label: 'Workcation Pro', earned: input.eventsAttended >= 1 },
    { id: 'all-hoods', emoji: '🗺', label: 'All Hoods', earned: input.distinctHoods >= 7 },
    { id: 'top-reviewer', emoji: '🏆', label: 'Top Reviewer', earned: input.reviewCount >= 10 },
  ]
}

// ── Signature badges (compact, inline next to a name) ──────────────────────

export type SignatureBadgeId = 'workcation-pro' | 'top-reviewer' | 'streak-star'

export interface SignatureBadge {
  id: SignatureBadgeId
  emoji: string
  label: string
}

export interface SignatureBadgeInput {
  reviewCount: number
  eventsAttended: number
  longestStreak: number
}

/**
 * The small set of "signature" badges cheap enough to compute for many users at
 * once. Returned in priority order (first = most prominent for the context).
 */
export function signatureBadges(input: SignatureBadgeInput): SignatureBadge[] {
  const out: SignatureBadge[] = []
  if (input.eventsAttended >= 1)
    out.push({ id: 'workcation-pro', emoji: '🎉', label: 'Workcation Pro' })
  if (input.reviewCount >= 10)
    out.push({ id: 'top-reviewer', emoji: '🏆', label: 'Top Reviewer' })
  if (input.longestStreak >= 7)
    out.push({ id: 'streak-star', emoji: '🔥', label: 'Streak Star' })
  return out
}
