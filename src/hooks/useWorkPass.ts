import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

/**
 * WorkPass membership status + activation (Phase 3 monetisation, STEP 1).
 *
 * Membership lives on the `profiles` row (is_workpass + workpass_expires_at).
 * The signed-in profile is already cached in AuthContext, so this hook derives
 * status from it rather than issuing another query. An expired-but-still-flagged
 * membership is lazily downgraded (is_workpass → false) the next time it's read.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000

export interface WorkPassStatus {
  /** True only when is_workpass is set AND the expiry is still in the future. */
  isActive: boolean
  /** Expiry date while active, else null. */
  expiresAt: Date | null
  /** Whole days remaining (rounded up), or 0 when inactive. */
  daysLeft: number
}

export function useIsWorkPassMember(): WorkPassStatus {
  const { user, profile, refreshProfile } = useAuth()
  const queryClient = useQueryClient()

  const rawExpiry = profile?.workpass_expires_at ?? null
  const expiresAt = rawExpiry ? new Date(rawExpiry) : null
  const now = Date.now()
  const notExpired = expiresAt ? expiresAt.getTime() > now : false
  const isActive = Boolean(profile?.is_workpass && notExpired)
  const daysLeft =
    isActive && expiresAt
      ? Math.max(0, Math.ceil((expiresAt.getTime() - now) / MS_PER_DAY))
      : 0

  // Lazy downgrade: the flag is still set but the pass has lapsed. Flip it once,
  // best-effort, then refresh the cached profile so the UI settles to "free".
  useEffect(() => {
    if (!user || !profile?.is_workpass) return
    if (expiresAt && expiresAt.getTime() > now) return
    if (!expiresAt) return // active with no expiry → treat as ongoing, leave alone
    let cancelled = false
    void (async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_workpass: false })
        .eq('id', user.id)
      if (cancelled || error) return
      await refreshProfile()
      queryClient.invalidateQueries({ queryKey: ['workpass'] })
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.is_workpass, rawExpiry])

  return { isActive, expiresAt: isActive ? expiresAt : null, daysLeft }
}

// ── Activation (test shortcut until Session 6 Edge Function) ────

export type WorkPassPlan = 'monthly' | 'annual'

/**
 * Activate a WorkPass membership. Real M-Pesa/Paystack settlement arrives in
 * Session 6; for now this is the local test shortcut that grants 30 days of
 * membership per docs/BUILD_PLAN.md STEP 3, Screen 3.
 */
export function useActivateWorkPass() {
  const { user, refreshProfile } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (_plan: WorkPassPlan) => {
      if (!user) throw new Error('You need to be signed in to start a WorkPass.')
      const expiresAt = new Date(Date.now() + 30 * MS_PER_DAY).toISOString()
      const { error } = await supabase
        .from('profiles')
        .update({ is_workpass: true, workpass_expires_at: expiresAt })
        .eq('id', user.id)
      if (error) throw error
      return { expiresAt }
    },
    onSuccess: () => {
      void refreshProfile()
      queryClient.invalidateQueries({ queryKey: ['workpass'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

/**
 * Cancel the current user's WorkPass — clears the membership flag and expiry.
 * (No real billing engine yet, so cancellation ends access immediately rather
 * than at period end.)
 */
export function useCancelWorkPass() {
  const { user, refreshProfile } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('You need to be signed in.')
      const { error } = await supabase
        .from('profiles')
        .update({ is_workpass: false, workpass_expires_at: null })
        .eq('id', user.id)
      if (error) throw error
    },
    onSuccess: () => {
      void refreshProfile()
      queryClient.invalidateQueries({ queryKey: ['workpass'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
