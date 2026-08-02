import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { QualityScoreBadge } from '@/components/ui/QualityScoreBadge'
import { MetricRow } from '@/components/ui/MetricRow'
import { VibeTags } from '@/components/ui/VibeTags'
import { spotTypeLabel } from '@/lib/spot-format'
import type { Spot } from '@/types'

interface SpotCardProps {
  spot: Spot
}

/**
 * Directory grid card. Cover-gradient image area with the score badge,
 * body with name / location / metrics / vibe tags. Lifts on hover.
 * Spec: docs/BUILD_PLAN.md Session 2 STEP 7.
 */
export function SpotCard({ spot }: SpotCardProps) {
  return (
    <Link
      to={`/spot/${spot.id}`}
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={`${spot.name}, ${spot.neighbourhood}`}
    >
      <motion.article
        whileHover={{ y: -3 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden rounded-lg bg-surface shadow-sm transition-shadow duration-normal hover:shadow-md"
      >
        {/* Cover */}
        <div
          className="relative h-[180px]"
          style={{ background: spot.coverGradient }}
        >
          {spot.isNew && (
            <span className="absolute left-3 top-3 rounded-pill bg-surface px-2 py-1 font-mono text-[10px] font-medium text-dark shadow-sm">
              🆕 New
            </span>
          )}
          <div className="absolute right-3 top-3">
            <QualityScoreBadge score={spot.workScore} label={spot.scoreLabel} size="md" />
          </div>
        </div>

        {/* Body */}
        <div className="space-y-3 p-[18px]">
          <div>
            <h3 className="font-display text-[17px] font-bold leading-snug text-text">
              {spot.name}
            </h3>
            <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-light">
              {spot.neighbourhood} · {spotTypeLabel(spot.type)}
            </p>
          </div>

          <MetricRow spot={spot} />
          <VibeTags tags={spot.vibeTags} max={3} />
        </div>
      </motion.article>
    </Link>
  )
}
