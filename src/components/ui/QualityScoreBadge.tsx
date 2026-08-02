import { cn } from '@/lib/utils'
import { SCORE_LABEL } from '@/config/platform'

type BadgeSize = 'sm' | 'md' | 'lg'

interface QualityScoreBadgeProps {
  score: number
  /** Defaults to CONFIG SCORE_LABEL — never hardcode "WorkScore". */
  label?: string
  size?: BadgeSize
  className?: string
}

const SIZES: Record<BadgeSize, { box: number; score: number; label: number }> = {
  sm: { box: 38, score: 13, label: 6 },
  md: { box: 48, score: 16, label: 7 },
  lg: { box: 56, score: 19, label: 7 },
}

/**
 * The quality-score badge (WorkScore by default). Amber circle, dark score
 * in the editorial display face at weight 900, mono label beneath.
 * Spec: docs/DESIGN_SYSTEM.md → QualityScoreBadge.
 */
export function QualityScoreBadge({
  score,
  label = SCORE_LABEL,
  size = 'md',
  className,
}: QualityScoreBadgeProps) {
  const s = SIZES[size]
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-full bg-secondary text-dark shadow-sm',
        className,
      )}
      style={{ width: s.box, height: s.box }}
      role="img"
      aria-label={`${label} ${score.toFixed(1)} out of 10`}
    >
      <span
        className="font-display font-black leading-none"
        style={{ fontSize: s.score }}
      >
        {score.toFixed(1)}
      </span>
      <span
        className="mt-0.5 font-mono uppercase leading-none tracking-wide"
        style={{
          fontSize: s.label,
          color: 'color-mix(in srgb, var(--color-dark) 55%, transparent)',
        }}
      >
        {label}
      </span>
    </div>
  )
}
