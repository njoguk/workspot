import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Menu, Plus, X } from 'lucide-react'
import { PLATFORM_NAME } from '@/config/platform'
import { useMyVenues, type PartnerVenue } from '@/hooks/useVenue'
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
 * Venue Partner Portal dashboard shell. Redesigned for multiple spots: a venue
 * switcher at the top of the nav lets an owner move between listings and add a
 * new one. On desktop the nav is a sticky dark sidebar; on mobile it's a
 * slide-in drawer (hamburger) instead of a horizontally-scrolling row. Sub-views
 * are switched by internal state so /partner/dashboard stays the single entry.
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
  const { data: venues, isLoading } = useMyVenues()
  const [section, setSection] = useState<Section>('overview')
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const list = venues ?? []
  const venue = useMemo(() => {
    if (list.length === 0) return null
    return list.find((v) => v.spotId === selectedSpotId) ?? list[0]
  }, [list, selectedSpotId])

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
  const editorVenue = creating ? null : venue

  function goSection(s: Section) {
    setSection(s)
    setCreating(false)
    setDrawerOpen(false)
  }
  function selectVenue(spotId: string) {
    setSelectedSpotId(spotId)
    setCreating(false)
    setSection('overview')
    setDrawerOpen(false)
  }
  function addSpot() {
    setCreating(true)
    setSection('listing')
    setDrawerOpen(false)
  }
  function handleSaved(spotId: string) {
    setCreating(false)
    setSelectedSpotId(spotId)
    setSection('overview')
  }

  const activeLabel = creating
    ? 'Create Listing'
    : NAV.find((n) => n.id === section)?.label ?? ''

  const nav = (
    <DashboardNav
      venues={list}
      activeVenue={venue}
      creating={creating}
      section={section}
      pendingCount={pendingCount}
      onSection={goSection}
      onSelectVenue={selectVenue}
      onAddSpot={addSpot}
    />
  )

  return (
    <div className="py-2">
      {/* Mobile top bar */}
      <div className="mb-4 flex items-center gap-3 md:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open dashboard menu"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-dark text-inverse"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-light">
            {venue ? venue.name : 'Partner Dashboard'}
          </p>
          <p className="truncate font-display text-lg font-bold text-text">{activeLabel}</p>
        </div>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden md:block md:w-[240px] md:shrink-0">
          <div className="rounded-xl bg-dark p-4 text-inverse md:sticky md:top-20">
            <p className="font-display text-lg font-bold">{PLATFORM_NAME}</p>
            <p
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 55%, transparent)' }}
            >
              Partner Dashboard
            </p>
            {nav}
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          {section === 'overview' &&
            (data && venue ? (
              <VenueOverview venue={venue} data={data} />
            ) : (
              <NoVenue onCreate={addSpot} />
            ))}
          {section === 'listing' && (
            <VenueListingEditor venue={editorVenue} onSaved={handleSaved} />
          )}
          {section === 'bookings' &&
            (data ? <VenueBookings data={data} /> : <NoVenue onCreate={addSpot} />)}
          {section === 'payouts' &&
            (data && venue ? (
              <VenuePayouts venue={venue} data={data} />
            ) : (
              <NoVenue onCreate={addSpot} />
            ))}
          {section === 'analytics' &&
            (data && venue ? (
              <VenueAnalytics venue={venue} data={data} />
            ) : (
              <NoVenue onCreate={addSpot} />
            ))}
          {section === 'settings' && (
            <VenueSettings venue={venue ?? null} onEdit={() => goSection('listing')} />
          )}
          {section === 'upgrade' && <VenueUpgrade venue={venue ?? null} />}
        </main>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className="fixed inset-0 z-[60] md:hidden"
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.button
              type="button"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0"
              style={{ background: 'color-mix(in srgb, var(--color-dark) 55%, transparent)' }}
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
              transition={{ duration: 0.25 }}
            />
            <motion.div
              className="absolute inset-y-0 left-0 w-[280px] max-w-[85%] overflow-y-auto bg-dark p-4 text-inverse"
              variants={{ hidden: { x: '-100%' }, visible: { x: 0 } }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="font-display text-lg font-bold">{PLATFORM_NAME}</p>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="grid h-9 w-9 place-items-center rounded-pill"
                  style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 70%, transparent)' }}
                >
                  <X size={18} />
                </button>
              </div>
              {nav}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Nav (shared by sidebar + drawer) ───────────────────────────

function DashboardNav({
  venues,
  activeVenue,
  creating,
  section,
  pendingCount,
  onSection,
  onSelectVenue,
  onAddSpot,
}: {
  venues: PartnerVenue[]
  activeVenue: PartnerVenue | null
  creating: boolean
  section: Section
  pendingCount: number
  onSection: (s: Section) => void
  onSelectVenue: (spotId: string) => void
  onAddSpot: () => void
}) {
  return (
    <>
      <VenueSwitcher
        venues={venues}
        activeVenue={activeVenue}
        creating={creating}
        onSelect={onSelectVenue}
        onAdd={onAddSpot}
      />

      <nav className="mt-4 flex flex-col gap-1" aria-label="Dashboard sections">
        {NAV.map((item) => {
          const active = section === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSection(item.id)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-[44px] w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left font-sans text-sm transition-colors duration-fast',
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
                <span className="ml-auto inline-flex items-center justify-center rounded-pill bg-secondary px-1.5 py-0.5 font-mono text-[9px] font-semibold text-dark">
                  {pendingCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </>
  )
}

function VenueSwitcher({
  venues,
  activeVenue,
  creating,
  onSelect,
  onAdd,
}: {
  venues: PartnerVenue[]
  activeVenue: PartnerVenue | null
  creating: boolean
  onSelect: (spotId: string) => void
  onAdd: () => void
}) {
  const [open, setOpen] = useState(false)
  const mutedInverse = 'color-mix(in srgb, var(--color-text-inverse) 55%, transparent)'

  return (
    <div className="relative mt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-md p-3 text-left"
        style={{ background: 'color-mix(in srgb, var(--color-text-inverse) 8%, transparent)' }}
      >
        <span className="min-w-0">
          {creating ? (
            <span className="font-sans text-sm font-semibold">New listing…</span>
          ) : activeVenue ? (
            <>
              <span className="block truncate font-sans text-sm font-semibold">
                {activeVenue.name}
              </span>
              <span className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center rounded-pill bg-secondary px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wide text-dark">
                  {TIER_LABEL[activeVenue.tier]}
                </span>
                <span className="font-mono text-[10px]" style={{ color: mutedInverse }}>
                  {spotTypeLabel(activeVenue.type)}
                </span>
              </span>
            </>
          ) : (
            <span className="font-sans text-[12px]" style={{ color: mutedInverse }}>
              No listing yet
            </span>
          )}
        </span>
        <ChevronDown
          size={16}
          className={cn('shrink-0 transition-transform duration-fast', open && 'rotate-180')}
          style={{ color: mutedInverse }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="mt-1 overflow-hidden rounded-md"
            style={{ background: 'color-mix(in srgb, var(--color-text-inverse) 10%, transparent)' }}
          >
            {venues.map((v) => {
              const isActive = !creating && activeVenue?.spotId === v.spotId
              return (
                <button
                  key={v.spotId}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onSelect(v.spotId)
                    setOpen(false)
                  }}
                  className="flex min-h-[44px] w-full items-center gap-2 px-3 py-2.5 text-left font-sans text-[13px] transition-colors duration-fast"
                  style={{ color: isActive ? 'var(--color-text-inverse)' : mutedInverse }}
                >
                  <span className="min-w-0 flex-1 truncate">{v.name}</span>
                  {isActive && <span aria-hidden="true">✓</span>}
                </button>
              )
            })}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onAdd()
                setOpen(false)
              }}
              className="flex min-h-[44px] w-full items-center gap-2 border-t px-3 py-2.5 text-left font-sans text-[13px] font-medium text-secondary"
              style={{ borderColor: 'color-mix(in srgb, var(--color-text-inverse) 12%, transparent)' }}
            >
              <Plus size={14} /> Add another spot
            </button>
          </motion.div>
        )}
      </AnimatePresence>
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
      <Skeleton className="hidden h-64 rounded-xl md:block md:w-[240px] md:shrink-0" />
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
