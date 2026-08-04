/**
 * Onboarding completion flag (Phase 2 Part B, STEP 1).
 *
 * The wizard is shown once, right after a user's first sign-up. Completion is
 * recorded in localStorage so returning users skip straight to the app. The
 * key name is fixed by spec ('workspot_onboarding_complete'). All access is
 * wrapped in try/catch so private-mode / disabled storage degrades gracefully.
 */

const ONBOARDING_KEY = 'workspot_onboarding_complete'

export function isOnboardingComplete(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === 'true'
  } catch {
    return false
  }
}

export function markOnboardingComplete(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, 'true')
  } catch {
    /* storage unavailable — ignore */
  }
}
