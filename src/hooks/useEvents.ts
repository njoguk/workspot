import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Event } from '@/types'

/**
 * Events + RSVP data layer (Phase 2 Part B, STEP 9). Attendee lists subscribe
 * to Postgres realtime so the avatar stack updates as people RSVP.
 */

interface EventSpot {
  id: string
  name: string
  neighbourhood: string | null
  cover_gradient: string | null
  type: string
  address?: string | null
}

export interface EventWithSpot extends Event {
  spot: EventSpot | null
}

const EVENT_COLUMNS =
  '*, spot:spots(id, name, neighbourhood, cover_gradient, type, address)'

/** All events, soonest first. */
export function useEvents() {
  return useQuery<EventWithSpot[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(EVENT_COLUMNS)
        .order('event_date', { ascending: true })
      if (error) throw error
      return (data as EventWithSpot[]) ?? []
    },
  })
}

/** A single event by id. */
export function useEvent(id: string | undefined) {
  return useQuery<EventWithSpot | null>({
    queryKey: ['event', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(EVENT_COLUMNS)
        .eq('id', id!)
        .maybeSingle()
      if (error) throw error
      return (data as EventWithSpot | null) ?? null
    },
  })
}

export interface RsvpEntry {
  user_id: string
  display_name: string | null
}

/** Attendees for an event (realtime). */
export function useEventRsvps(eventId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery<RsvpEntry[]>({
    queryKey: ['rsvps', eventId],
    enabled: Boolean(eventId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rsvps')
        .select('user_id, profile:profiles(display_name)')
        .eq('event_id', eventId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (
        (data as unknown as {
          user_id: string
          profile: { display_name: string | null } | null
        }[]) ?? []
      ).map((r) => ({
        user_id: r.user_id,
        display_name: r.profile?.display_name ?? null,
      }))
    },
  })

  useEffect(() => {
    if (!eventId) return
    const channel = supabase
      .channel(`rsvps:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rsvps',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['rsvps', eventId] })
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  return query
}

/** RSVP counts across a set of events, for the list cards. */
export function useRsvpCounts(eventIds: string[]) {
  const key = [...eventIds].sort().join(',')
  return useQuery<Record<string, number>>({
    queryKey: ['rsvps', 'counts', key],
    enabled: eventIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rsvps')
        .select('event_id')
        .in('event_id', eventIds)
      if (error) throw error
      const counts: Record<string, number> = {}
      for (const row of (data as { event_id: string }[]) ?? []) {
        counts[row.event_id] = (counts[row.event_id] ?? 0) + 1
      }
      return counts
    },
  })
}

/** Insert an RSVP for the current user. */
export function useRsvpMutation() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error('You need to be signed in to RSVP.')
      const { error } = await supabase
        .from('rsvps')
        .insert({ user_id: user.id, event_id: eventId })
      if (error) throw error
    },
    onSuccess: (_data, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['rsvps', eventId] })
      queryClient.invalidateQueries({ queryKey: ['rsvps', 'counts'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
