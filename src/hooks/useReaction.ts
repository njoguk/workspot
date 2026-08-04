import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Reactions data layer (Community v2, Phase C1). Replaces the old localStorage
 * store with the real `reactions` table. Batched per list: one query resolves
 * counts + the current user's own reaction for many targets at once, so the
 * feed doesn't fire N requests.
 */

export type ReactionTargetType = 'checkin' | 'review' | 'post' | 'comment'
export type ReactionKind = 'like' | 'helpful'

export interface ReactionState {
  count: number
  active: boolean
}

const EMPTY: ReactionState = { count: 0, active: false }

export function useReactions(
  targetType: ReactionTargetType,
  targetIds: string[],
  kind: ReactionKind = 'like',
) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const idsKey = [...targetIds].sort().join(',')
  const queryKey = ['reactions', targetType, kind, idsKey, user?.id ?? 'anon']

  const query = useQuery<Record<string, ReactionState>>({
    queryKey,
    enabled: targetIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reactions')
        .select('target_id, user_id')
        .eq('target_type', targetType)
        .eq('kind', kind)
        .in('target_id', targetIds)
      if (error) throw error
      const map: Record<string, ReactionState> = {}
      for (const id of targetIds) map[id] = { count: 0, active: false }
      for (const row of (data as { target_id: string; user_id: string }[]) ?? []) {
        const s = map[row.target_id] ?? { count: 0, active: false }
        s.count += 1
        if (row.user_id === user?.id) s.active = true
        map[row.target_id] = s
      }
      return map
    },
  })

  const toggle = useMutation<void, Error, string, { prev?: Record<string, ReactionState> }>({
    // Source of truth is the DB row's existence, so the write is correct even if
    // the cached state is momentarily stale.
    mutationFn: async (targetId: string) => {
      if (!user) throw new Error('Sign in to react.')
      const { data: existing, error: readErr } = await supabase
        .from('reactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('target_type', targetType)
        .eq('kind', kind)
        .eq('target_id', targetId)
        .maybeSingle()
      if (readErr) throw readErr
      if (existing) {
        const { error } = await supabase.from('reactions').delete().eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('reactions')
          .insert({ user_id: user.id, target_type: targetType, kind, target_id: targetId })
        if (error) throw error
      }
    },
    onMutate: async (targetId) => {
      await queryClient.cancelQueries({ queryKey })
      const prev = queryClient.getQueryData<Record<string, ReactionState>>(queryKey)
      queryClient.setQueryData<Record<string, ReactionState>>(queryKey, (old) => {
        const map = { ...(old ?? {}) }
        const s = map[targetId] ?? { count: 0, active: false }
        const active = !s.active
        map[targetId] = { active, count: Math.max(0, s.count + (active ? 1 : -1)) }
        return map
      })
      return { prev }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return {
    stateFor: (id: string): ReactionState => query.data?.[id] ?? EMPTY,
    toggle: (id: string) => toggle.mutate(id),
  }
}
