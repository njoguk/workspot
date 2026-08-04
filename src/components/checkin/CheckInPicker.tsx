import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { Spot } from '@/types'
import { useSpots } from '@/hooks/useSpots'
import { useLiveCounts } from '@/hooks/useCheckins'
import { QualityScoreBadge } from '@/components/ui/QualityScoreBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { CheckInConfirm } from '@/components/checkin/CheckInConfirm'

/**
 * The spot-picker body of the check-in flow: a search box + nearby-spots list
 * that hands off to the confirmation screen. Shared by the check-in bottom
 * sheet (modal) and the /check-in page (inline).
 */
export function CheckInPicker({ onDone }: { onDone: () => void }) {
  const { data: spots, isLoading } = useSpots()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Spot | null>(null)

  const results = useMemo<Spot[]>(() => {
    const list = spots ?? []
    const q = query.trim().toLowerCase()
    if (!q) return list.slice(0, 5)
    return list
      .filter((s) => `${s.name} ${s.neighbourhood}`.toLowerCase().includes(q))
      .slice(0, 8)
  }, [spots, query])

  const { data: counts } = useLiveCounts(results.map((s) => s.id))

  if (selected) {
    return (
      <CheckInConfirm
        spot={selected}
        onBack={() => setSelected(null)}
        onConfirmed={onDone}
      />
    )
  }

  return (
    <div>
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-light"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search spots or neighbourhoods…"
          aria-label="Search spots or neighbourhoods"
          className="h-11 w-full rounded-pill border border-border bg-surface-alt pl-10 pr-4 font-sans text-sm text-text placeholder:text-light focus:border-primary focus:outline-none"
        />
      </div>

      <p className="mt-5 font-mono text-[11px] uppercase tracking-widest text-light">
        {query ? 'Results' : 'Spots near you'}
      </p>

      <div className="mt-2 space-y-1">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          ))
        ) : results.length === 0 ? (
          <p className="py-8 text-center font-sans text-sm text-muted">
            No spots match “{query}”.
          </p>
        ) : (
          results.map((spot) => (
            <button
              key={spot.id}
              type="button"
              onClick={() => setSelected(spot)}
              className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors duration-fast hover:bg-surface-alt"
            >
              <span
                className="h-10 w-10 shrink-0 rounded-md"
                style={{ background: spot.coverGradient }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-sans text-sm font-semibold text-text">
                  {spot.name}
                </span>
                <span className="block truncate font-mono text-[11px] text-muted">
                  {spot.neighbourhood} ·{' '}
                  {counts?.[spot.id] ? `${counts[spot.id]} here now` : 'Quiet now'}
                </span>
              </span>
              <QualityScoreBadge
                score={spot.workScore}
                label={spot.scoreLabel}
                size="sm"
              />
            </button>
          ))
        )}
      </div>
    </div>
  )
}
