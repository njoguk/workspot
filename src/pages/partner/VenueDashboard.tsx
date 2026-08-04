import { useMemo, useState } from 'react'
import { PLATFORM_NAME } from '@/config/platform'
import { useMyVenue } from '@/hooks/useVenue'
import { buildPartnerData, TIER_LABEL } from '@/lib/partner'
import { spotTypeLabel } from '@/lib/spot-format'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { VenueOverview } from './VenueOverview'
import { VenueListingEditor } from './VenueListingEditor'
import { VenueBookings } from './VenueBookings'
import { VenuePayouts } from './VenuePayouts'
import { VenueAnalytics } from './VenueAnalytics'
import { VenueSettings } from './VenueSettings'
import { VenueUpgrade } from './VenueUpgrade'

/**
 * Venue Partner Portal dashboard shell (Phase 3 Part B, STEP 8). A 220px dark
 * sidebar + scrollable main area on desktop; the sidebar stacks above the
 * content and its nav scrolls horizontally on mobile. Sub-views are switched
 * by internal state rather than nested routes to keep /partner/dashboard the
 * single entry point.
 */

type Section =
  | 'overview'
  | 'listing'
  | 'bookings'
  | 'payouts'
  | 'analytics'
  | 'settings'
  | 'upgrade'

interface NavItem {
  id: Section
  icon: string
  label: string
}

const NAV: NavItem[] = [
  { id: 'overview', icon: '📊', label: 'Overview' },
  { id: 'listing', icon: '✏️', label: 'Edit Listing' },
  { id: 'bookings', icon: '📅', label: 'Bookings' },
  { id: 'payouts', icon: '💰', label: 'Payouts' },
  { id: 'analytics', icon: '📈', label: 'Analytics' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
  { id: 'upgrade', icon: '🏆', label: 'Upgrade Plan' },
]

export default function VenueDashboard() {
  const { data: venue, isLoading } = useMyVenue()
  const [section, setSection] = useState<Section>('overview')

  const data = useMemo(() => {
    if (!venue) return null
    return buildPartnerData(venue.spotId, {
      tier: venue.tier,
      neighbourhood: venue.neighbourhood,
      workScore: venue.workScore,
    })
  }, [venue])

  if (isLoading) return <DashboardSkeleton />

  const pendingCount = data?.pendingCount ?? 0

  return (
    <div className="flex flex-col gap-6 py-2 md:flex-row md:gap-8">
      {/* ── Sidebar ── */}
      <aside className="md:w-[220px] md:shrink-0">
        <div className="rounded-xl bg-dark p-4 text-inverse md:sticky md:top-20">
          <p className="font-display text-lg font-bold">{PLATFORM_NAME}</p>
          <p
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 55%, transparent)' }}
          >
            Partner Dashboard
          </p>

          {/* Venue name card */}
          <div
            className="mt-4 rounded-md p-3"
            style={{ background: 'color-mix(in srgb, var(--color-text-inverse) 8%, transparent)' }}
          >
            {venue ? (
              <>
                <p className="truncate font-sans text-sm font-semibold">{venue.name}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-pill bg-secondary px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wide text-dark">
                    {TIER_LABEL[venue.tier]}
                  </span>
                  <span
                    className="font-mono text-[10px]"
                    style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 55%, transparent)' }}
                  >
                    {spotTypeLabel(venue.type)}
                  </span>
                </div>
              </>
            ) : (
              <p
                className="font-sans text-[12px]"
                style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 65%, transparent)' }}
              >
                No listing yet
              </p>
            )}
          </div>

          {/* Nav */}
          <nav
            className="mt-4 flex gap-1 overflow-x-auto no-scrollbar md:flex-col"
            aria-label="Dashboard sections"
          >
            {NAV.map((item) => {
              const active = section === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-[44px] shrink-0 items-center gap-2.5 rounded-md px-3 py-2.5 text-left font-sans text-sm transition-colors duration-fast md:w-full',
                    active ? 'font-semibold' : 'font-medium',
                  )}
                  style={{
                    background: active
                      ? 'color-mix(in srgb, var(--color-primary) 90%, transparent)'
                      : 'transparent',
                    color: active
                      ? 'var(--color-text-inverse)'
                      : 'color-mix(in srgb, var(--color-text-inverse) 72%, transparent)',
                  }}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.id === 'bookings' && pendingCount > 0 && (
                    <span className="ml-auto hidden items-center justify-center rounded-pill bg-secondary px-1.5 py-0.5 font-mono text-[9px] font-semibold text-dark md:inline-flex">
                      {pendingCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="min-w-0 flex-1">
        {section === 'overview' &&
          (data && venue ? (
            <VenueOverview venue={venue} data={data} />
          ) : (
            <NoVenue onCreate={() => setSection('listing')} />
          ))}
        {section === 'listing' && <VenueListingEditor venue={venue ?? null} onSaved={() => setSection('overview')} />}
        {section === 'bookings' &&
          (data ? <VenueBookings data={data} /> : <NoVenue onCreate={() => setSection('listing')} />)}
        {section === 'payouts' &&
          (data && venue ? (
            <VenuePayouts venue={venue} data={data} />
          ) : (
            <NoVenue onCreate={() => setSection('listing')} />
          ))}
        {section === 'analytics' &&
          (data && venue ? (
            <VenueAnalytics venue={venue} data={data} />
          ) : (
            <NoVenue onCreate={() => setSection('listing')} />
          ))}
        {section === 'settings' && <VenueSettings venue={venue ?? null} onEdit={() => setSection('listing')} />}
        {section === 'upgrade' && <VenueUpgrade venue={venue ?? null} />}
      </main>
    </div>
  )
}

function NoVenue({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface p-10 text-center">
      <span className="text-4xl" aria-hidden="true">🏠</span>
      <h2 className="mt-4 font-display text-xl font-bold text-text">Set up your listing</h2>
      <p className="mt-2 max-w-sm font-sans text-sm text-muted">
        Create your venue listing to unlock bookings, payouts and your analytics dashboard.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-6 inline-flex h-11 min-h-[44px] items-center rounded-pill bg-primary px-5 font-sans text-sm font-semibold text-inverse transition-opacity duration-fast hover:opacity-90"
      >
        Create your listing →
      </button>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 py-2 md:flex-row md:gap-8">
      <Skeleton className="h-64 w-full rounded-xl md:w-[220px] md:shrink-0" />
      <div className="min-w-0 flex-1 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>
    </div>
  )
}
