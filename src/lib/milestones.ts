/**
 * Streak-milestone celebration tracking (Phase 2 Part B, STEP 10).
 *
 * When a user's check-in streak first reaches a milestone (7 / 14 / 30 / 60
 * days) the profile page shows a one-time celebration sheet. We record which
 * milestones have been celebrated in localStorage so it never re-shows.
 */

export const STREAK_MILESTONES = [7, 14, 30, 60] as const
export type StreakMilestone = (typeof STREAK_MILESTONES)[number]

const KEY = 'remospot:milestonesSeen'

function readSeen(): number[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as number[]) : []
  } catch {
    return []
  }
}

function writeSeen(seen: number[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(seen))
  } catch {
    /* ignore */
  }
}

/** The highest milestone this streak qualifies for, or null. */
export function milestoneReached(streak: number): StreakMilestone | null {
  let hit: StreakMilestone | null = null
  for (const m of STREAK_MILESTONES) {
    if (streak >= m) hit = m
  }
  return hit
}

/** The next milestone above the current streak (for the progress bar). */
export function nextMilestone(streak: number): StreakMilestone | null {
  return STREAK_MILESTONES.find((m) => m > streak) ?? null
}

export function hasSeenMilestone(milestone: number): boolean {
  return readSeen().includes(milestone)
}

export function markMilestoneSeen(milestone: number): void {
  const seen = readSeen()
  if (!seen.includes(milestone)) writeSeen([...seen, milestone])
}
