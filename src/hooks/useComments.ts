import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Comment threads on activity items (Community v2, Phase C1). Polymorphic over
 * check-ins / reviews / posts. Counts are batched for a list; a single thread
 * subscribes to realtime while it's open.
 */

export type CommentTargetType = 'checkin' | 'review' | 'post' | 'tip'

export interface CommentItem {
  id: string
  authorId: string
  authorName: string | null
  body: string
  createdAt: string
}

interface RawComment {
  id: string
  author_id: string
  body: string
  created_at: string
  profile: { display_name: string | null } | null
}

/** Comment counts for many targets in one query. */
export function useCommentCounts(targetType: CommentTargetType, targetIds: string[]) {
  const idsKey = [...targetIds].sort().join(',')
  return useQuery<Record<string, number>>({
    queryKey: ['comment-counts', targetType, idsKey],
    enabled: targetIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('target_id')
        .eq('target_type', targetType)
        .in('target_id', targetIds)
      if (error) throw error
      const counts: Record<string, number> = {}
      for (const id of targetIds) counts[id] = 0
      for (const row of (data as { target_id: string }[]) ?? []) {
        counts[row.target_id] = (counts[row.target_id] ?? 0) + 1
      }
      return counts
    },
  })
}

/** The comment thread for a single target (realtime while `enabled`). */
export function useComments(
  targetType: CommentTargetType,
  targetId: string,
  enabled = true,
) {
  const queryClient = useQueryClient()
  const queryKey = ['comments', targetType, targetId]

  const query = useQuery<CommentItem[]>({
    queryKey,
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('id, author_id, body, created_at, profile:profiles(display_name)')
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return ((data as unknown as RawComment[]) ?? []).map((c) => ({
        id: c.id,
        authorId: c.author_id,
        authorName: c.profile?.display_name ?? null,
        body: c.body,
        createdAt: c.created_at,
      }))
    },
  })

  useEffect(() => {
    if (!enabled) return
    const channel = supabase
      .channel(`comments:${targetType}:${targetId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `target_id=eq.${targetId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey })
          queryClient.invalidateQueries({ queryKey: ['comment-counts', targetType] })
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, targetType, targetId])

  return query
}

/** Add a comment to a target. */
export function useAddComment(targetType: CommentTargetType, targetId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async (body: string) => {
      if (!user) throw new Error('Sign in to comment.')
      const trimmed = body.trim()
      if (!trimmed) throw new Error('Comment cannot be empty.')
      const { error } = await supabase.from('comments').insert({
        author_id: user.id,
        target_type: targetType,
        target_id: targetId,
        body: trimmed,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', targetType, targetId] })
      queryClient.invalidateQueries({ queryKey: ['comment-counts', targetType] })
    },
  })
}
