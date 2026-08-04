import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useSpot } from '@/hooks/useSpots'
import { useActiveCheckin } from '@/hooks/useCheckins'
import { useAuth } from '@/contexts/AuthContext'
import { recordSpotVisit } from '@/lib/softGate'
import { noiseLabel, wifiClass, spotTypeLabel } from '@/lib/spot-format'
import { QualityScoreBadge } from '@/components/ui/QualityScoreBadge'
import { ReviewFlow } from '@/components/review/ReviewFlow'
import { CheckInConfirm } from '@/components/checkin/CheckInConfirm'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

/** Accent token for a vibe tag, chosen by its leading emoji. */
function vibeAccent(tag: string): string | null {
  if (/🌿|🌳/.test(tag)) return 'var(--color-success)'
  if (/☕|🏆/.test(tag)) return 'var(--color-secondary)'
  if (/📹|🌍/.test(tag)) return 'var(--color-info)'
  if (/🌅|⚡/.test(tag)) return 'var(--color-primary)'
  return null
}

function tintStyle(accent: string) {
  return {
    backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`,
    color: accent,
  }
}

export default function SpotDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const { data: spot, isLoading, isError } = useSpot(id)
  const { data: activeCheckin } = useActiveCheckin()

  // Soft-gate counter: record each guest spot visit (Phase 2 STEP 6).
  useEffect(() => {
    if (spot && !isLoggedIn) recordSpotVisit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, spot?.id, isLoggedIn])

  // Review flow (STEP 7) and check-in confirmation modals.
  const [reviewOpen, setReviewOpen] = useState(false)
  const [checkInOpen, setCheckInOpen] = useState(false)

  if (isLoading) {
    return <SpotDetailSkeleton />
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="font-display text-3xl font-bold text-text">
          Something went wrong
        </h1>
        <p className="mt-2 font-sans text-sm text-muted">
          We couldn&rsquo;t load this spot. Please try again.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-11 min-h-[44px] items-center rounded-pill bg-primary px-5 font-sans text-sm font-semibold text-inverse"
        >
          Back to Explore
        </Link>
      </div>
    )
  }

  if (!spot) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="font-display text-3xl font-bold text-text">Spot not found</h1>
        <p className="mt-2 font-sans text-sm text-muted">
          This spot may have been removed.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-11 min-h-[44px] items-center rounded-pill bg-primary px-5 font-sans text-sm font-semibold text-inverse"
        >
          Back to Explore
        </Link>
      </div>
    )
  }

  const bestSlot =
    spot.bestTimes.find((t) => t.includes('✓'))?.replace(/[✓✗]/g, '').trim() ??
    spot.bestTimes[0]?.replace(/[✓✗]/g, '').trim() ??
    '—'

  const metrics: { label: string; value: string; sub: string }[] = [
    { label: 'WiFi Speed', value: `${spot.wifiMbps} Mbps`, sub: wifiClass(spot.wifiMbps) },
    { label: 'Power Sockets', value: spot.sockets, sub: 'Power access' },
    { label: 'Noise Level', value: noiseLabel(spot.noiseLevel), sub: 'Ambient' },
    {
      label: 'Price to Work',
      value: spot.priceEntry,
      sub: spot.priceType === 'free' ? 'Purchase to stay' : 'Day pass',
    },
    { label: 'Best Time', value: bestSlot, sub: 'Peak productivity' },
    {
      label: 'Community Score',
      value: spot.workScore.toFixed(1),
      sub: spot.scoreLabel,
    },
  ]

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${spot.name} ${spot.neighbourhood} Nairobi`,
  )}`

  const isCheckedInHere = Boolean(activeCheckin && activeCheckin.spot_id === spot.id)

  return (
    <div className="pb-28 md:pb-24">
      {/* ── Hero ── */}
      <section
        className="full-bleed relative h-[260px] overflow-hidden md:h-[540px]"
        style={{ background: spot.coverGradient }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, color-mix(in srgb, var(--color-dark) 88%, transparent) 0%, color-mix(in srgb, var(--color-dark) 25%, transparent) 55%, color-mix(in srgb, var(--color-dark) 20%, transparent) 100%)',
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto flex h-full max-w-content flex-col justify-between px-4 py-4 md:px-10 lg:px-[60px]">
          <div className="flex items-start justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="grid h-10 w-10 place-items-center rounded-full bg-surface text-dark shadow-sm"
            >
              <ArrowLeft size={18} />
            </button>
            <QualityScoreBadge score={spot.workScore} label={spot.scoreLabel} size="lg" />
          </div>
          <div>
            <h1 className="font-display text-[30px] font-bold leading-tight text-inverse">
              {spot.name}
            </h1>
            <p
              className="mt-1 font-mono text-[11px] uppercase tracking-wide"
              style={{
                color: 'color-mix(in srgb, var(--color-text-inverse) 65%, transparent)',
              }}
            >
              {spot.neighbourhood} · {spotTypeLabel(spot.type)}
            </p>
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <div className="space-y-8 py-8">
        {/* 1. Description */}
        <p className="max-w-2xl text-[15px] leading-[1.8] text-text">
          {spot.description}
        </p>

        {/* 2. Metrics grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-md border border-border bg-surface p-4"
            >
              <p className="font-mono text-[10px] uppercase tracking-wide text-light">
                {m.label}
              </p>
              <p className="mt-1 font-display text-lg font-bold text-text">{m.value}</p>
              <p className="mt-0.5 font-sans text-[11px] text-muted">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* 3. Vibe tags */}
        <div>
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-light">
            The Vibe
          </h2>
          <ul className="flex flex-wrap gap-2">
            {spot.vibeTags.map((tag) => {
              const accent = vibeAccent(tag)
              return (
                <li
                  key={tag}
                  className={cn(
                    'rounded-pill px-3 py-1.5 font-sans text-[13px] font-medium',
                    accent ? '' : 'bg-surface-alt text-muted',
                  )}
                  style={accent ? tintStyle(accent) : undefined}
                >
                  {tag}
                </li>
              )
            })}
          </ul>
        </div>

        {/* 4. Best time */}
        <div>
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-light">
            Best Time to Go
          </h2>
          <ul className="flex flex-wrap gap-2">
            {spot.bestTimes.map((slot) => {
              const good = slot.includes('✓')
              const avoid = slot.includes('✗')
              const accent = good
                ? 'var(--color-success)'
                : avoid
                  ? 'var(--color-primary)'
                  : null
              return (
                <li
                  key={slot}
                  className={cn(
                    'rounded-pill px-3 py-1.5 font-mono text-[12px]',
                    accent ? '' : 'bg-surface-alt text-muted',
                  )}
                  style={accent ? tintStyle(accent) : undefined}
                >
                  {slot}
                </li>
              )
            })}
          </ul>
        </div>

        {/* Retrospective review path for a past visit */}
        {isLoggedIn && !isCheckedInHere && (
          <button
            type="button"
            onClick={() => setReviewOpen(true)}
            className="font-sans text-sm text-muted underline decoration-border-strong underline-offset-4 transition-colors duration-fast hover:text-primary"
          >
            Been here before? Leave a review
          </button>
        )}
      </div>

      {/* Sticky action bar — above the tab bar on mobile, bottom on desktop */}
      <div className="fixed inset-x-0 bottom-[68px] z-40 border-t border-border bg-surface md:bottom-0">
        <div className="relative mx-auto flex max-w-content gap-3 px-4 py-3 md:justify-start md:px-10 lg:px-[60px]">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 flex-1 items-center justify-center rounded-pill bg-dark font-sans text-sm font-semibold text-inverse transition-colors duration-fast hover:bg-dark-alt md:flex-none md:px-8"
          >
            🗺 Get Directions
          </a>
          {!isLoggedIn ? (
            <Link
              to="/auth"
              state={{ from: `/spot/${id}` }}
              className="flex h-12 flex-1 items-center justify-center rounded-pill bg-primary font-sans text-sm font-semibold text-inverse transition-opacity duration-fast hover:opacity-90 md:flex-none md:px-8"
            >
              📍 Check In Here
            </Link>
          ) : isCheckedInHere ? (
            <button
              type="button"
              onClick={() => setReviewOpen(true)}
              className="flex h-12 flex-1 items-center justify-center rounded-pill bg-primary font-sans text-sm font-semibold text-inverse transition-opacity duration-fast hover:opacity-90 md:flex-none md:px-8"
            >
              ✍️ Rate your visit
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCheckInOpen(true)}
              className="flex h-12 flex-1 items-center justify-center rounded-pill bg-primary font-sans text-sm font-semibold text-inverse transition-opacity duration-fast hover:opacity-90 md:flex-none md:px-8"
            >
              📍 Check In Here
            </button>
          )}
        </div>
      </div>

      {reviewOpen && (
        <ReviewFlow
          spot={{
            id: spot.id,
            name: spot.name,
            type: spot.type,
            coverGradient: spot.coverGradient,
            neighbourhood: spot.neighbourhood,
            scoreLabel: spot.scoreLabel,
          }}
          onClose={() => setReviewOpen(false)}
        />
      )}

      {/* Check-in confirmation for this spot */}
      <AnimatePresence>
        {checkInOpen && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end justify-center md:items-center"
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.button
              type="button"
              aria-label="Cancel"
              onClick={() => setCheckInOpen(false)}
              className="absolute inset-0"
              style={{ background: 'color-mix(in srgb, var(--color-dark) 50%, transparent)' }}
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
              transition={{ duration: 0.25 }}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`Check in at ${spot.name}`}
              className="relative w-full max-w-content rounded-t-xl bg-surface px-5 pb-8 pt-4 shadow-xl md:mb-6 md:max-w-md md:rounded-xl md:px-6"
              variants={{ hidden: { y: '100%' }, visible: { y: 0 } }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="mb-3 font-display text-xl font-bold text-text">
                Check in here
              </h2>
              <CheckInConfirm
                spot={spot}
                backLabel="Cancel"
                onBack={() => setCheckInOpen(false)}
                onConfirmed={() => setCheckInOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Loading placeholder matching the detail-page layout. */
function SpotDetailSkeleton() {
  return (
    <div className="pb-28 md:pb-24">
      <Skeleton className="full-bleed h-[260px] rounded-none md:h-[540px]" />
      <div className="space-y-8 py-8">
        <div className="max-w-2xl space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-md" />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-pill" />
          ))}
        </div>
      </div>
    </div>
  )
}
