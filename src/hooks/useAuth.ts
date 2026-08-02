import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

const SESSION_KEY = ['auth', 'session'] as const

/**
 * Reads the current Supabase auth session via React Query and keeps it in
 * sync with Supabase's onAuthStateChange stream. Components read `isLoggedIn`
 * / `initials` to decide what to render (e.g. the TopNav avatar).
 */
export function useAuth() {
  const queryClient = useQueryClient()

  const { data: session, isLoading } = useQuery<Session | null>({
    queryKey: SESSION_KEY,
    queryFn: async () => {
      const { data } = await supabase.auth.getSession()
      return data.session
    },
    staleTime: Infinity,
  })

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      queryClient.setQueryData(SESSION_KEY, nextSession)
    })
    return () => subscription.unsubscribe()
  }, [queryClient])

  const user = session?.user ?? null
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email ??
    null

  return {
    session: session ?? null,
    user,
    isLoggedIn: Boolean(user),
    isLoading,
    displayName,
    initials: displayName ? initialsFrom(displayName) : '',
  }
}

function initialsFrom(name: string): string {
  const base = name.includes('@') ? name.split('@')[0] : name
  const parts = base.split(/[\s._-]+/).filter(Boolean)
  const letters = parts.length >= 2 ? [parts[0][0], parts[1][0]] : [base[0]]
  return letters.join('').toUpperCase()
}
