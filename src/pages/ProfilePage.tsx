import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  useProfileStats,
  useLastCheckin,
  useRecentSpots,
  useBadgeData,
  type RecentSpot,
} from '@/hooks/useProfile'
import { Avatar } from '@/components/ui/Avatar'
import { QualityScoreBadge } from '@/components/ui/QualityScoreBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { PastCheckIns } from '@/components/checkin/PastCheckIns'
import { deriveBadges } from '@/lib/badges'
import { timeAgo } from '@/lib/time'
import {
  milestoneReached,
  nextMilestone,
  hasSeenMilestone,
  markMilestoneSeen,
} from '@/lib/milestones'
import type { ProfileRole } from '@/types'

const ROLE_LABEL: Record<ProfileRole, string> = {
  freelancer: 'Freelancer',
  remote_employee: 'Remote Employee',
  founder: 'Founder',
  nomad: 'Digital Nomad',
}

export default function ProfilePage() {
  const { user, profile, displayName } = useAuth()
  const userId = user?.id

  const stats = useProfileStats(userId)
  const lastCheckin = useLastCheckin(userId)
  const recentSpots = useRecentSpots(userId)
  const badgeData = useBadgeData(userId)

  const streak = profile?.check_in_streak ?? 0
  const longest = profile?.longest_streak ?? 0

  // One-time milestone celebration.
  const [milestone, setMilestone] = useState<number | null>(null)
  useEffect(() => {
    const reached = milestoneReached(streak)
    if (reached && !hasSeenMilestone(reached)) setMilestone(reached)
  }, [streak])

  function dismissMilestone() {
    if (milestone) markMilestoneSeen(milestone)
    setMilestone(null)
  }

  const badges = deriveBadges({
    gardenCheckins: badgeData.data?.gardenCheckins ?? 0,
    wifiTests: badgeData.data?.wifiTests ?? 0,
    eventsAttended: badgeData.data?.eventsAttended ?? 0,
    distinctHoods: badgeData.data?.distinctHoods ?? 0,
    reviewCount: badgeData.data?.reviewCount ?? 0,
    longestStreak: longest,
  })

  return (
    <div className="pb-16">
      {/* Header */}
      <section className="full-bleed bg-dark px-4 py-8 md:px-10 md:py-10 lg:px-[60px]">
        <div className="mx-auto flex max-w-content items-center gap-4">
          <Avatar name={displayName} seed={userId ?? displayName ?? 'me'} size={72} />
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-bold text-inverse">
              {displayName ?? 'Your profile'}
            </h1>
            {profile?.handle && (
              <p
                className="font-mono text-sm"
                style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 60%, transparent)' }}
              >
                @{profile.handle}
              </p>
            )}
            {profile?.role && (
              <span className="mt-2 inline-block rounded-pill bg-primary px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-wide text-inverse">
                {ROLE_LABEL[profile.role]}
              </span>
            )}
          </div>
        </div>

        {profile?.interests && profile.interests.length > 0 && (
          <div className="mx-auto mt-4 flex max-w-content flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <span
                key={interest}
                className="rounded-pill px-3 py-1 font-sans text-xs"
                style={{
                  background: 'color-mix(in srgb, var(--color-text-inverse) 12%, transparent)',
                  color: 'var(--color-text-inverse)',
                }}
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Stats */}
      <section className="mt-6 grid grid-cols-3 gap-3">
        <StatTile label="Check-ins" value={stats.data?.checkins} loading={stats.isLoading} />
        <StatTile label="Reviews" value={stats.data?.reviews} loading={stats.isLoading} />
        <StatTile
          label="Spots visited"
          value={stats.data?.spotsVisited}
          loading={stats.isLoading}
        />
      </section>

      {/* Streak card */}
      <section
        className="mt-6 overflow-hidden rounded-xl p-6"
        style={{
          background: 'linear-gradient(135deg, var(--color-dark-alt) 0%, var(--color-dark) 100%)',
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p
              className="font-mono text-[11px] uppercase tracking-widest"
              style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 60%, transparent)' }}
            >
              Current streak
            </p>
            <p className="mt-1 font-display text-5xl font-black text-secondary">
              {streak}
              <span
                className="ml-2 font-sans text-base font-normal"
                style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 60%, transparent)' }}
              >
                day{streak === 1 ? '' : 's'}
              </span>
            </p>
          </div>
          <span className="text-5xl" aria-hidden="true">
            🔥
          </span>
        </div>
        <p
          className="mt-4 font-sans text-sm"
          style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 70%, transparent)' }}
        >
          {lastCheckin.isLoading
            ? 'Loading your last visit…'
            : lastCheckin.data
              ? `Last checked in ${timeAgo(lastCheckin.data.checkedInAt)}${lastCheckin.data.spotName ? ` at ${lastCheckin.data.spotName}` : ''}`
              : 'No check-ins yet — check in to start your streak.'}
        </p>
      </section>

      {/* Badges */}
      <section className="mt-8">
        <h2 className="mb-3 font-display text-xl font-bold text-text">Badges</h2>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="flex flex-col items-center rounded-lg border border-border bg-surface p-3 text-center"
            >
              <span
                className={
                  badge.earned ? 'text-3xl' : 'text-3xl opacity-30 grayscale'
                }
                aria-hidden="true"
              >
                {badge.emoji}
              </span>
              <span
                className={
                  badge.earned
                    ? 'mt-1.5 font-sans text-[11px] font-medium leading-tight text-text'
                    : 'mt-1.5 font-sans text-[11px] font-medium leading-tight text-light'
                }
              >
                {badge.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Recent spots */}
      <section className="mt-8">
        <h2 className="mb-3 font-display text-xl font-bold text-text">Recent spots</h2>
        {recentSpots.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : recentSpots.data && recentSpots.data.length > 0 ? (
          <ul className="space-y-3">
            {recentSpots.data.map((spot) => (
              <RecentSpotRow key={spot.spotId} spot={spot} />
            ))}
          </ul>
        ) : (
          <p className="rounded-lg bg-surface py-10 text-center font-sans text-sm text-muted">
            You haven&rsquo;t checked in anywhere yet.
          </p>
        )}
      </section>

      {/* Check-in history */}
      <section className="mt-8">
        <h2 className="mb-3 font-display text-xl font-bold text-text">
          Your check-in history
        </h2>
        <PastCheckIns userId={userId} />
      </section>

      {/* Milestone celebration */}
      <MilestoneSheet
        milestone={milestone}
        streak={streak}
        onClose={dismissMilestone}
      />
    </div>
  )
}

function StatTile({
  label,
  value,
  loading,
}: {
  label: string
  value: number | undefined
  loading: boolean
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 text-center">
      {loading ? (
        <Skeleton className="mx-auto h-8 w-10" />
      ) : (
        <p className="font-display text-3xl font-bold text-text">{value ?? 0}</p>
      )}
      <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-muted">
        {label}
      </p>
    </div>
  )
}

function RecentSpotRow({ spot }: { spot: RecentSpot }) {
  return (
    <li>
      <Link
        to={`/spot/${spot.spotId}`}
        className="flex items-center gap-4 rounded-lg border border-border bg-surface p-3 transition-colors duration-fast hover:border-border-strong"
      >
        <span
          className="h-12 w-12 shrink-0 rounded-md"
          style={{ background: spot.coverGradient ?? 'var(--color-dark)' }}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-sans text-sm font-semibold text-text">
            {spot.name}
          </span>
          <span className="block font-mono text-[11px] text-muted">
            {timeAgo(spot.lastVisit)} · {spot.totalVisits} visit
            {spot.totalVisits === 1 ? '' : 's'}
          </span>
        </span>
        <QualityScoreBadge
          score={spot.workScore}
          label={spot.scoreLabel ?? undefined}
          size="sm"
        />
      </Link>
    </li>
  )
}

function MilestoneSheet({
  milestone,
  streak,
  onClose,
}: {
  milestone: number | null
  streak: number
  onClose: () => void
}) {
  const next = nextMilestone(streak)
  const progress = next ? Math.min(100, Math.round((streak / next) * 100)) : 100

  return (
    <AnimatePresence>
      {milestone && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center md:items-center"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.button
            type="button"
            aria-label="Dismiss"
            onClick={onClose}
            className="absolute inset-0"
            style={{ background: 'color-mix(in srgb, var(--color-dark) 55%, transparent)' }}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            transition={{ duration: 0.25 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${milestone} day streak reached`}
            className="relative w-full max-w-sm overflow-hidden rounded-t-xl bg-surface p-6 text-center shadow-xl md:mb-0 md:rounded-xl"
            variants={{ hidden: { y: '100%', opacity: 0.6 }, visible: { y: 0, opacity: 1 } }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-pill text-muted transition-colors duration-fast hover:bg-surface-alt"
            >
              <X size={18} />
            </button>

            <p className="text-5xl" aria-hidden="true">
              🔥
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-text">
              {milestone}-day streak!
            </h2>
            <p className="mt-2 font-sans text-sm text-muted">
              You&rsquo;re one of Nairobi&rsquo;s most consistent remote workers.
              Keep it going.
            </p>

            {next ? (
              <div className="mt-6">
                <div className="flex items-center justify-between font-mono text-[11px] text-muted">
                  <span>{milestone} days</span>
                  <span>{next} days</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-pill bg-surface-alt">
                  <motion.div
                    className="h-full rounded-pill bg-secondary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <p className="mt-3 font-sans text-xs text-light">
                  Next up: reach {next} days to unlock a WorkPass day-pass discount.
                </p>
              </div>
            ) : (
              <p className="mt-6 font-sans text-xs text-light">
                You&rsquo;ve hit the top streak tier — legendary.
              </p>
            )}

            <button
              type="button"
              onClick={onClose}
              className="mt-6 flex h-12 w-full min-h-[44px] items-center justify-center rounded-pill bg-dark font-sans text-sm font-semibold text-inverse transition-colors duration-fast hover:bg-dark-alt"
            >
              Keep it up →
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
