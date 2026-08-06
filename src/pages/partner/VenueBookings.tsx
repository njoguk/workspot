import { useMemo, useState } from 'react'
import type { BookingChip, PartnerData } from '@/lib/partner'
import { BookingsTable, SectionHeading } from '@/components/partner/partner-ui'
import { cn } from '@/lib/utils'

/**
 * Bookings list (dashboard). Shows the venue's incoming bookings with a status
 * filter. Rows are demo data (src/lib/partner.ts) until an owner-scoped
 * bookings RPC exists — the shape matches the eventual real payload.
 */

type Filter = 'all' | BookingChip

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'completed', label: 'Completed' },
]

export function VenueBookings({ data }: { data: PartnerData }) {
  const [filter, setFilter] = useState<Filter>('all')

  const rows = useMemo(
    () => (filter === 'all' ? data.upcoming : data.upcoming.filter((b) => b.status === filter)),
    [data.upcoming, filter],
  )

  return (
    <div>
      <SectionHeading title="Bookings" subtitle="Every reservation across your slots" />

      <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => {
          const active = filter === f.id
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={active}
              className={cn(
                'min-h-[40px] shrink-0 rounded-pill border px-4 py-2 font-sans text-[13px] font-medium transition-colors duration-fast',
                active
                  ? 'border-dark bg-dark text-inverse'
                  : 'border-border-strong text-muted hover:border-primary hover:text-primary',
              )}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      <BookingsTable
        rows={rows}
        emptyLabel={`No ${filter === 'all' ? '' : filter} bookings to show.`}
      />
    </div>
  )
}
