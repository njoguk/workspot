import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { QualityScoreBadge } from '@/components/ui/QualityScoreBadge'
import { MetricRow } from '@/components/ui/MetricRow'
import { spotTypeLabel } from '@/lib/spot-format'
import type { Spot } from '@/types'

interface SpotCardFeaturedProps {
  spot: Spot
  className?: string
  /** WorkPass members get a "Book a slot" shortcut below the spot name. */
  showBook?: boolean
}

/**
 * Tall hero card for Editor's Picks. Full-bleed cover gradient with a
 * bottom-to-top dark overlay and bottom-anchored content in cream.
 * Spec: docs/BUILD_PLAN.md Session 2 STEP 8.
 */
export function SpotCardFeatured({ spot, className, showBook = false }: SpotCardFeaturedProps) {
  const navigate = useNavigate()
  return (
    <Link
      to={`/spot/${spot.id}`}
      className={className}
      aria-label={`${spot.name}, ${spot.neighbourhood}`}
    >
      <motion.article
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative h-[440px] overflow-hidden rounded-lg shadow-md"
        style={{ background: spot.coverGradient }}
      >
        {/* Dark overlay (earth-toned, bottom → top) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, color-mix(in srgb, var(--color-dark) 92%, transparent) 0%, color-mix(in srgb, var(--color-dark) 45%, transparent) 42%, transparent 78%)',
          }}
          aria-hidden="true"
        />

        {/* Top-left category + first vibe tag */}
        <div className="absolute left-5 top-5 flex flex-wrap gap-2">
          <span className="rounded-pill bg-surface px-2.5 py-1 font-mono text-[10px] font-medium text-dark">
            {spotTypeLabel(spot.type)}
          </span>
          {spot.vibeTags[0] && (
            <span className="rounded-pill bg-surface px-2.5 py-1 font-mono text-[10px] font-medium text-dark">
              {spot.vibeTags[0]}
            </span>
          )}
        </div>

        {/* Top-right score */}
        <div className="absolute right-5 top-5">
          <QualityScoreBadge score={spot.workScore} label={spot.scoreLabel} size="lg" />
        </div>

        {/* Bottom-left content */}
        <div className="absolute inset-x-0 bottom-0 space-y-2.5 p-6">
          <h3 className="font-display text-[26px] font-bold leading-tight text-inverse">
            {spot.name}
          </h3>
          <p
            className="font-mono text-[11px] uppercase tracking-wide"
            style={{
              color: 'color-mix(in srgb, var(--color-text-inverse) 65%, transparent)',
            }}
          >
            {spot.neighbourhood} · {spotTypeLabel(spot.type)}
          </p>
          {showBook && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                navigate(`/book/${spot.id}`)
              }}
              className="inline-flex h-8 min-h-[44px] items-center rounded-pill bg-success px-3.5 font-sans text-[13px] font-semibold text-inverse transition-opacity duration-fast hover:opacity-90"
              aria-label={`Book a slot at ${spot.name}`}
            >
              📅 Book a slot
            </button>
          )}
          <MetricRow spot={spot} onDark />
        </div>
      </motion.article>
    </Link>
  )
}
