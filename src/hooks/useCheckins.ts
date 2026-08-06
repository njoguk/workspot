import { useEffect } from 'react'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { computeStreak } from '@/hooks/useStreak'

/**
 * Check-in data layer (Phase 2 Part B, STEPS 2–6). All Supabase access for
 * check-ins lives here; components consume these hooks only. Live occupancy
 * counts and companion lists subscribe to Postgres realtime so they update
 * as people arrive and leave.
 */

// ── Shapes ─────────────────────────────────────────────────────

interface JoinedSpot {
  id: string
  name: string
  neighbourhood: string | null
  cover_gradient: string | null
  work_score: number | string | null
  best_times: string[] | null
  type: string
}

export interface ActiveCheckin {
  id: string
  spot_id: string
  checked_in_at: string
  spot: JoinedSpot | null
}

export interface Companion {
  user_id: string
  display_name: string | null
}

// ── The current user's open check-in ───────────────────────────

/** The signed-in user's open check-in (checked_out_at IS NULL), or null. */
export function useActiveCheckin() {
  const { user } = useAuth()
  const userId = user?.id
  return useQuery<ActiveCheckin | null>({
    queryKey: ['checkin', 'active', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkins')
        .select(
          'id, spot_id, checked_in_at, spot:spots(id, name, neighbourhood, cover_gradient, work_score, best_times, type)',
        )
        .eq('user_id', userId!)
        .is('checked_out_at', null)
        .order('checked_in_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return (data as ActiveCheckin | null) ?? null
    },
  })
}

// ── Live occupancy counts (realtime) ───────────────────────────

/** Open check-in counts for a set of spots, keyed by spot id. Realtime. */
export function useLiveCounts(spotIds: string[]) {
  const queryClient = useQueryClient()
  const key = [...spotIds].sort().join(',')

  const query = useQuery<Record<string, number>>({
    queryKey: ['checkin', 'counts', key],
    enabled: spotIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkins')
        .select('spot_id')
        .in('spot_id', spotIds)
        .is('checked_out_at', null)
      if (error) throw error
      const counts: Record<string, number> = {}
      for (const row of (data as { spot_id: string }[]) ?? []) {
        counts[row.spot_id] = (counts[row.spot_id] ?? 0) + 1
      }
      return counts
    },
  })

  useEffect(() => {
    if (spotIds.length === 0) return
    const channel = supabase
      .channel(`checkins:counts:${key}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'checkins' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['checkin', 'counts', key] })
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return query
}

// ── "Also working here" companions (realtime) ──────────────────

/** Distinct other people currently checked in at a spot. Realtime. */
export function useSpotCompanions(
  spotId: string | undefined,
  excludeUserId?: string,
) {
  const queryClient = useQueryClient()

  const query = useQuery<Companion[]>({
    queryKey: ['checkin', 'companions', spotId],
    enabled: Boolean(spotId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkins')
        .select('user_id, profile:profiles(display_name)')
        .eq('spot_id', spotId!)
        .is('checked_out_at', null)
      if (error) throw error

      const rows =
        (data as unknown as {
          user_id: string
          profile: { display_name: string | null } | null
        }[]) ?? []

      const seen = new Set<string>()
      const out: Companion[] = []
      for (const row of rows) {
        if (excludeUserId && row.user_id === excludeUserId) continue
        if (seen.has(row.user_id)) continue
        seen.add(row.user_id)
        out.push({
          user_id: row.user_id,
          display_name: row.profile?.display_name ?? null,
        })
      }
      return out
    },
  })

  useEffect(() => {
    if (!spotId) return
    const channel = supabase
      .channel(`checkins:companions:${spotId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checkins',
          filter: `spot_id=eq.${spotId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['checkin', 'companions', spotId],
          })
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotId])

  return query
}

// ── Past check-in history ──────────────────────────────────────

export interface PastCheckin {
  id: string
  spotId: string | null
  spotName: string | null
  spotNeighbourhood: string | null
  coverGradient: string | null
  checkedInAt: string
  checkedOutAt: string | null
  /** Whether the user has left a review / tip for this spot. */
  youReviewed: boolean
  youTipped: boolean
}

interface RawPastCheckin {
  id: string
  spot_id: string | null
  checked_in_at: string
  checked_out_at: string | null
  spot: {
    name: string | null
    neighbourhood: string | null
    cover_gradient: string | null
  } | null
}

/**
 * The user's own check-in history (newest first), annotated with whether they
 * left a review or tip for that spot. The tips lookup is best-effort so the
 * history still loads before the tips migration is applied.
 */
export function usePastCheckins(userId: string | undefined, limit = 15) {
  return useQuery<PastCheckin[]>({
    queryKey: ['checkin', 'history', userId, limit],
    enabled: Boolean(userId),
    queryFn: async () => {
      const checkinsRes = await supabase
        .from('checkins')
        .select(
          'id, spot_id, checked_in_at, checked_out_at, spot:spots(name, neighbourhood, cover_gradient)',
        )
        .eq('user_id', userId!)
        .order('checked_in_at', { ascending: false })
        .limit(limit)
      if (checkinsRes.error) throw checkinsRes.error

      const rows = (checkinsRes.data as unknown as RawPastCheckin[]) ?? []
      const spotIds = [
        ...new Set(rows.map((r) => r.spot_id).filter((s): s is string => Boolean(s))),
      ]

      const reviewedSpots = new Set<string>()
      const tippedSpots = new Set<string>()
      if (spotIds.length > 0) {
        const [reviewsRes, tipsRes] = await Promise.all([
          supabase.from('reviews').select('spot_id').eq('user_id', userId!).in('spot_id', spotIds),
          supabase.from('tips').select('spot_id').eq('user_id', userId!).in('spot_id', spotIds),
        ])
        if (!reviewsRes.error)
          for (const r of (reviewsRes.data as { spot_id: string | null }[]) ?? [])
            if (r.spot_id) reviewedSpots.add(r.spot_id)
        // tips table may not exist yet (migration pending) — ignore its error.
        if (!tipsRes.error)
          for (const t of (tipsRes.data as { spot_id: string | null }[]) ?? [])
            if (t.spot_id) tippedSpots.add(t.spot_id)
      }

      return rows.map((r) => ({
        id: r.id,
        spotId: r.spot_id,
        spotName: r.spot?.name ?? null,
        spotNeighbourhood: r.spot?.neighbourhood ?? null,
        coverGradient: r.spot?.cover_gradient ?? null,
        checkedInAt: r.checked_in_at,
        checkedOutAt: r.checked_out_at,
        youReviewed: r.spot_id ? reviewedSpots.has(r.spot_id) : false,
        youTipped: r.spot_id ? tippedSpots.has(r.spot_id) : false,
      }))
    },
  })
}

// ── Mutations: check in / check out ────────────────────────────

/** Check-in and check-out mutations, with streak bookkeeping on check-in. */
export function useCheckInMutations() {
  const { user, profile, refreshProfile } = useAuth()
  const queryClient = useQueryClient()

  const checkIn = useMutation({
    mutationFn: async (spotId: string) => {
      if (!user) throw new Error('You need to be signed in to check in.')

      // A user can only be checked in to one spot at a time: close any open
      // check-in first, so checking in elsewhere "moves" you rather than
      // stacking a second open session.
      await supabase
        .from('checkins')
        .update({ checked_out_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('checked_out_at', null)

      const { data, error } = await supabase
        .from('checkins')
        .insert({ user_id: user.id, spot_id: spotId })
        .select('id, spot_id, checked_in_at')
        .single()
      if (error) throw error

      // Streak update (STEP 6) — best-effort; a failure here shouldn't undo
      // the check-in itself.
      if (profile) {
        const next = computeStreak(profile)
        await supabase
          .from('profiles')
          .update({
            check_in_streak: next.check_in_streak,
            longest_streak: next.longest_streak,
            last_checkin_date: next.last_checkin_date,
          })
          .eq('id', user.id)
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin'] })
      queryClient.invalidateQueries({ queryKey: ['community'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      void refreshProfile()
    },
  })

  const checkOut = useMutation({
    mutationFn: async (checkinId: string) => {
      const { error } = await supabase
        .from('checkins')
        .update({ checked_out_at: new Date().toISOString() })
        .eq('id', checkinId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin'] })
      queryClient.invalidateQueries({ queryKey: ['community'] })
    },
  })

  return { checkIn, checkOut }
}
