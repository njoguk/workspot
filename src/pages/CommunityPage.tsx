import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { COMMUNITY } from '@/config/platform'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useReactions, type ReactionState } from '@/hooks/useReaction'
import { useCommentCounts } from '@/hooks/useComments'
import { useCheckInMutations } from '@/hooks/useCheckins'
import {
  useGroups,
  useMyGroupIds,
  useGroupMemberIds,
  useGroupMembership,
  suggestedGroupIds,
  type Group,
} from '@/hooks/useGroups'
import {
  useActivityFeed,
  usePeople,
  type FeedItem,
  type Person,
} from '@/hooks/useCommunity'
import {
  useGroupTips,
  useReviewTips,
  tipAccentVar,
  type TipCard,
} from '@/hooks/useTips'
import { useUserBadges } from '@/hooks/useUserBadges'
import { CommentPanel } from '@/components/community/CommentPanel'
import { CreateGroupSheet } from '@/components/community/CreateGroupSheet'
import { AddTipSheet } from '@/components/tips/AddTipSheet'
import { Avatar } from '@/components/ui/Avatar'
import { BadgeTag } from '@/components/ui/BadgeTag'
import { Skeleton } from '@/components/ui/Skeleton'
import { spotTypeLabel } from '@/lib/spot-format'
import { timeAgo } from '@/lib/time'
import { cn } from '@/lib/utils'
import type { SignatureBadge } from '@/lib/badges'
import type { ProfileRole } from '@/types'

type Tab = 'activity' | 'tips' | 'people'

const TABS: { key: Tab; label: string }[] = [
  { key: 'activity', label: 'Activity' },
  { key: 'tips', label: 'Tips' },
  { key: 'people', label: 'People' },
]

const ROLE_LABEL: Record<ProfileRole, string> = {
  freelancer: 'Freelancer',
  remote_employee: 'Remote',
  founder: 'Founder',
  nomad: 'Nomad',
}

const KIND_LABEL: Record<Group['kind'], string> = {
  neighbourhood: 'Neighbourhood',
  interest: 'Interest',
  custom: 'Group',
}

export default function CommunityPage() {
  const { profile } = useAuth()
  const { showToast } = useToast()
  const { data: groups, isLoading: groupsLoading } = useGroups()
  const { data: myGroupIds } = useMyGroupIds()
  const { join, leave } = useGroupMembership()

  const [tab, setTab] = useState<Tab>('activity')
  const [selectedSlug, setSelectedSlug] = useState<string>(COMMUNITY.defaultGroupSlug)
  const [createOpen, setCreateOpen] = useState(false)

  const joined = myGroupIds ?? new Set<string>()
  const suggested = useMemo(
    () => (groups ? suggestedGroupIds(groups, joined, profile) : new Set<string>()),
    [groups, joined, profile],
  )

  const activeGroup = useMemo<Group | undefined>(() => {
    if (!groups || groups.length === 0) return undefined
    return (
      groups.find((g) => g.slug === selectedSlug) ??
      groups.find((g) => g.is_default) ??
      groups[0]
    )
  }, [groups, selectedSlug])

  const scoped = Boolean(activeGroup && !activeGroup.is_default)
  const memberIdsQuery = useGroupMemberIds(scoped ? activeGroup!.id : undefined)
  const scopeReady = !scoped || !memberIdsQuery.isLoading
  const memberIds = scoped ? memberIdsQuery.data ?? [] : null

  // Selector order: default first, then joined, suggested, and the rest.
  const orderedGroups = useMemo(() => {
    if (!groups) return []
    const rank = (g: Group) =>
      g.is_default ? 0 : joined.has(g.id) ? 1 : suggested.has(g.id) ? 2 : 3
    return [...groups].sort((a, b) => rank(a) - rank(b))
  }, [groups, joined, suggested])

  async function toggleMembership(group: Group) {
    try {
      if (joined.has(group.id)) {
        await leave.mutateAsync(group.id)
        showToast(`Left ${group.name}`, { icon: '👋' })
      } else {
        await join.mutateAsync(group.id)
        showToast(`Joined ${group.name}`, { icon: '🎉' })
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Something went wrong.', {
        icon: '⚠️',
      })
    }
  }

  return (
    <div className="py-6">
      <header className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
            Community
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-text">
            {COMMUNITY.groupsLabel}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex h-10 min-h-[44px] items-center gap-1.5 rounded-pill border border-border-strong px-4 font-sans text-sm font-semibold text-text transition-colors duration-fast hover:border-primary hover:text-primary"
        >
          <Plus size={16} /> New
        </button>
      </header>

      {/* Group selector */}
      {groupsLoading ? (
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 shrink-0 rounded-pill" />
          ))}
        </div>
      ) : (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {orderedGroups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedSlug(g.slug)}
              aria-pressed={activeGroup?.id === g.id}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill border px-3.5 py-2 font-sans text-sm font-medium transition-colors duration-fast',
                activeGroup?.id === g.id
                  ? 'border-dark bg-dark text-inverse'
                  : 'border-border-strong text-muted hover:border-primary hover:text-primary',
              )}
            >
              {joined.has(g.id) && (
                <span
                  className="h-1.5 w-1.5 rounded-full bg-success"
                  aria-hidden="true"
                />
              )}
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* Group hero */}
      {activeGroup && (
        <GroupHero
          group={activeGroup}
          joined={joined.has(activeGroup.id)}
          busy={join.isPending || leave.isPending}
          onToggle={() => toggleMembership(activeGroup)}
        />
      )}

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Community sections"
        className="mt-6 grid grid-cols-3 gap-1 rounded-pill bg-surface-alt p-1"
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'h-10 min-h-[44px] rounded-pill font-sans text-sm font-semibold transition-colors duration-fast',
              tab === t.key ? 'bg-dark text-inverse shadow-sm' : 'text-muted hover:text-text',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {!scopeReady ? (
          <ListSkeleton />
        ) : (
          <>
            {tab === 'activity' && <ActivityTab memberIds={memberIds} />}
            {tab === 'tips' && <TipsTab group={activeGroup} memberIds={memberIds} />}
            {tab === 'people' && <PeopleTab memberIds={memberIds} />}
          </>
        )}
      </div>

      <CreateGroupSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(g) => setSelectedSlug(g.slug)}
      />
    </div>
  )
}

// ── Group hero ─────────────────────────────────────────────────

function GroupHero({
  group,
  joined,
  busy,
  onToggle,
}: {
  group: Group
  joined: boolean
  busy: boolean
  onToggle: () => void
}) {
  return (
    <section
      className="relative mt-4 overflow-hidden rounded-xl p-6 md:p-8"
      style={{
        background:
          group.cover_gradient ??
          'linear-gradient(135deg, color-mix(in srgb, var(--color-success) 92%, black) 0%, var(--color-dark) 100%)',
      }}
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-secondary">
        {KIND_LABEL[group.kind]}
        {group.visibility === 'private' ? ' · Private' : ''}
      </p>
      <h2 className="mt-2 font-display text-3xl font-bold text-inverse md:text-4xl">
        {group.name}
      </h2>
      {group.description && (
        <p
          className="mt-1 max-w-xl font-sans text-sm"
          style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 72%, transparent)' }}
        >
          {group.description}
        </p>
      )}
      <div className="mt-5 flex items-center gap-4">
        <span
          className="font-mono text-xs"
          style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 65%, transparent)' }}
        >
          {group.member_count} member{group.member_count === 1 ? '' : 's'}
        </span>
        <button
          type="button"
          onClick={onToggle}
          disabled={busy}
          className={cn(
            'inline-flex h-10 min-h-[44px] items-center rounded-pill px-5 font-sans text-sm font-semibold transition-opacity duration-fast hover:opacity-90 disabled:opacity-60',
            joined ? 'text-inverse' : 'bg-secondary text-dark',
          )}
          style={
            joined
              ? { border: '1px solid color-mix(in srgb, var(--color-text-inverse) 35%, transparent)' }
              : undefined
          }
        >
          {joined ? 'Joined ✓' : 'Join →'}
        </button>
      </div>
    </section>
  )
}

// ── Activity ───────────────────────────────────────────────────

function ActivityTab({ memberIds }: { memberIds: string[] | null }) {
  const { data, isLoading, isError } = useActivityFeed(memberIds)

  const items = data ?? []
  const checkinIds = items.filter((i) => i.kind === 'checkin').map((i) => i.rawId)
  const reviewIds = items.filter((i) => i.kind === 'review').map((i) => i.rawId)

  const checkinReactions = useReactions('checkin', checkinIds, 'like')
  const reviewReactions = useReactions('review', reviewIds, 'like')
  const { data: checkinCounts } = useCommentCounts('checkin', checkinIds)
  const { data: reviewCounts } = useCommentCounts('review', reviewIds)
  const { data: badges } = useUserBadges(items.map((i) => i.userId))

  if (isLoading) return <ListSkeleton />
  if (isError) return <ErrorState label="Couldn’t load the activity feed." />
  if (items.length === 0)
    return (
      <EmptyState
        title="Nothing here yet"
        body="Check in or leave a review to start the conversation."
      />
    )

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const isCheckin = item.kind === 'checkin'
        const reactions = isCheckin ? checkinReactions : reviewReactions
        const counts = isCheckin ? checkinCounts : reviewCounts
        return (
          <FeedRow
            key={item.id}
            item={item}
            badge={badges?.[item.userId]?.[0]}
            reaction={reactions.stateFor(item.rawId)}
            onReact={() => reactions.toggle(item.rawId)}
            commentCount={counts?.[item.rawId] ?? 0}
          />
        )
      })}
    </ul>
  )
}

function FeedRow({
  item,
  badge,
  reaction,
  onReact,
  commentCount,
}: {
  item: FeedItem
  badge?: SignatureBadge
  reaction: ReactionState
  onReact: () => void
  commentCount: number
}) {
  const { isLoggedIn } = useAuth()
  const { checkIn } = useCheckInMutations()
  const { showToast } = useToast()
  const [commentsOpen, setCommentsOpen] = useState(false)

  async function goingToo() {
    if (!item.spotId) return
    try {
      await checkIn.mutateAsync(item.spotId)
      showToast(`You're going to ${item.spotName ?? 'the spot'}`, { icon: '📍' })
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not check in.', {
        icon: '⚠️',
      })
    }
  }

  return (
    <li className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <Avatar name={item.userName} seed={item.userId} size={40} />
        <div className="min-w-0 flex-1">
          <p className="font-sans text-sm text-text">
            <span className="font-semibold">{item.userName ?? 'A member'}</span>
            {badge && <BadgeTag badge={badge} className="ml-1.5 align-middle" />}{' '}
            <span className="text-muted">{item.action}</span>{' '}
            {item.spotId && item.spotName && (
              <Link
                to={`/spot/${item.spotId}`}
                className="rounded-pill bg-surface-alt px-2 py-0.5 font-mono text-[11px] text-text hover:text-primary"
              >
                {item.spotName}
              </Link>
            )}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-light">
            {[
              timeAgo(item.createdAt),
              item.spotNeighbourhood,
              item.spotType ? spotTypeLabel(item.spotType) : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>

          {item.note && (
            <p className="mt-2 border-l-2 border-border-strong pl-3 font-sans text-sm italic leading-relaxed text-muted">
              &ldquo;{item.note}&rdquo;
            </p>
          )}

          {item.quickTags.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {item.quickTags.slice(0, 4).map((t) => (
                <li
                  key={t}
                  className="rounded-pill bg-surface-alt px-2 py-0.5 font-sans text-[11px] text-muted"
                >
                  {t}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex items-center gap-4">
            <button
              type="button"
              onClick={onReact}
              aria-pressed={reaction.active}
              className={cn(
                'flex min-h-[36px] items-center gap-1.5 font-mono text-xs transition-colors duration-fast',
                reaction.active ? 'text-primary' : 'text-muted hover:text-text',
              )}
            >
              👍 {reaction.count}
            </button>
            <button
              type="button"
              onClick={() => setCommentsOpen((o) => !o)}
              aria-expanded={commentsOpen}
              className={cn(
                'flex min-h-[36px] items-center gap-1.5 font-mono text-xs transition-colors duration-fast',
                commentsOpen ? 'text-primary' : 'text-muted hover:text-text',
              )}
            >
              💬 {commentCount}
            </button>
            {isLoggedIn && item.kind === 'checkin' && item.spotId && (
              <button
                type="button"
                onClick={goingToo}
                disabled={checkIn.isPending}
                className="ml-auto inline-flex min-h-[36px] items-center rounded-pill border border-border-strong px-3 font-sans text-xs font-medium text-muted transition-colors duration-fast hover:border-primary hover:text-primary disabled:opacity-50"
              >
                📍 Going too
              </button>
            )}
          </div>

          {commentsOpen && <CommentPanel targetType={item.kind} targetId={item.rawId} />}
        </div>
      </div>
    </li>
  )
}

// ── Tips ───────────────────────────────────────────────────────

function TipsTab({
  group,
  memberIds,
}: {
  group: Group | undefined
  memberIds: string[] | null
}) {
  const { isLoggedIn } = useAuth()
  const groupTips = useGroupTips(group?.id)
  const reviewTips = useReviewTips(memberIds)
  const [addOpen, setAddOpen] = useState(false)

  // Merge first-class group tips with review-derived tips, newest first.
  const tips = useMemo(() => {
    const merged = [...(groupTips.data ?? []), ...(reviewTips.data ?? [])]
    return merged.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [groupTips.data, reviewTips.data])

  const firstClassIds = tips.filter((t) => t.targetType === 'tip').map((t) => t.id)
  const reviewIds = tips.filter((t) => t.targetType === 'review').map((t) => t.id)
  const tipReactions = useReactions('tip', firstClassIds, 'helpful')
  const reviewReactions = useReactions('review', reviewIds, 'helpful')
  const { data: tipCounts } = useCommentCounts('tip', firstClassIds)
  const { data: reviewCounts } = useCommentCounts('review', reviewIds)
  const { data: badges } = useUserBadges(tips.map((t) => t.userId))

  const isLoading = groupTips.isLoading || reviewTips.isLoading
  const isError = groupTips.isError || reviewTips.isError

  return (
    <div>
      {isLoggedIn && group && (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-pill border border-border-strong px-4 font-sans text-sm font-semibold text-text transition-colors duration-fast hover:border-primary hover:text-primary"
          >
            <Plus size={16} /> Add a tip
          </button>
        </div>
      )}

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState label="Couldn’t load tips." />
      ) : tips.length === 0 ? (
        <EmptyState
          title="No tips yet"
          body={
            isLoggedIn
              ? 'Be the first to add a tip for this group.'
              : 'Tips shared in this group show up here.'
          }
        />
      ) : (
        <ul className="space-y-3">
          {tips.map((tip) => {
            const isFirstClass = tip.targetType === 'tip'
            const reactions = isFirstClass ? tipReactions : reviewReactions
            const counts = isFirstClass ? tipCounts : reviewCounts
            return (
              <TipRow
                key={`${tip.targetType}-${tip.id}`}
                tip={tip}
                badge={badges?.[tip.userId]?.[0]}
                reaction={reactions.stateFor(tip.id)}
                onReact={() => reactions.toggle(tip.id)}
                commentCount={counts?.[tip.id] ?? 0}
              />
            )
          })}
        </ul>
      )}

      {group && (
        <AddTipSheet
          open={addOpen}
          onClose={() => setAddOpen(false)}
          groupId={group.id}
          targetLabel={group.name}
          onAdded={() => groupTips.refetch()}
        />
      )}
    </div>
  )
}

function TipRow({
  tip,
  badge,
  reaction,
  onReact,
  commentCount,
}: {
  tip: TipCard
  badge?: SignatureBadge
  reaction: ReactionState
  onReact: () => void
  commentCount: number
}) {
  const accent = tipAccentVar(tip.tagLabel)
  const [commentsOpen, setCommentsOpen] = useState(false)

  return (
    <li
      className="rounded-lg border border-border bg-surface p-4"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={tip.userName} seed={tip.userId} size={32} />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-sans text-sm font-semibold text-text">
              <span className="truncate">{tip.userName ?? 'A member'}</span>
              {badge && <BadgeTag badge={badge} />}
            </p>
            {tip.spotId && tip.spotName && (
              <Link
                to={`/spot/${tip.spotId}`}
                className="font-mono text-[11px] text-muted hover:text-primary"
              >
                {tip.spotName}
              </Link>
            )}
          </div>
        </div>
        <span
          className="shrink-0 rounded-pill px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide"
          style={{ color: accent, background: `color-mix(in srgb, ${accent} 14%, transparent)` }}
        >
          {tip.tagLabel}
        </span>
      </div>

      <p className="mt-3 font-sans text-sm leading-relaxed text-text">{tip.body}</p>

      <div className="mt-3 flex items-center gap-4">
        <button
          type="button"
          onClick={onReact}
          aria-pressed={reaction.active}
          className={cn(
            'inline-flex min-h-[36px] items-center gap-1.5 font-mono text-xs transition-colors duration-fast',
            reaction.active ? 'text-primary' : 'text-muted hover:text-text',
          )}
        >
          ▲ {reaction.count} helpful
        </button>
        <button
          type="button"
          onClick={() => setCommentsOpen((o) => !o)}
          aria-expanded={commentsOpen}
          className={cn(
            'inline-flex min-h-[36px] items-center gap-1.5 font-mono text-xs transition-colors duration-fast',
            commentsOpen ? 'text-primary' : 'text-muted hover:text-text',
          )}
        >
          💬 {commentCount}
        </button>
      </div>

      {commentsOpen && <CommentPanel targetType={tip.targetType} targetId={tip.id} />}
    </li>
  )
}

// ── People ─────────────────────────────────────────────────────

function PeopleTab({ memberIds }: { memberIds: string[] | null }) {
  const { data, isLoading, isError } = usePeople(memberIds)
  const { data: badges } = useUserBadges((data ?? []).map((p) => p.id))

  if (isLoading)
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-lg" />
        ))}
      </div>
    )
  if (isError) return <ErrorState label="Couldn’t load members." />
  if (!data || data.length === 0)
    return (
      <EmptyState title="No members yet" body="People who join show up here." />
    )

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {data.map((person) => (
        <PersonCard key={person.id} person={person} badge={badges?.[person.id]?.[0]} />
      ))}
    </div>
  )
}

function PersonCard({ person, badge }: { person: Person; badge?: SignatureBadge }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-border bg-surface p-5 text-center">
      <Avatar name={person.display_name} seed={person.id} size={56} />
      <p className="mt-3 truncate font-sans text-sm font-semibold text-text">
        {person.display_name ?? 'Member'}
      </p>
      {person.role && (
        <span className="mt-1 rounded-pill bg-surface-alt px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
          {ROLE_LABEL[person.role]}
        </span>
      )}
      {badge && <BadgeTag badge={badge} className="mt-2" />}
      <p className="mt-2 font-mono text-xs text-secondary">
        🔥 {person.check_in_streak} day{person.check_in_streak === 1 ? '' : 's'}
      </p>
    </div>
  )
}

// ── Shared states ──────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg bg-surface py-16 text-center"
    >
      <p className="font-display text-xl font-bold text-text">{title}</p>
      <p className="mt-2 font-sans text-sm text-muted">{body}</p>
    </motion.div>
  )
}

function ErrorState({ label }: { label: string }) {
  return (
    <div className="rounded-lg bg-surface py-16 text-center">
      <p className="font-display text-lg font-bold text-text">Something went wrong</p>
      <p className="mt-2 font-sans text-sm text-muted">{label}</p>
    </div>
  )
}
