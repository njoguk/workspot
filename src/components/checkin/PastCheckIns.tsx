import { Link } from 'react-router-dom'
import { usePastCheckins, type PastCheckin } from '@/hooks/useCheckins'
import { Skeleton } from '@/components/ui/Skeleton'
import { timeAgo } from '@/lib/time'

/** Friendly session length ("45m", "1h 20m"), or null for an open/short session. */
function sessionLength(startIso: string, endIso: string | null): string | null {
  if (!endIso) return null
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime()
  if (!(ms > 0)) return null
  const mins = Math.round(ms / 60000)
  if (mins < 1) return null
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

/** The user's own check-in history, with the reviews/tips they left. */
export function PastCheckIns({ userId }: { userId: string | undefined }) {
  const { data, isLoading } = usePastCheckins(userId)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <p className="rounded-lg bg-surface py-10 text-center font-sans text-sm text-muted">
        No past check-ins yet. Your visit history will appear here.
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {data.map((c) => (
        <PastCheckInRow key={c.id} checkin={c} />
      ))}
    </ul>
  )
}

function PastCheckInRow({ checkin: c }: { checkin: PastCheckin }) {
  const length = sessionLength(c.checkedInAt, c.checkedOutAt)
  const meta = [
    timeAgo(c.checkedInAt),
    c.spotNeighbourhood ?? undefined,
    length ?? undefined,
  ]
    .filter(Boolean)
    .join(' · ')

  const inner = (
    <>
      <span
        className="h-12 w-12 shrink-0 rounded-md"
        style={{ background: c.coverGradient ?? 'var(--color-dark)' }}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-sans text-sm font-semibold text-text">
          {c.spotName ?? 'A spot'}
        </span>
        <span className="block font-mono text-[11px] text-muted">{meta}</span>
        {(c.youReviewed || c.youTipped) && (
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            {c.youReviewed && (
              <span className="rounded-pill bg-surface-alt px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
                ✍️ Reviewed
              </span>
            )}
            {c.youTipped && (
              <span className="rounded-pill bg-surface-alt px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
                💡 Your tip
              </span>
            )}
          </span>
        )}
      </span>
    </>
  )

  const className =
    'flex items-center gap-4 rounded-lg border border-border bg-surface p-3 transition-colors duration-fast hover:border-border-strong'

  return (
    <li>
      {c.spotId ? (
        <Link to={`/spot/${c.spotId}`} className={className}>
          {inner}
        </Link>
      ) : (
        <div className={className}>{inner}</div>
      )}
    </li>
  )
}
