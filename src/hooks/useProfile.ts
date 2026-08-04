import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Profile } from '@/types'

/**
 * Profile aggregates + editing (Phase 2 Part B, STEP 10). Header identity comes
 * from AuthContext's cached profile; the counts, recent spots, and badge
 * eligibility are aggregated here from check-ins / reviews / rsvps.
 */

// ── Headline stats ─────────────────────────────────────────────

export interface ProfileStats {
  checkins: number
  reviews: number
  spotsVisited: number
}

export function useProfileStats(userId: string | undefined) {
  return useQuery<ProfileStats>({
    queryKey: ['profile', 'stats', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const [checkinsRes, reviewsRes, spotsRes] = await Promise.all([
        supabase
          .from('checkins')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId!),
        supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId!),
        supabase.from('checkins').select('spot_id').eq('user_id', userId!),
      ])
      if (checkinsRes.error) throw checkinsRes.error
      if (reviewsRes.error) throw reviewsRes.error
      if (spotsRes.error) throw spotsRes.error

      const distinct = new Set(
        ((spotsRes.data as { spot_id: string }[]) ?? []).map((r) => r.spot_id),
      )
      return {
        checkins: checkinsRes.count ?? 0,
        reviews: reviewsRes.count ?? 0,
        spotsVisited: distinct.size,
      }
    },
  })
}

// ── Recent spots (last 5 distinct) ─────────────────────────────

export interface RecentSpot {
  spotId: string
  name: string
  neighbourhood: string | null
  coverGradient: string | null
  workScore: number
  scoreLabel: string | null
  lastVisit: string
  totalVisits: number
}

interface RawRecentCheckin {
  spot_id: string
  checked_in_at: string
  spot: {
    id: string
    name: string
    neighbourhood: string | null
    cover_gradient: string | null
    work_score: number | string | null
    score_label: string | null
  } | null
}

export function useRecentSpots(userId: string | undefined) {
  return useQuery<RecentSpot[]>({
    queryKey: ['profile', 'recentSpots', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkins')
        .select(
          'spot_id, checked_in_at, spot:spots(id, name, neighbourhood, cover_gradient, work_score, score_label)',
        )
        .eq('user_id', userId!)
        .order('checked_in_at', { ascending: false })
        .limit(50)
      if (error) throw error

      const rows = (data as unknown as RawRecentCheckin[]) ?? []
      const bySpot = new Map<string, RecentSpot>()
      for (const row of rows) {
        if (!row.spot_id || !row.spot) continue
        const existing = bySpot.get(row.spot_id)
        if (existing) {
          existing.totalVisits += 1
        } else {
          bySpot.set(row.spot_id, {
            spotId: row.spot_id,
            name: row.spot.name,
            neighbourhood: row.spot.neighbourhood,
            coverGradient: row.spot.cover_gradient,
            workScore: Number(row.spot.work_score ?? 0),
            scoreLabel: row.spot.score_label,
            lastVisit: row.checked_in_at,
            totalVisits: 1,
          })
        }
      }
      return [...bySpot.values()].slice(0, 5)
    },
  })
}

// ── Last check-in (for the streak card) ────────────────────────

export interface LastCheckin {
  spotName: string | null
  checkedInAt: string
}

export function useLastCheckin(userId: string | undefined) {
  return useQuery<LastCheckin | null>({
    queryKey: ['profile', 'lastCheckin', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checkins')
        .select('checked_in_at, spot:spots(name)')
        .eq('user_id', userId!)
        .order('checked_in_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      const row = data as unknown as {
        checked_in_at: string
        spot: { name: string | null } | null
      }
      return { spotName: row.spot?.name ?? null, checkedInAt: row.checked_in_at }
    },
  })
}

// ── Badge eligibility ──────────────────────────────────────────

export interface BadgeData {
  gardenCheckins: number
  wifiTests: number
  eventsAttended: number
  distinctHoods: number
  reviewCount: number
}

export function useBadgeData(userId: string | undefined) {
  return useQuery<BadgeData>({
    queryKey: ['profile', 'badges', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const [checkinsRes, wifiRes, rsvpRes, reviewsRes] = await Promise.all([
        supabase
          .from('checkins')
          .select('spot:spots(type, neighbourhood)')
          .eq('user_id', userId!),
        supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId!)
          .not('primary_metric_value', 'is', null),
        supabase
          .from('rsvps')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId!),
        supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId!),
      ])
      if (checkinsRes.error) throw checkinsRes.error
      if (wifiRes.error) throw wifiRes.error
      if (rsvpRes.error) throw rsvpRes.error
      if (reviewsRes.error) throw reviewsRes.error

      const checkinRows =
        (checkinsRes.data as unknown as {
          spot: { type: string | null; neighbourhood: string | null } | null
        }[]) ?? []

      const gardenCheckins = checkinRows.filter(
        (r) => r.spot?.type === 'garden',
      ).length
      const distinctHoods = new Set(
        checkinRows
          .map((r) => r.spot?.neighbourhood)
          .filter((n): n is string => Boolean(n)),
      ).size

      return {
        gardenCheckins,
        wifiTests: wifiRes.count ?? 0,
        eventsAttended: rsvpRes.count ?? 0,
        distinctHoods,
        reviewCount: reviewsRes.count ?? 0,
      }
    },
  })
}

// ── Update (onboarding + profile edits) ────────────────────────

type ProfilePatch = Partial<
  Pick<Profile, 'role' | 'interests' | 'neighbourhoods' | 'display_name'>
>

export function useUpdateProfile() {
  const { user, refreshProfile } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (patch: ProfilePatch) => {
      if (!user) throw new Error('You need to be signed in.')
      const { error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', user.id)
      if (error) throw error
    },
    onSuccess: () => {
      void refreshProfile()
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
