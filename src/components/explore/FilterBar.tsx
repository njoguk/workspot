import { cn } from '@/lib/utils'
import type { SpotType } from '@/types'
import type { SpotFilters, WifiKey, VibeKey, PriceKey } from '@/hooks/useSpotFilters'

interface FilterBarProps {
  filters: SpotFilters
}

interface ChipProps {
  label: string
  active: boolean
  onClick: () => void
}

function Chip({ label, active, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'whitespace-nowrap rounded-pill border px-3.5 font-sans text-xs font-medium transition-colors duration-fast',
        'flex h-9 items-center',
        active
          ? 'border-dark bg-dark text-inverse'
          : 'border-border-strong text-muted hover:border-primary hover:text-primary',
      )}
    >
      {label}
    </button>
  )
}

function Divider() {
  return <span className="mx-1 h-6 w-px shrink-0 bg-border" aria-hidden="true" />
}

const TYPES: { label: string; value: SpotType | null }[] = [
  { label: 'All', value: null },
  { label: 'Café', value: 'cafe' },
  { label: 'Coworking', value: 'cowork' },
  { label: 'Hotel', value: 'hotel' },
  { label: 'Garden', value: 'garden' },
]

const WIFI: { label: string; value: WifiKey }[] = [
  { label: 'Fast 50+', value: 'fast' },
  { label: 'Decent 20+', value: 'decent' },
]

const VIBE: { label: string; value: VibeKey }[] = [
  { label: 'Quiet', value: 'quiet' },
  { label: 'Buzzy', value: 'buzzy' },
  { label: 'Outdoor', value: 'outdoor' },
]

const PRICE: { label: string; value: PriceKey }[] = [
  { label: 'Free entry', value: 'free' },
  { label: 'Day pass', value: 'paid' },
]

/**
 * Sticky horizontal filter bar. Type is single-select; WiFi / Vibe / Price
 * are multi-select. Spec: docs/BUILD_PLAN.md Session 2 STEP 9.
 */
export function FilterBar({ filters }: FilterBarProps) {
  return (
    <div className="sticky top-16 z-30 -mx-4 border-b border-border bg-bg md:-mx-10 lg:-mx-[60px]">
      <div className="no-scrollbar flex h-14 items-center gap-2 overflow-x-auto px-4 md:px-10 lg:px-[60px]">
        {TYPES.map((t) => (
          <Chip
            key={t.label}
            label={t.label}
            active={filters.activeType === t.value}
            onClick={() => filters.setType(t.value)}
          />
        ))}

        <Divider />

        {WIFI.map((w) => (
          <Chip
            key={w.value}
            label={w.label}
            active={filters.wifi.has(w.value)}
            onClick={() => filters.toggleWifi(w.value)}
          />
        ))}

        <Divider />

        {VIBE.map((v) => (
          <Chip
            key={v.value}
            label={v.label}
            active={filters.vibe.has(v.value)}
            onClick={() => filters.toggleVibe(v.value)}
          />
        ))}

        <Divider />

        {PRICE.map((p) => (
          <Chip
            key={p.value}
            label={p.label}
            active={filters.price.has(p.value)}
            onClick={() => filters.togglePrice(p.value)}
          />
        ))}
      </div>
    </div>
  )
}
