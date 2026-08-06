import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Review data layer (Phase 2 Part B, STEP 7). The review flow is config-driven:
 * the categories, primary metric, and quick tags come from the `review_schemas`
 * table keyed by spot type, so new space types need no code changes.
 */

// ── Schema shapes ──────────────────────────────────────────────

export interface ReviewCategory {
  key: string
  label: string
  icon: string
  weight: number
}

export interface ReviewQuickTags {
  conditions: string[]
  vibe: string[]
}

export interface ReviewSchema {
  space_type: string
  score_label: string
  primary_metric_key: string | null
  primary_metric_label: string | null
  primary_metric_unit: string | null
  primary_metric_avg_label: string | null
  categories: ReviewCategory[]
  quick_tags: ReviewQuickTags
}

/** The review schema for a spot type (cafe / cowork / hotel / garden …). */
export function useReviewSchema(spaceType: string | undefined) {
  return useQuery<ReviewSchema | null>({
    queryKey: ['reviewSchema', spaceType],
    enabled: Boolean(spaceType),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('review_schemas')
        .select('*')
        .eq('space_type', spaceType!)
        .maybeSingle()
      if (error) throw error
      return (data as ReviewSchema | null) ?? null
    },
  })
}

// ── Primary-metric average (e.g. avg WiFi speed) ───────────────

export interface MetricAverage {
  average: number | null
  count: number
}

export function useSpotMetricAverage(spotId: string | undefined) {
  return useQuery<MetricAverage>({
    queryKey: ['review', 'metricAvg', spotId],
    enabled: Boolean(spotId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('primary_metric_value')
        .eq('spot_id', spotId!)
        .not('primary_metric_value', 'is', null)
      if (error) throw error
      const values = ((data as { primary_metric_value: number | null }[]) ?? [])
        .map((r) => r.primary_metric_value)
        .filter((v): v is number => v != null)
      if (values.length === 0) return { average: null, count: 0 }
      const avg = values.reduce((a, b) => a + b, 0) / values.length
      return { average: Math.round(avg), count: values.length }
    },
  })
}

// ── Reviews list for a spot (display) ──────────────────────────

export interface SpotReview {
  id: string
  userId: string
  userName: string | null
  overallScore: number | null
  comment: string | null
  quickTags: string[]
  createdAt: string
}

interface RawSpotReview {
  id: string
  user_id: string
  overall_score: number | string | null
  comment: string | null
  quick_tags: string[] | null
  created_at: string
  profile: { display_name: string | null } | null
}

/** Recent reviews for a spot, newest first, with the reviewer's name. */
export function useSpotReviews(spotId: string | undefined, limit = 20) {
  return useQuery<SpotReview[]>({
    queryKey: ['review', 'spotList', spotId],
    enabled: Boolean(spotId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(
          'id, user_id, overall_score, comment, quick_tags, created_at, profile:profiles(display_name)',
        )
        .eq('spot_id', spotId!)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return ((data as unknown as RawSpotReview[]) ?? []).map((r) => ({
        id: r.id,
        userId: r.user_id,
        userName: r.profile?.display_name ?? null,
        overallScore: r.overall_score != null ? Number(r.overall_score) : null,
        comment: r.comment,
        quickTags: r.quick_tags ?? [],
        createdAt: r.created_at,
      }))
    },
  })
}

// ── Overall-score calculation (docs/SCHEMA.md) ─────────────────

/**
 * Weighted overall score, scaled to 0–10. `ratings` are 1–5 per category.
 * `overall = Σ(rating * weight) * 2`, rounded to one decimal.
 */
export function calcOverallScore(
  categories: ReviewCategory[],
  ratings: Record<string, number>,
): number {
  const weighted = categories.reduce(
    (sum, cat) => sum + (ratings[cat.key] || 0) * cat.weight,
    0,
  )
  return Math.round(weighted * 2 * 10) / 10
}

// ── Submit ─────────────────────────────────────────────────────

export interface SubmitReviewInput {
  spotId: string
  spaceType: string
  ratings: Record<string, number>
  overallScore: number
  primaryMetricValue: number | null
  comment: string | null
  quickTags: string[]
}

export function useSubmitReview() {
  const { user, profile, refreshProfile } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SubmitReviewInput) => {
      if (!user) throw new Error('You need to be signed in to review.')

      const { error } = await supabase.from('reviews').insert({
        user_id: user.id,
        spot_id: input.spotId,
        space_type: input.spaceType,
        ratings: input.ratings,
        overall_score: input.overallScore,
        primary_metric_value: input.primaryMetricValue,
        comment: input.comment,
        quick_tags: input.quickTags,
      })
      if (error) throw error

      // Recompute the spot's WorkScore server-side (docs/SCHEMA.md RPC).
      await supabase.rpc('update_spot_work_score', { spot_uuid: input.spotId })

      // Bump the reviewer's contribution counter (best-effort).
      if (profile) {
        await supabase
          .from('profiles')
          .update({
            workscore_contributions: (profile.workscore_contributions ?? 0) + 1,
          })
          .eq('id', user.id)
      }
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: ['spots'] })
      queryClient.invalidateQueries({ queryKey: ['spot', input.spotId] })
      queryClient.invalidateQueries({ queryKey: ['review'] })
      queryClient.invalidateQueries({ queryKey: ['community'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      void refreshProfile()
    },
  })
}
