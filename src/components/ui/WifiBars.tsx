import { cn } from '@/lib/utils'
import { wifiActiveBars } from '@/lib/spot-format'

interface WifiBarsProps {
  mbps: number
  /** Render for a dark background (adjusts the inactive bar colour). */
  onDark?: boolean
  className?: string
}

const HEIGHTS = [5, 8, 11, 14]

/**
 * Four vertical bars of increasing height showing WiFi strength.
 * Active bars use the success (leaf) colour. Spec: docs/DESIGN_SYSTEM.md.
 */
export function WifiBars({ mbps, onDark = false, className }: WifiBarsProps) {
  const active = wifiActiveBars(mbps)
  return (
    <span
      className={cn('inline-flex items-end gap-[2px]', className)}
      role="img"
      aria-label={`WiFi ${mbps} megabits per second`}
    >
      {HEIGHTS.map((height, i) => {
        const on = i < active
        return (
          <span
            key={height}
            className={cn(
              'w-1 rounded-[1px]',
              on ? 'bg-success' : onDark ? '' : 'bg-border-strong',
            )}
            style={{
              height,
              ...(onDark && !on
                ? {
                    backgroundColor:
                      'color-mix(in srgb, var(--color-text-inverse) 30%, transparent)',
                  }
                : {}),
            }}
          />
        )
      })}
    </span>
  )
}
