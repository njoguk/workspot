import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthError, Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

/** Result shape returned by the auth actions so pages can show inline errors. */
interface AuthActionResult {
  error: AuthError | null
}

interface SignUpParams {
  firstName: string
  lastName: string
  email: string
  password: string
  /** 'member' (find spaces) or 'partner' (list a space). */
  accountType?: 'member' | 'partner'
}

interface AuthContextValue {
  session: Session | null
  user: User | null
  /** The user's row from the `profiles` table (null until loaded / signed out). */
  profile: Profile | null
  /** True until the initial session check resolves. */
  loading: boolean
  isLoggedIn: boolean
  displayName: string | null
  /** 1–2 letter initials for the avatar chip. */
  initials: string
  /** Re-fetch the current user's profiles row (after onboarding / edits). */
  refreshProfile: () => Promise<void>
  signIn: (email: string, password: string) => Promise<AuthActionResult>
  signUp: (params: SignUpParams) => Promise<AuthActionResult>
  signInWithGoogle: () => Promise<AuthActionResult>
  resetPassword: (email: string) => Promise<AuthActionResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * Wraps the app and owns all Supabase auth state. Session lifecycle is driven
 * by supabase.auth.onAuthStateChange; the matching `profiles` row is fetched
 * whenever the signed-in user changes. Spec: Phase 2 STEP 3.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Initial session load + live subscription to auth changes.
  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const user = session?.user ?? null
  const userId = user?.id

  // Fetch (or re-fetch) the profiles row for the current user.
  const loadProfile = useCallback(async (): Promise<void> => {
    if (!userId) {
      setProfile(null)
      return
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (error) {
      // A missing profile is not fatal — the signup trigger may still be
      // catching up. Surface it in dev without breaking the app.
      console.warn('[auth] Could not load profile:', error.message)
      setProfile(null)
      return
    }
    setProfile((data as Profile | null) ?? null)
  }, [userId])

  // Fetch the profile row for the current user. Runs on sign-in / user change.
  useEffect(() => {
    let active = true
    ;(async () => {
      if (!userId) {
        setProfile(null)
        return
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (!active) return
      if (error) {
        console.warn('[auth] Could not load profile:', error.message)
        setProfile(null)
        return
      }
      setProfile((data as Profile | null) ?? null)
    })()
    return () => {
      active = false
    }
  }, [userId])

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthActionResult> => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error }
    },
    [],
  )

  const signUp = useCallback(
    async ({
      firstName,
      lastName,
      email,
      password,
      accountType = 'member',
    }: SignUpParams): Promise<AuthActionResult> => {
      const fullName = `${firstName} ${lastName}`.trim()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Consumed by the handle_new_user() trigger (docs/SCHEMA.md) to
          // populate profiles.display_name + account_type.
          data: {
            full_name: fullName,
            first_name: firstName,
            last_name: lastName,
            account_type: accountType,
          },
        },
      })
      return { error }
    },
    [],
  )

  const signInWithGoogle = useCallback(async (): Promise<AuthActionResult> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    return { error }
  }, [])

  const resetPassword = useCallback(
    async (email: string): Promise<AuthActionResult> => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      })
      return { error }
    },
    [],
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const displayName =
    profile?.display_name ??
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email ??
    null

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      loading,
      isLoggedIn: Boolean(user),
      displayName,
      initials: displayName ? initialsFrom(displayName) : '',
      refreshProfile: loadProfile,
      signIn,
      signUp,
      signInWithGoogle,
      resetPassword,
      signOut,
    }),
    [
      session,
      user,
      profile,
      loading,
      displayName,
      loadProfile,
      signIn,
      signUp,
      signInWithGoogle,
      resetPassword,
      signOut,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Read auth state + actions. Must be used within <AuthProvider>. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>')
  }
  return ctx
}

function initialsFrom(name: string): string {
  const base = name.includes('@') ? name.split('@')[0] : name
  const parts = base.split(/[\s._-]+/).filter(Boolean)
  const letters = parts.length >= 2 ? [parts[0][0], parts[1][0]] : [base[0] ?? '']
  return letters.join('').toUpperCase()
}
