import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { COMMUNITY } from '@/config/platform'
import {
  useEvents,
  useRsvpCounts,
  useEventRsvps,
  type EventWithSpot,
} from '@/hooks/useEvents'
import { AvatarStack } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { todayStr } from '@/lib/date'
import { formatEventDate, formatTime } from '@/lib/time'

export default function EventsPage() {
  const { data: events, isLoading, isError } = useEvents()
  const { data: counts } = useRsvpCounts((events ?? []).map((e) => e.id))

  const today = todayStr()
  const upcoming = (events ?? []).filter((e) => e.event_date >= today)
  const past = (events ?? []).filter((e) => e.event_date < today)
  const featured = upcoming[0]
  const rest = upcoming.slice(1)

  return (
    <div className="py-6">
      <header className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
          {COMMUNITY.eventName}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-text">Events</h1>
        <p className="mt-1 font-display text-lg italic text-muted">
          Meet the {COMMUNITY.communityName.toLowerCase()} in person
        </p>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ) : isError ? (
        <div className="rounded-lg bg-surface py-16 text-center">
          <p className="font-display text-lg font-bold text-text">
            Couldn&rsquo;t load events
          </p>
          <p className="mt-2 font-sans text-sm text-muted">
            Check your connection and try again.
          </p>
        </div>
      ) : upcoming.length === 0 && past.length === 0 ? (
        <div className="rounded-lg bg-surface py-16 text-center">
          <p className="font-display text-xl font-bold text-text">
            No events scheduled
          </p>
          <p className="mt-2 font-sans text-sm text-muted">
            New {COMMUNITY.eventName} meetups are announced here — check back soon.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {featured && <FeaturedEvent event={featured} />}

          {rest.length > 0 && (
            <section>
              <h2 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-light">
                More upcoming
              </h2>
              <ul className="space-y-3">
                {rest.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    attendees={counts?.[event.id] ?? 0}
                  />
                ))}
              </ul>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-light">
                Past events
              </h2>
              <ul className="space-y-3 opacity-70">
                {past.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    attendees={counts?.[event.id] ?? 0}
                    past
                  />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function FeaturedEvent({ event }: { event: EventWithSpot }) {
  const { data: rsvps } = useEventRsvps(event.id)

  return (
    <Link
      to={`/events/${event.id}`}
      className="block overflow-hidden rounded-xl shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div
        className="relative p-6 md:p-8"
        style={{
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--color-info) 85%, black) 0%, var(--color-primary) 100%)',
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{formatEventDate(event.event_date)}</Badge>
          <Badge>{formatTime(event.start_time)}</Badge>
          {event.is_free && <Badge>Free</Badge>}
        </div>

        <h2 className="mt-4 max-w-lg font-display text-3xl font-bold leading-tight text-inverse">
          {event.title}
        </h2>
        {event.spot && (
          <p
            className="mt-2 font-mono text-[11px] uppercase tracking-wide"
            style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 75%, transparent)' }}
          >
            {event.spot.name} · {event.spot.neighbourhood}
          </p>
        )}

        <div className="mt-6 flex items-center gap-4">
          {rsvps && rsvps.length > 0 && (
            <AvatarStack
              people={rsvps.map((r) => ({ name: r.display_name, seed: r.user_id }))}
              size={34}
            />
          )}
          <span className="inline-flex h-11 min-h-[44px] items-center rounded-pill bg-secondary px-5 font-sans text-sm font-semibold text-dark">
            RSVP — It&rsquo;s Free
          </span>
        </div>
      </div>
    </Link>
  )
}

function EventRow({
  event,
  attendees,
  past = false,
}: {
  event: EventWithSpot
  attendees: number
  past?: boolean
}) {
  return (
    <li>
      <Link
        to={`/events/${event.id}`}
        className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4 transition-colors duration-fast hover:border-border-strong"
      >
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-surface-alt text-center">
          <span className="font-display text-lg font-bold leading-none text-text">
            {new Date(`${event.event_date}T00:00:00`).getDate() || '·'}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wide text-muted">
            {formatEventDate(event.event_date).split(' ')[2] ?? ''}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-sans text-sm font-semibold text-text">
            {event.title}
          </p>
          <p className="mt-0.5 truncate font-mono text-[11px] text-muted">
            {formatTime(event.start_time)}
            {event.spot ? ` · ${event.spot.name}` : ''}
          </p>
        </div>
        <span className="shrink-0 font-mono text-xs text-muted">
          {past ? 'Ended' : `${attendees} going`}
        </span>
      </Link>
    </li>
  )
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span
      className="rounded-pill px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide text-inverse"
      style={{ background: 'color-mix(in srgb, var(--color-dark) 25%, transparent)' }}
    >
      {children}
    </span>
  )
}
