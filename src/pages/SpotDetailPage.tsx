import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getSpotById } from '@/data/spots'
import { noiseLabel, wifiClass, spotTypeLabel } from '@/lib/spot-format'
import { QualityScoreBadge } from '@/components/ui/QualityScoreBadge'
import { cn } from '@/lib/utils'

/** Accent token for a vibe tag, chosen by its leading emoji. */
function vibeAccent(tag: string): string | null {
  if (/🌿|🌳/.test(tag)) return 'var(--color-success)'
  if (/☕|🏆/.test(tag)) return 'var(--color-secondary)'
  if (/📹|🌍/.test(tag)) return 'var(--color-info)'
  if (/🌅|⚡/.test(tag)) return 'var(--color-primary)'
  return null
}

function tintStyle(accent: string) {
  return {
    backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`,
    color: accent,
  }
}

export default function SpotDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const spot = id ? getSpotById(id) : undefined

  if (!spot) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="font-display text-3xl font-bold text-text">Spot not found</h1>
        <p className="mt-2 font-sans text-sm text-muted">
          This spot may have been removed.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-11 items-center rounded-pill bg-primary px-5 font-sans text-sm font-semibold text-inverse"
        >
          Back to Explore
        </Link>
      </div>
    )
  }

  const bestSlot =
    spot.bestTimes.find((t) => t.includes('✓'))?.replace(/[✓✗]/g, '').trim() ??
    spot.bestTimes[0]?.replace(/[✓✗]/g, '').trim() ??
    '—'

  const metrics: { label: string; value: string; sub: string }[] = [
    { label: 'WiFi Speed', value: `${spot.wifiMbps} Mbps`, sub: wifiClass(spot.wifiMbps) },
    { label: 'Power Sockets', value: spot.sockets, sub: 'Power access' },
    { label: 'Noise Level', value: noiseLabel(spot.noiseLevel), sub: 'Ambient' },
    {
      label: 'Price to Work',
      value: spot.priceEntry,
      sub: spot.priceType === 'free' ? 'Purchase to stay' : 'Day pass',
    },
    { label: 'Best Time', value: bestSlot, sub: 'Peak productivity' },
    {
      label: 'Community Score',
      value: spot.workScore.toFixed(1),
      sub: spot.scoreLabel,
    },
  ]

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${spot.name} ${spot.neighbourhood} Nairobi`,
  )}`

  return (
    <div className="pb-28 md:pb-24">
      {/* ── Hero ── */}
      <section
        className="full-bleed relative h-[260px] overflow-hidden md:h-[540px]"
        style={{ background: spot.coverGradient }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, color-mix(in srgb, var(--color-dark) 88%, transparent) 0%, color-mix(in srgb, var(--color-dark) 25%, transparent) 55%, color-mix(in srgb, var(--color-dark) 20%, transparent) 100%)',
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto flex h-full max-w-content flex-col justify-between px-4 py-4 md:px-10 lg:px-[60px]">
          <div className="flex items-start justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="grid h-10 w-10 place-items-center rounded-full bg-surface text-dark shadow-sm"
            >
              <ArrowLeft size={18} />
            </button>
            <QualityScoreBadge score={spot.workScore} label={spot.scoreLabel} size="lg" />
          </div>
          <div>
            <h1 className="font-display text-[30px] font-bold leading-tight text-inverse">
              {spot.name}
            </h1>
            <p
              className="mt-1 font-mono text-[11px] uppercase tracking-wide"
              style={{
                color: 'color-mix(in srgb, var(--color-text-inverse) 65%, transparent)',
              }}
            >
              {spot.neighbourhood} · {spotTypeLabel(spot.type)}
            </p>
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <div className="space-y-8 py-8">
        {/* 1. Description */}
        <p className="max-w-2xl text-[15px] leading-[1.8] text-text">
          {spot.description}
        </p>

        {/* 2. Metrics grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-md border border-border bg-surface p-4"
            >
              <p className="font-mono text-[10px] uppercase tracking-wide text-light">
                {m.label}
              </p>
              <p className="mt-1 font-display text-lg font-bold text-text">{m.value}</p>
              <p className="mt-0.5 font-sans text-[11px] text-muted">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* 3. Vibe tags */}
        <div>
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-light">
            The Vibe
          </h2>
          <ul className="flex flex-wrap gap-2">
            {spot.vibeTags.map((tag) => {
              const accent = vibeAccent(tag)
              return (
                <li
                  key={tag}
                  className={cn(
                    'rounded-pill px-3 py-1.5 font-sans text-[13px] font-medium',
                    accent ? '' : 'bg-surface-alt text-muted',
                  )}
                  style={accent ? tintStyle(accent) : undefined}
                >
                  {tag}
                </li>
              )
            })}
          </ul>
        </div>

        {/* 4. Best time */}
        <div>
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-light">
            Best Time to Go
          </h2>
          <ul className="flex flex-wrap gap-2">
            {spot.bestTimes.map((slot) => {
              const good = slot.includes('✓')
              const avoid = slot.includes('✗')
              const accent = good
                ? 'var(--color-success)'
                : avoid
                  ? 'var(--color-primary)'
                  : null
              return (
                <li
                  key={slot}
                  className={cn(
                    'rounded-pill px-3 py-1.5 font-mono text-[12px]',
                    accent ? '' : 'bg-surface-alt text-muted',
                  )}
                  style={accent ? tintStyle(accent) : undefined}
                >
                  {slot}
                </li>
              )
            })}
          </ul>
        </div>

      </div>

      {/* Sticky action bar — above the tab bar on mobile, bottom on desktop */}
      <div className="fixed inset-x-0 bottom-[68px] z-40 border-t border-border bg-surface md:bottom-0">
        <div className="mx-auto flex max-w-content gap-3 px-4 py-3 md:justify-start md:px-10 lg:px-[60px]">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 flex-1 items-center justify-center rounded-pill bg-dark font-sans text-sm font-semibold text-inverse transition-colors duration-fast hover:bg-dark-alt md:flex-none md:px-8"
          >
            🗺 Get Directions
          </a>
          <Link
            to="/auth"
            className="flex h-12 flex-1 items-center justify-center rounded-pill bg-primary font-sans text-sm font-semibold text-inverse transition-opacity duration-fast hover:opacity-90 md:flex-none md:px-8"
          >
            ✍️ Rate This Spot
          </Link>
        </div>
      </div>
    </div>
  )
}
