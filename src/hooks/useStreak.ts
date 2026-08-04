import type { Profile } from '@/types'
import { todayStr, yesterdayStr } from '@/lib/date'

/**
 * Check-in streak calculation (Phase 2 Part B, STEP 6).
 *
 * Rules, applied on every check-in:
 *  - last check-in was yesterday  → increment the streak
 *  - last check-in was today      → no change (already counted today)
 *  - otherwise (gap / first ever) → reset to 1
 * `longest_streak` tracks the all-time high.
 */

type StreakFields = Pick<
  Profile,
  'check_in_streak' | 'longest_streak' | 'last_checkin_date'
>

export interface StreakResult {
  check_in_streak: number
  longest_streak: number
  last_checkin_date: string
  /** False when the user had already checked in today (streak unchanged). */
  changed: boolean
}

export function computeStreak(
  profile: StreakFields,
  now: Date = new Date(),
): StreakResult {
  const today = todayStr(now)
  const yesterday = yesterdayStr(now)
  const last = profile.last_checkin_date

  let streak: number
  if (last === today) {
    // Already checked in today — keep the current streak (min 1).
    streak = Math.max(1, profile.check_in_streak || 0)
  } else if (last === yesterday) {
    streak = (profile.check_in_streak || 0) + 1
  } else {
    streak = 1
  }

  return {
    check_in_streak: streak,
    longest_streak: Math.max(profile.longest_streak || 0, streak),
    last_checkin_date: today,
    changed: last !== today,
  }
}
