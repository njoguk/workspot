import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { tipTagLabel } from '@/hooks/useCommunity'

/**
 * First-class tips (feedback round, Phase 2). A tip is a short piece of advice
 * attached to a spot and/or a community group. Distinct from the review-derived
 * "tips" (reviews with a comment), which `useReviewTips` still surfaces so the
 * Community Tips tab keeps its existing content. Both map to a shared `TipCard`
 * so the UI can render them side by side; reactions/comments key off
 * `targetType` ('tip' for first-class, 'review' for review-derived).
 *
 * The read hooks degrade gracefully to an empty list if the `tips` table does
 * not exist yet (migration `docs/tips-migration.sql` not applied), so the app
 * keeps working before the migration is run.
 */

export type TipTag = 'wifi' | 'food' | 'quiet' | 'vibe' | 'general'

export const TIP_TAG_OPTIONS: { value: TipTag; label: string }[] = [
  { value: 'wifi', label: 'WiFi' },
  { value: 'food', label: 'Food & coffee' },
  { value: 'quiet', label: 'Quiet' },
  { value: 'vibe', label: 'Vibe' },
  { value: 'general', label: 'General' },
]

const FIRST_CLASS_TAG_LABEL: Record<TipTag, string> = {
  wifi: 'WIFI TIP',
  food: 'FOOD TIP',
  quiet: 'QUIET TIP',
  vibe: 'VIBE TIP',
  general: 'TIP',
}

/** Accent CSS var for a tip label ("WIFI TIP" → info, etc.). */
export function tipAccentVar(tagLabel: string): string {
  switch (tagLabel) {
    case 'WIFI TIP':
      return 'var(--color-info)'
    case 'FOOD TIP':
      return 'var(--color-secondary)'
    case 'QUIET TIP':
      return 'var(--color-success)'
    case 'VIBE TIP':
      return 'var(--color-primary)'
    default:
      return 'var(--color-primary)'
  }
}

export interface TipCard {
  /** Row UUID — also the reactions/comments target_id. */
  id: string
  targetType: 'tip' | 'review'
  userId: string
  userName: string | null
  spotId: string | null
  spotName: string | null
  body: string
  /** Display label, e.g. "WIFI TIP". */
  tagLabel: string
  createdAt: string
}

/** True when the error is Postgres "relation does not exist" (migration pending). */
function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  return (
    error?.code === '42P01' ||
    Boolean(error?.message && /relation .* does not exist/i.test(error.message))
  )
}

interface RawTip {
  id: string
  user_id: string
  spot_id: string | null
  group_id: string | null
  body: string
  tag: string | null
  created_at: string
  profile: { display_name: string | null } | null
  spot: { name: string | null } | null
}

const TIP_SELECT =
  'id, user_id, spot_id, group_id, body, tag, created_at, profile:profiles(display_name), spot:spots(name)'

function mapTip(r: RawTip): TipCard {
  return {
    id: r.id,
    targetType: 'tip',
    userId: r.user_id,
    userName: r.profile?.display_name ?? null,
    spotId: r.spot_id,
    spotName: r.spot?.name ?? null,
    body: r.body,
    tagLabel: FIRST_CLASS_TAG_LABEL[(r.tag as TipTag) ?? 'general'] ?? 'TIP',
    createdAt: r.created_at,
  }
}

/** First-class tips about a specific spot. */
export function useSpotTips(spotId: string | undefined) {
  return useQuery<TipCard[]>({
    queryKey: ['tips', 'spot', spotId],
    enabled: Boolean(spotId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tips')
        .select(TIP_SELECT)
        .eq('spot_id', spotId!)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) {
        if (isMissingTable(error)) return []
        throw error
      }
      return ((data as unknown as RawTip[]) ?? []).map(mapTip)
    },
  })
}

/** First-class tips posted in a specific community group. */
export function useGroupTips(groupId: string | undefined) {
  return useQuery<TipCard[]>({
    queryKey: ['tips', 'group', groupId],
    enabled: Boolean(groupId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tips')
        .select(TIP_SELECT)
        .eq('group_id', groupId!)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) {
        if (isMissingTable(error)) return []
        throw error
      }
      return ((data as unknown as RawTip[]) ?? []).map(mapTip)
    },
  })
}

// ── Review-derived tips (reviews that carry a comment) ─────────────────────

type Scope = string[] | null | undefined

function scopeToken(memberIds: Scope): string {
  if (memberIds == null) return 'all'
  if (memberIds.length === 0) return 'none'
  return [...memberIds].sort().join(',')
}

interface RawReviewTip {
  id: string
  user_id: string
  spot_id: string | null
  comment: string | null
  quick_tags: string[] | null
  created_at: string
  profile: { display_name: string | null } | null
  spot: { name: string | null } | null
}

/** Reviews with a written comment, surfaced as tips (the legacy source). */
export function useReviewTips(memberIds?: Scope) {
  return useQuery<TipCard[]>({
    queryKey: ['tips', 'review', scopeToken(memberIds)],
    queryFn: async () => {
      if (memberIds && memberIds.length === 0) return []
      let q = supabase
        .from('reviews')
        .select(
          'id, user_id, spot_id, comment, quick_tags, created_at, profile:profiles(display_name), spot:spots(name)',
        )
        .not('comment', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10)
      if (memberIds) q = q.in('user_id', memberIds)

      const { data, error } = await q
      if (error) throw error
      return ((data as unknown as RawReviewTip[]) ?? [])
        .filter((r) => (r.comment ?? '').trim().length > 0)
        .map((r) => ({
          id: r.id,
          targetType: 'review' as const,
          userId: r.user_id,
          userName: r.profile?.display_name ?? null,
          spotId: r.spot_id,
          spotName: r.spot?.name ?? null,
          body: r.comment ?? '',
          tagLabel: tipTagLabel(r.quick_tags ?? []),
          createdAt: r.created_at,
        }))
    },
  })
}

// ── Add a tip ──────────────────────────────────────────────────────────────

export interface AddTipInput {
  body: string
  tag: TipTag
  spotId?: string | null
  groupId?: string | null
}

export function useAddTip() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation<void, Error, AddTipInput>({
    mutationFn: async ({ body, tag, spotId, groupId }) => {
      if (!user) throw new Error('Sign in to add a tip.')
      const trimmed = body.trim()
      if (!trimmed) throw new Error('Tip cannot be empty.')
      const { error } = await supabase.from('tips').insert({
        user_id: user.id,
        spot_id: spotId ?? null,
        group_id: groupId ?? null,
        body: trimmed,
        tag,
      })
      if (error) {
        if (isMissingTable(error)) {
          throw new Error('Tips aren’t enabled yet. Run the tips migration in Supabase.')
        }
        throw error
      }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['tips'] })
      if (vars.spotId)
        queryClient.invalidateQueries({ queryKey: ['tips', 'spot', vars.spotId] })
      if (vars.groupId)
        queryClient.invalidateQueries({ queryKey: ['tips', 'group', vars.groupId] })
    },
  })
}
