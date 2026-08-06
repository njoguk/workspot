import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useHub, useHubBranches } from '@/hooks/useHubs'
import { useSpotsByHub } from '@/hooks/useSpots'
import { useIsWorkPassMember } from '@/hooks/useWorkPass'
import { SpotCard } from '@/components/spots/SpotCard'
import { SpotCardSkeleton, Skeleton } from '@/components/ui/Skeleton'

const FALLBACK_GRADIENT =
  'linear-gradient(135deg, var(--color-dark-alt) 0%, var(--color-dark) 100%)'

/**
 * Hub detail (feedback round, Phase 5). One physical place and the distinct
 * spots inside it, plus a "branches" row for other hubs that share its brand.
 */
export default function HubDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: hub, isLoading, isError } = useHub(id)
  const { data: spots, isLoading: spotsLoading } = useSpotsByHub(id)
  const { data: branches } = useHubBranches(hub?.brand, id)
  const { isActive: isMember } = useIsWorkPassMember()

  if (isLoading) {
    return (
      <div className="pb-16">
        <Skeleton className="full-bleed h-[220px] rounded-none md:h-[320px]" />
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SpotCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !hub) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="font-display text-3xl font-bold text-text">Hub not found</h1>
        <p className="mt-2 font-sans text-sm text-muted">
          This hub may have been removed, or hubs aren&rsquo;t enabled yet.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-11 min-h-[44px] items-center rounded-pill bg-primary px-5 font-sans text-sm font-semibold text-inverse"
        >
          Back to Explore
        </Link>
      </div>
    )
  }

  const spotList = spots ?? []

  return (
    <div className="pb-16">
      {/* Hero */}
      <section
        className="full-bleed relative h-[220px] overflow-hidden md:h-[320px]"
        style={{ background: hub.coverGradient ?? FALLBACK_GRADIENT }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, color-mix(in srgb, var(--color-dark) 88%, transparent) 0%, color-mix(in srgb, var(--color-dark) 30%, transparent) 60%, color-mix(in srgb, var(--color-dark) 25%, transparent) 100%)',
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto flex h-full max-w-content flex-col justify-between px-4 py-4 md:px-10 lg:px-[60px]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="grid h-10 w-10 place-items-center rounded-full bg-surface text-dark shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-secondary">
              Hub{hub.brand ? ` · ${hub.brand}` : ''}
            </p>
            <h1 className="mt-1 font-display text-[30px] font-bold leading-tight text-inverse">
              {hub.name}
            </h1>
            {hub.neighbourhood && (
              <p
                className="mt-1 font-mono text-[11px] uppercase tracking-wide"
                style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 65%, transparent)' }}
              >
                {hub.neighbourhood}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="space-y-10 py-8">
        {hub.description && (
          <p className="max-w-2xl text-[15px] leading-[1.8] text-text">{hub.description}</p>
        )}

        {/* Spots at this hub */}
        <section>
          <h2 className="mb-4 font-display text-[22px] font-bold text-text">
            Spots at this hub
          </h2>
          {spotsLoading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SpotCardSkeleton key={i} />
              ))}
            </div>
          ) : spotList.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {spotList.map((spot) => (
                <SpotCard key={spot.id} spot={spot} showBook={isMember} />
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-surface py-10 text-center font-sans text-sm text-muted">
              No spots have been added to this hub yet.
            </p>
          )}
        </section>

        {/* Branches (same brand) */}
        {branches && branches.length > 0 && (
          <section>
            <h2 className="mb-4 font-display text-[22px] font-bold text-text">
              Other {hub.brand} branches
            </h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {branches.map((b) => (
                <li key={b.id}>
                  <Link
                    to={`/hub/${b.id}`}
                    className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4 transition-colors duration-fast hover:border-border-strong"
                  >
                    <span
                      className="h-12 w-12 shrink-0 rounded-md"
                      style={{ background: b.coverGradient ?? FALLBACK_GRADIENT }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-display text-lg font-bold text-text">
                        {b.name}
                      </span>
                      {b.neighbourhood && (
                        <span className="block font-mono text-[11px] uppercase tracking-wide text-muted">
                          {b.neighbourhood}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
