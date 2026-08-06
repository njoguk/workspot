import type { SignatureBadge } from '@/lib/badges'
import { cn } from '@/lib/utils'

/**
 * Compact inline badge label shown next to a user's name across the app
 * (community feed, people cards, spot reviews). `emphasis` gives the badge a
 * tinted-primary treatment when it's especially relevant to the context (e.g.
 * a Workcation Pro on a workcation event).
 */
export function BadgeTag({
  badge,
  emphasis = false,
  className,
}: {
  badge: SignatureBadge
  emphasis?: boolean
  className?: string
}) {
  return (
    <span
      title={badge.label}
      className={cn(
        'inline-flex items-center gap-1 rounded-pill px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide',
        emphasis ? 'text-primary' : 'bg-surface-alt text-muted',
        className,
      )}
      style={
        emphasis
          ? { backgroundColor: 'color-mix(in srgb, var(--color-primary) 14%, transparent)' }
          : undefined
      }
    >
      <span aria-hidden="true">{badge.emoji}</span>
      {badge.label}
    </span>
  )
}
