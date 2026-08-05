import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * Real, query-derived platform totals for the hero and top nav. Replaces the
 * old hardcoded placeholder stats (`VERIFIED_SPOT_COUNT` and the static
 * HERO_STATS) so we only ever advertise numbers we can actually back up.
 * Consumers hide a stat until its value clears a small threshold.
 */
export interface PlatformStats {
  spotCount: number
  reviewCount: number
  neighbourhoodCount: number
}

export function usePlatformStats() {
  return useQuery<PlatformStats>({
    queryKey: ['platform-stats'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [spotsRes, reviewsRes] = await Promise.all([
        supabase.from('spots').select('neighbourhood'),
        supabase.from('reviews').select('*', { count: 'exact', head: true }),
      ])
      if (spotsRes.error) throw spotsRes.error
      if (reviewsRes.error) throw reviewsRes.error

      const spots = (spotsRes.data ?? []) as { neighbourhood: string | null }[]
      const neighbourhoods = new Set(
        spots.map((s) => s.neighbourhood).filter((n): n is string => Boolean(n)),
      )

      return {
        spotCount: spots.length,
        reviewCount: reviewsRes.count ?? 0,
        neighbourhoodCount: neighbourhoods.size,
      }
    },
  })
}
