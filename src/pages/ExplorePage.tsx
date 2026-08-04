import { motion } from 'framer-motion'
import { PLATFORM, SUBSCRIPTION_NAME, VERIFIED_SPOT_COUNT } from '@/config/platform'
import type { Spot } from '@/types'
import { Link } from 'react-router-dom'
import { useSpots, useFeaturedSpots } from '@/hooks/useSpots'
import { useIsWorkPassMember } from '@/hooks/useWorkPass'
import { useAuth } from '@/contexts/AuthContext'
import { useSpotFilters } from '@/hooks/useSpotFilters'
import { SpotCard } from '@/components/spots/SpotCard'
import { SpotCardFeatured } from '@/components/spots/SpotCardFeatured'
import { FilterBar } from '@/components/explore/FilterBar'
import { Skeleton, SpotCardSkeleton } from '@/components/ui/Skeleton'
import { SoftGateSheet } from '@/components/auth/SoftGateSheet'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
}

const HERO_STATS = [
  { value: String(VERIFIED_SPOT_COUNT), label: 'Verified Spots' },
  { value: '12', label: 'Neighbourhoods' },
  { value: '830+', label: 'Reviews' },
  { value: 'Free', label: 'Always' },
]

/** Stable empty reference so useSpotFilters' memo doesn't recompute each render. */
const EMPTY_SPOTS: Spot[] = []

export default function ExplorePage() {
  const {
    data: spots,
    isLoading: spotsLoading,
    isError: spotsError,
    refetch: refetchSpots,
  } = useSpots()
  const {
    data: featured,
    isLoading: featuredLoading,
    isError: featuredError,
  } = useFeaturedSpots()

  const filters = useSpotFilters(spots ?? EMPTY_SPOTS)
  const { filteredSpots } = filters

  const { isActive: isMember } = useIsWorkPassMember()
  const { isLoggedIn } = useAuth()

  return (
    <div>
      {/* ── Section A — Hero ── */}
      <section className="full-bleed relative flex min-h-[calc(100dvh_-_4rem)] items-center overflow-hidden bg-dark">
        {/* Radial accent overlays */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 85% 12%, color-mix(in srgb, var(--color-primary) 22%, transparent) 0%, transparent 45%), radial-gradient(circle at 10% 90%, color-mix(in srgb, var(--color-success) 16%, transparent) 0%, transparent 48%)',
          }}
          aria-hidden="true"
        />
        {/* Grid pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(color-mix(in srgb, var(--color-text-inverse) 3%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--color-text-inverse) 3%, transparent) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
          aria-hidden="true"
        />

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative mx-auto w-full max-w-content px-4 py-16 md:px-10 md:py-20 lg:px-[60px]"
        >
          <motion.div variants={item} className="flex items-center gap-3">
            <span className="h-px w-7 bg-secondary" aria-hidden="true" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-secondary">
              {PLATFORM.shortDescription}
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="mt-5 max-w-4xl font-display font-black leading-[1.04] text-inverse"
            style={{ fontSize: 'clamp(48px, 8vw, 100px)' }}
          >
            Find your <span className="italic text-secondary">spot.</span> Do your
            best work.
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-6 max-w-xl font-sans text-base leading-relaxed"
            style={{
              color: 'color-mix(in srgb, var(--color-text-inverse) 65%, transparent)',
            }}
          >
            Discover, check in, review, and book workspace sessions at Nairobi's
            best cafés, hotels, gardens, and coworking spaces.
          </motion.p>

          <motion.dl
            variants={item}
            className="mt-12 flex flex-wrap gap-x-10 gap-y-6"
          >
            {HERO_STATS.map((stat) => (
              <div key={stat.label}>
                <dd className="font-display text-[32px] font-bold text-inverse">
                  {stat.value}
                </dd>
                <dt
                  className="font-mono text-[10px] uppercase tracking-[0.15em]"
                  style={{
                    color:
                      'color-mix(in srgb, var(--color-text-inverse) 35%, transparent)',
                  }}
                >
                  {stat.label}
                </dt>
              </div>
            ))}
          </motion.dl>
        </motion.div>
      </section>

      {/* ── WorkPass member banner ── */}
      {isMember && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 flex items-center gap-3 rounded-lg px-4 py-3"
          style={{
            background: 'color-mix(in srgb, var(--color-secondary) 16%, var(--color-surface))',
            border: '1px solid color-mix(in srgb, var(--color-secondary) 40%, transparent)',
          }}
        >
          <span className="text-xl" aria-hidden="true">🏆</span>
          <p className="font-sans text-sm text-text">
            As a {SUBSCRIPTION_NAME} member you get{' '}
            <span className="font-semibold">30% off</span> all bookings.
          </p>
        </motion.div>
      )}

      {/* ── WorkPass upsell (logged-in non-members) ── */}
      {isLoggedIn && !isMember && (
        <Link
          to="/workpass"
          className="mt-6 flex items-center gap-3 rounded-lg px-4 py-3 transition-shadow duration-normal hover:shadow-sm"
          style={{
            background: 'linear-gradient(135deg, var(--color-dark-alt) 0%, var(--color-dark) 100%)',
          }}
        >
          <span className="text-xl" aria-hidden="true">🏆</span>
          <p className="flex-1 font-sans text-sm text-inverse">
            <span className="font-semibold">Go {SUBSCRIPTION_NAME}</span> — book spots ahead &amp;
            save 30% on every session.
          </p>
          <span className="shrink-0 font-mono text-sm font-medium text-secondary">
            See plans →
          </span>
        </Link>
      )}

      {/* ── Section B — Editor's Picks ── */}
      <section className="py-12 md:py-16">
        <div className="mb-6">
          <h2 className="font-display text-[28px] font-bold text-text">
            Editor&rsquo;s Picks
          </h2>
          <p className="mt-1 font-display text-lg italic text-muted">
            The spots our team keeps coming back to
          </p>
        </div>
        {featuredError ? (
          <p className="font-sans text-sm text-muted">
            Couldn&rsquo;t load featured spots right now.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
            {featuredLoading || !featured
              ? [0, 1].map((i) => <Skeleton key={i} className="h-64 w-full rounded-lg" />)
              : featured.map((spot) => (
                  <SpotCardFeatured key={spot.id} spot={spot} showBook={isMember} />
                ))}
          </div>
        )}
      </section>

      {/* ── Section C — All Spots ── */}
      <section className="pb-16">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-[28px] font-bold text-text">All Spots</h2>
          <div className="flex items-center gap-3">
            <input
              type="search"
              value={filters.searchQuery}
              onChange={(e) => filters.setSearch(e.target.value)}
              placeholder="Search spots or areas…"
              aria-label="Search spots by name or neighbourhood"
              className="h-10 w-full rounded-pill border border-border bg-surface-alt px-4 font-sans text-sm text-text placeholder:text-light focus:border-primary focus:outline-none sm:w-64"
            />
            {!spotsLoading && !spotsError && (
              <span className="whitespace-nowrap font-mono text-xs text-muted">
                {filteredSpots.length}{' '}
                {filteredSpots.length === 1 ? 'spot' : 'spots'}
              </span>
            )}
          </div>
        </div>

        <FilterBar filters={filters} />

        {spotsLoading ? (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SpotCardSkeleton key={i} />
            ))}
          </div>
        ) : spotsError ? (
          <div className="mt-10 flex flex-col items-center justify-center rounded-lg bg-surface py-16 text-center">
            <p className="font-display text-xl font-bold text-text">
              We couldn&rsquo;t load spots
            </p>
            <p className="mt-2 max-w-sm font-sans text-sm text-muted">
              Check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => refetchSpots()}
              className="mt-6 inline-flex h-11 min-h-[44px] items-center rounded-pill bg-primary px-5 font-sans text-sm font-semibold text-inverse transition-opacity duration-fast hover:opacity-90"
            >
              Try again
            </button>
          </div>
        ) : filteredSpots.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSpots.map((spot) => (
              <SpotCard key={spot.id} spot={spot} showBook={isMember} />
            ))}
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center justify-center rounded-lg bg-surface py-16 text-center">
            <p className="font-display text-xl font-bold text-text">No spots found</p>
            <p className="mt-2 font-sans text-sm text-muted">
              Try clearing a filter or searching a different area.
            </p>
          </div>
        )}
      </section>

      {/* Soft gate — invites guests to join after 3 spot visits (STEP 6) */}
      <SoftGateSheet />
    </div>
  )
}
