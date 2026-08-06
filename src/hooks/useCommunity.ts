import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { daysAgoStr } from '@/lib/date'
import type { ProfileRole } from '@/types'

/**
 * Community feed data layer (Community v2). Three tabs:
 *  - Activity: recent check-ins + reviews, merged and time-ordered
 *  - Tips:     reviews that carry a written comment
 *  - People:   group members, or profiles active in the last 30 days
 *
 * Each hook accepts an optional `memberIds` scope:
 *  - `null`/omitted → global (the default "everyone" group)
 *  - `string[]`     → only these users (a specific group's members)
 *  - `[]`           → an empty group (returns nothing)
 */

type Scope = string[] | null | undefined

function scopeToken(memberIds: Scope): string {
  if (memberIds == null) return 'all'
  if (memberIds.length === 0) return 'none'
  return [...memberIds].sort().join(',')
}

// ── Activity feed ──────────────────────────────────────────────

export type FeedKind = 'checkin' | 'review'

export interface FeedItem {
  id: string
  /** Underlying row UUID (for reactions/comments target_id). */
  rawId: string
  kind: FeedKind
  userId: string
  userName: string | null
  createdAt: string
  spotId: string | null
  spotName: string | null
  /** Verb phrase, e.g. "checked in at" / "reviewed". */
  action: string
  /** Extra context: a review comment or a check-in session note. */
  note: string | null
  /** Review quick tags (empty for check-ins). */
  quickTags: string[]
  spotNeighbourhood: string | null
  spotType: string | null
}

interface RawCheckin {
  id: string
  user_id: string
  spot_id: string | null
  checked_in_at: string
  session_note: string | null
  profile: { display_name: string | null } | null
  spot: { name: string | null; neighbourhood: string | null; type: string | null } | null
}

interface RawReview {
  id: string
  user_id: string
  spot_id: string | null
  overall_score: number | string | null
  comment: string | null
  quick_tags: string[] | null
  created_at: string
  profile: { display_name: string | null } | null
  spot: { name: string | null; neighbourhood: string | null; type: string | null } | null
}

export function useActivityFeed(memberIds?: Scope) {
  return useQuery<FeedItem[]>({
    queryKey: ['community', 'activity', scopeToken(memberIds)],
    queryFn: async () => {
      if (memberIds && memberIds.length === 0) return []

      let checkinQ = supabase
        .from('checkins')
        .select(
          'id, user_id, spot_id, checked_in_at, session_note, profile:profiles(display_name), spot:spots(name, neighbourhood, type)',
        )
        .order('checked_in_at', { ascending: false })
        .limit(20)
      let reviewQ = supabase
        .from('reviews')
        .select(
          'id, user_id, spot_id, overall_score, comment, quick_tags, created_at, profile:profiles(display_name), spot:spots(name, neighbourhood, type)',
        )
        .order('created_at', { ascending: false })
        .limit(20)

      if (memberIds) {
        checkinQ = checkinQ.in('user_id', memberIds)
        reviewQ = reviewQ.in('user_id', memberIds)
      }

      const [checkinsRes, reviewsRes] = await Promise.all([checkinQ, reviewQ])
      if (checkinsRes.error) throw checkinsRes.error
      if (reviewsRes.error) throw reviewsRes.error

      const checkins: FeedItem[] = ((checkinsRes.data as unknown as RawCheckin[]) ?? []).map(
        (c) => ({
          id: `c-${c.id}`,
          rawId: c.id,
          kind: 'checkin',
          userId: c.user_id,
          userName: c.profile?.display_name ?? null,
          createdAt: c.checked_in_at,
          spotId: c.spot_id,
          spotName: c.spot?.name ?? null,
          action: 'checked in at',
          note: c.session_note?.trim() || null,
          quickTags: [],
          spotNeighbourhood: c.spot?.neighbourhood ?? null,
          spotType: c.spot?.type ?? null,
        }),
      )

      const reviews: FeedItem[] = ((reviewsRes.data as unknown as RawReview[]) ?? []).map(
        (r) => ({
          id: `r-${r.id}`,
          rawId: r.id,
          kind: 'review',
          userId: r.user_id,
          userName: r.profile?.display_name ?? null,
          createdAt: r.created_at,
          spotId: r.spot_id,
          spotName: r.spot?.name ?? null,
          action:
            r.overall_score != null
              ? `reviewed · ${Number(r.overall_score).toFixed(1)}`
              : 'reviewed',
          note: r.comment?.trim() || null,
          quickTags: r.quick_tags ?? [],
          spotNeighbourhood: r.spot?.neighbourhood ?? null,
          spotType: r.spot?.type ?? null,
        }),
      )

      return [...checkins, ...reviews]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 20)
    },
  })
}

// ── Tips ───────────────────────────────────────────────────────
// First-class tips + the review-derived source now live in `useTips.ts`.
// `tipTagLabel` stays here because it derives a label from review quick tags.

/** Derive a short tag label ("WIFI TIP", "FOOD TIP", …) from quick tags. */
export function tipTagLabel(quickTags: string[]): string {
  const hay = quickTags.join(' ').toLowerCase()
  if (/wifi|📡|patchy|power|🔌|socket/.test(hay)) return 'WIFI TIP'
  if (/coffee|☕|food|music|🎵/.test(hay)) return 'FOOD TIP'
  if (/quiet|🤫|calm|🧘/.test(hay)) return 'QUIET TIP'
  if (/network|🤝|crowd|productive|👩‍💻|💻/.test(hay)) return 'VIBE TIP'
  return 'TIP'
}

// ── People ─────────────────────────────────────────────────────

export interface Person {
  id: string
  display_name: string | null
  handle: string | null
  role: ProfileRole | null
  check_in_streak: number
}

export function usePeople(memberIds?: Scope) {
  return useQuery<Person[]>({
    queryKey: ['community', 'people', scopeToken(memberIds)],
    queryFn: async () => {
      if (memberIds && memberIds.length === 0) return []

      let q = supabase
        .from('profiles')
        .select('id, display_name, handle, role, check_in_streak')
        .order('check_in_streak', { ascending: false })
        .limit(60)

      if (memberIds) {
        // A specific group → its members.
        q = q.in('id', memberIds)
      } else {
        // Global → recently active profiles.
        q = q.gte('last_checkin_date', daysAgoStr(30))
      }

      const { data, error } = await q
      if (error) throw error
      return (data as Person[]) ?? []
    },
  })
}
