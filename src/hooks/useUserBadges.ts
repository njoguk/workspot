import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { signatureBadges, type SignatureBadge } from '@/lib/badges'

/**
 * Signature badges for many users at once, so lists (community feed, people
 * cards, spot reviews) can show a badge next to each name without N queries.
 * Three batched aggregate reads (review counts, event RSVPs, streak) → a map of
 * userId → ordered signature badges.
 */
export function useUserBadges(userIds: string[]) {
  const ids = [...new Set(userIds.filter(Boolean))]
  const key = [...ids].sort().join(',')

  return useQuery<Record<string, SignatureBadge[]>>({
    queryKey: ['userBadges', key],
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [profilesRes, reviewsRes, rsvpsRes] = await Promise.all([
        supabase.from('profiles').select('id, longest_streak').in('id', ids),
        supabase.from('reviews').select('user_id').in('user_id', ids),
        supabase.from('rsvps').select('user_id').in('user_id', ids),
      ])
      if (profilesRes.error) throw profilesRes.error
      if (reviewsRes.error) throw reviewsRes.error
      if (rsvpsRes.error) throw rsvpsRes.error

      const reviewCounts = tally((reviewsRes.data as { user_id: string }[]) ?? [])
      const rsvpCounts = tally((rsvpsRes.data as { user_id: string }[]) ?? [])
      const streaks: Record<string, number> = {}
      for (const p of (profilesRes.data as { id: string; longest_streak: number | null }[]) ?? [])
        streaks[p.id] = p.longest_streak ?? 0

      const map: Record<string, SignatureBadge[]> = {}
      for (const id of ids) {
        map[id] = signatureBadges({
          reviewCount: reviewCounts[id] ?? 0,
          eventsAttended: rsvpCounts[id] ?? 0,
          longestStreak: streaks[id] ?? 0,
        })
      }
      return map
    },
  })
}

function tally(rows: { user_id: string }[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const r of rows) counts[r.user_id] = (counts[r.user_id] ?? 0) + 1
  return counts
}
