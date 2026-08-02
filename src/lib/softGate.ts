/**
 * Soft-gate visit tracking (Phase 2 STEP 6).
 *
 * We count how many spot detail pages a guest has opened. After
 * VISIT_THRESHOLD visits we invite them to create an account via a bottom
 * sheet. Dismissal persists in localStorage (never nag again); showing is
 * additionally capped to once per browser session via sessionStorage.
 *
 * All reads/writes are wrapped in try/catch so private-mode / disabled
 * storage degrades gracefully instead of throwing.
 */

const VISITS_KEY = 'remospot:spotVisits'
const DISMISSED_KEY = 'remospot:softGateDismissed'
const SHOWN_SESSION_KEY = 'remospot:softGateShownThisSession'

/** Number of guest spot visits before the join sheet appears. */
export const VISIT_THRESHOLD = 3

export function getSpotVisitCount(): number {
  try {
    return Number(localStorage.getItem(VISITS_KEY) ?? '0') || 0
  } catch {
    return 0
  }
}

/** Increment and return the new visit count. */
export function recordSpotVisit(): number {
  const next = getSpotVisitCount() + 1
  try {
    localStorage.setItem(VISITS_KEY, String(next))
  } catch {
    /* storage unavailable — ignore */
  }
  return next
}

export function isSoftGateDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

/** Permanently dismiss the soft gate (user chose "continue as guest"). */
export function dismissSoftGate(): void {
  try {
    localStorage.setItem(DISMISSED_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function wasShownThisSession(): boolean {
  try {
    return sessionStorage.getItem(SHOWN_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

export function markShownThisSession(): void {
  try {
    sessionStorage.setItem(SHOWN_SESSION_KEY, '1')
  } catch {
    /* ignore */
  }
}
