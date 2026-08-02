import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client. Credentials come from Vite environment variables
 * (see .env.local / .env.example). Never hardcode keys here.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Surfaced in dev so a missing .env.local is obvious, without crashing
  // the app during Phase 1 (which is mock-data only).
  console.warn(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Add them to .env.local — see .env.example.',
  )
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
