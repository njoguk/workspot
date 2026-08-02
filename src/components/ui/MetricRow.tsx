import { cn } from '@/lib/utils'
import { WifiBars } from '@/components/ui/WifiBars'
import { NoiseDots } from '@/components/ui/NoiseDots'
import { noiseLabel } from '@/lib/spot-format'
import type { Spot } from '@/types'

interface MetricRowProps {
  spot: Spot
  /** Render on a dark background (featured card, hero). */
  onDark?: boolean
  className?: string
}

/**
 * Compact row of three metrics in the mono face:
 * WiFi (bars + Mbps) · Noise (dots + label) · Price.
 * Spec: docs/WORKSPOT.md → MetricRow / docs/BUILD_PLAN.md Session 2 STEP 5.
 */
export function MetricRow({ spot, onDark = false, className }: MetricRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 font-mono text-[11px]',
        onDark ? 'text-inverse' : 'text-muted',
        className,
      )}
    >
      <span className="flex items-center gap-1.5 whitespace-nowrap">
        <WifiBars mbps={spot.wifiMbps} onDark={onDark} />
        <span>{spot.wifiMbps} Mbps</span>
      </span>

      <span
        className={cn('h-3 w-px', onDark ? '' : 'bg-border')}
        style={
          onDark
            ? {
                backgroundColor:
                  'color-mix(in srgb, var(--color-text-inverse) 25%, transparent)',
              }
            : undefined
        }
        aria-hidden="true"
      />

      <span className="flex items-center gap-1.5 whitespace-nowrap">
        <NoiseDots level={spot.noiseLevel} onDark={onDark} />
        <span>{noiseLabel(spot.noiseLevel)}</span>
      </span>

      <span
        className={cn('h-3 w-px', onDark ? '' : 'bg-border')}
        style={
          onDark
            ? {
                backgroundColor:
                  'color-mix(in srgb, var(--color-text-inverse) 25%, transparent)',
              }
            : undefined
        }
        aria-hidden="true"
      />

      <span className="truncate">{spot.priceEntry}</span>
    </div>
  )
}
