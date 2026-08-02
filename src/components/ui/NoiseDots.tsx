import { cn } from '@/lib/utils'
import { noiseLabel } from '@/lib/spot-format'
import type { NoiseLevel } from '@/types'

interface NoiseDotsProps {
  level: NoiseLevel
  /** Render for a dark background (adjusts the inactive dot colour). */
  onDark?: boolean
  className?: string
}

/**
 * Three dots showing ambient noise. Active dots use the terracotta (primary)
 * colour; count equals the level. Spec: docs/DESIGN_SYSTEM.md → NoiseDots.
 */
export function NoiseDots({ level, onDark = false, className }: NoiseDotsProps) {
  const label = noiseLabel(level)
  return (
    <span
      className={cn('inline-flex items-center gap-[3px]', className)}
      role="img"
      aria-label={`Noise level: ${label}`}
      title={label}
    >
      {[1, 2, 3].map((dot) => {
        const on = dot <= level
        return (
          <span
            key={dot}
            className={cn(
              'h-[7px] w-[7px] rounded-full',
              on ? 'bg-primary' : onDark ? '' : 'bg-border',
            )}
            style={
              onDark && !on
                ? {
                    backgroundColor:
                      'color-mix(in srgb, var(--color-text-inverse) 30%, transparent)',
                  }
                : undefined
            }
          />
        )
      })}
    </span>
  )
}
