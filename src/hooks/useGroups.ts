import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { hashString } from '@/lib/avatar'

/**
 * Groups data layer (Community v2, Phase C1). Groups are the container for the
 * community — a seeded default "everyone" room, seeded neighbourhood/interest
 * groups, and user-created groups. See docs/community-migration.sql.
 */

export type GroupKind = 'neighbourhood' | 'interest' | 'custom'
export type GroupVisibility = 'public' | 'private'

export interface Group {
  id: string
  slug: string
  name: string
  description: string | null
  cover_gradient: string | null
  kind: GroupKind
  neighbourhood: string | null
  interest_tag: string | null
  visibility: GroupVisibility
  created_by: string | null
  member_count: number
  is_default: boolean
  created_at: string
}

const GROUP_COLUMNS =
  'id, slug, name, description, cover_gradient, kind, neighbourhood, interest_tag, visibility, created_by, member_count, is_default, created_at'

/** Token-based gradients for user-created groups (no hardcoded hexes). */
const GROUP_GRADIENTS = [
  'linear-gradient(135deg, var(--color-primary) 0%, var(--color-dark) 100%)',
  'linear-gradient(135deg, color-mix(in srgb, var(--color-info) 80%, black) 0%, var(--color-dark) 100%)',
  'linear-gradient(135deg, color-mix(in srgb, var(--color-success) 85%, black) 0%, var(--color-dark) 100%)',
  'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-dark) 100%)',
  'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
]

/** All groups the current user is allowed to see (RLS filters private ones). */
export function useGroups() {
  return useQuery<Group[]>({
    queryKey: ['groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select(GROUP_COLUMNS)
        .order('is_default', { ascending: false })
        .order('member_count', { ascending: false })
        .order('name', { ascending: true })
      if (error) throw error
      return (data as Group[]) ?? []
    },
  })
}

/** Set of group ids the current user has joined. */
export function useMyGroupIds() {
  const { user } = useAuth()
  return useQuery<Set<string>>({
    queryKey: ['group-members', 'me', user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user!.id)
      if (error) throw error
      return new Set((data as { group_id: string }[] | null)?.map((r) => r.group_id) ?? [])
    },
  })
}

/** Member user-ids for a group — used to scope the group's activity feed. */
export function useGroupMemberIds(groupId: string | undefined) {
  return useQuery<string[]>({
    queryKey: ['group-members', 'group', groupId],
    enabled: Boolean(groupId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId!)
      if (error) throw error
      return (data as { user_id: string }[] | null)?.map((r) => r.user_id) ?? []
    },
  })
}

/** Join / leave the current user on a group. */
export function useGroupMembership() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  function invalidate(groupId: string) {
    queryClient.invalidateQueries({ queryKey: ['groups'] })
    queryClient.invalidateQueries({ queryKey: ['group-members', 'me', user?.id] })
    queryClient.invalidateQueries({ queryKey: ['group-members', 'group', groupId] })
  }

  const join = useMutation({
    mutationFn: async (groupId: string) => {
      if (!user) throw new Error('Sign in to join a group.')
      const { error } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: user.id, role: 'member' })
      if (error) throw error
    },
    onSuccess: (_d, groupId) => invalidate(groupId),
  })

  const leave = useMutation({
    mutationFn: async (groupId: string) => {
      if (!user) throw new Error('Sign in first.')
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id)
      if (error) throw error
    },
    onSuccess: (_d, groupId) => invalidate(groupId),
  })

  return { join, leave }
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base || 'group'}-${suffix}`
}

export interface CreateGroupInput {
  name: string
  description: string
  visibility: GroupVisibility
}

/** Create a new custom group; the DB trigger adds the creator as admin. */
export function useCreateGroup() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation<Group, Error, CreateGroupInput>({
    mutationFn: async ({ name, description, visibility }) => {
      if (!user) throw new Error('Sign in to create a group.')
      const slug = slugify(name)
      const cover_gradient = GROUP_GRADIENTS[hashString(slug) % GROUP_GRADIENTS.length]
      const { data, error } = await supabase
        .from('groups')
        .insert({
          slug,
          name: name.trim(),
          description: description.trim() || null,
          visibility,
          kind: 'custom',
          cover_gradient,
          created_by: user.id,
        })
        .select(GROUP_COLUMNS)
        .single()
      if (error) throw error
      return data as Group
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['group-members', 'me', user?.id] })
    },
  })
}

/**
 * Groups suggested from the user's onboarding profile — neighbourhood groups in
 * their neighbourhoods, and interest groups matching their role — that they
 * haven't joined yet. Pure client-side derivation over already-loaded data.
 */
export function suggestedGroupIds(
  groups: Group[],
  joined: Set<string>,
  profile: { role: string | null; neighbourhoods: string[] | null } | null,
): Set<string> {
  const out = new Set<string>()
  if (!profile) return out
  const hoods = new Set(profile.neighbourhoods ?? [])
  const roleTag: Record<string, string> = {
    founder: 'Founder/Entrepreneur',
    nomad: 'Digital Nomad',
  }
  for (const g of groups) {
    if (joined.has(g.id) || g.is_default) continue
    if (g.kind === 'neighbourhood' && g.neighbourhood && hoods.has(g.neighbourhood)) {
      out.add(g.id)
    }
    if (
      g.kind === 'interest' &&
      profile.role &&
      g.interest_tag === roleTag[profile.role]
    ) {
      out.add(g.id)
    }
  }
  return out
}
