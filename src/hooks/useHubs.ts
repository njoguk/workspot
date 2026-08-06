import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Hubs & branches (feedback round, Phase 5). A hub is one physical place holding
 * several distinct spots; branches are hubs that share a `brand`. All reads
 * degrade gracefully to null/[] until `docs/hubs-migration.sql` is applied, so
 * the rest of the app is unaffected by the pending migration.
 */

export interface Hub {
  id: string
  name: string
  brand: string | null
  neighbourhood: string | null
  address: string | null
  description: string | null
  coverGradient: string | null
  createdBy: string | null
  createdAt: string
}

interface HubRow {
  id: string
  name: string
  brand: string | null
  neighbourhood: string | null
  address: string | null
  description: string | null
  cover_gradient: string | null
  created_by: string | null
  created_at: string
}

const HUB_COLUMNS =
  'id, name, brand, neighbourhood, address, description, cover_gradient, created_by, created_at'

function mapHub(row: HubRow): Hub {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    neighbourhood: row.neighbourhood,
    address: row.address,
    description: row.description,
    coverGradient: row.cover_gradient,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}

/** Missing table (migration pending). */
function isMissingHubs(error: { code?: string } | null): boolean {
  return error?.code === '42P01' || error?.code === '42703'
}

/** A single hub by id, or null (also null before the migration is applied). */
export function useHub(id: string | undefined) {
  return useQuery<Hub | null>({
    queryKey: ['hub', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hubs')
        .select(HUB_COLUMNS)
        .eq('id', id!)
        .maybeSingle()
      if (error) {
        if (isMissingHubs(error)) return null
        throw error
      }
      return data ? mapHub(data as HubRow) : null
    },
  })
}

/** All hubs (for the add-spot attach selector). */
export function useHubs() {
  return useQuery<Hub[]>({
    queryKey: ['hubs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hubs')
        .select(HUB_COLUMNS)
        .order('name', { ascending: true })
      if (error) {
        if (isMissingHubs(error)) return []
        throw error
      }
      return (data as HubRow[]).map(mapHub)
    },
  })
}

/** Other hubs sharing a brand (the "branches" of this hub). */
export function useHubBranches(brand: string | null | undefined, excludeHubId: string | undefined) {
  return useQuery<Hub[]>({
    queryKey: ['hubs', 'branches', brand, excludeHubId],
    enabled: Boolean(brand),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hubs')
        .select(HUB_COLUMNS)
        .eq('brand', brand!)
        .order('name', { ascending: true })
      if (error) {
        if (isMissingHubs(error)) return []
        throw error
      }
      return (data as HubRow[]).map(mapHub).filter((h) => h.id !== excludeHubId)
    },
  })
}

/** The hub a spot belongs to (id + name + brand), or null. Graceful pre-migration. */
export interface SpotHub {
  id: string
  name: string
  brand: string | null
}

export function useSpotHub(spotId: string | undefined) {
  return useQuery<SpotHub | null>({
    queryKey: ['spot', 'hub', spotId],
    enabled: Boolean(spotId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spots')
        .select('hub_id, hub:hubs(id, name, brand)')
        .eq('id', spotId!)
        .maybeSingle()
      if (error) {
        if (isMissingHubs(error)) return null
        throw error
      }
      const row = data as unknown as {
        hub: { id: string; name: string; brand: string | null } | null
      } | null
      return row?.hub ?? null
    },
  })
}

export interface CreateHubInput {
  name: string
  brand?: string | null
  neighbourhood?: string | null
}

/** Create a hub owned by the signed-in user; returns its id. */
export function useCreateHub() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation<string, Error, CreateHubInput>({
    mutationFn: async ({ name, brand, neighbourhood }) => {
      if (!user) throw new Error('Sign in to create a hub.')
      const trimmed = name.trim()
      if (!trimmed) throw new Error('Hub name is required.')
      const { data, error } = await supabase
        .from('hubs')
        .insert({
          name: trimmed,
          brand: brand?.trim() || null,
          neighbourhood: neighbourhood?.trim() || null,
          created_by: user.id,
        })
        .select('id')
        .single()
      if (error) {
        if (isMissingHubs(error)) {
          throw new Error('Hubs aren’t enabled yet. Run the hubs migration in Supabase.')
        }
        throw error
      }
      return (data as { id: string }).id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hubs'] })
    },
  })
}
