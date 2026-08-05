import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import {
  useEvent,
  useEventRsvps,
  useRsvpMutation,
  type EventWithSpot,
} from '@/hooks/useEvents'
import { AvatarStack } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatEventDate, formatTime } from '@/lib/time'
import { todayStr } from '@/lib/date'

/** Build a Google Calendar "add event" template URL from an event. */
function googleCalendarUrl(event: EventWithSpot): string {
  const pad = (t: string) => t.replace(/:/g, '').padEnd(6, '0').slice(0, 6)
  const datePart = event.event_date.replace(/-/g, '')
  const start = `${datePart}T${pad(event.start_time)}`
  const endTime = event.end_time ?? event.start_time
  const end = `${datePart}T${pad(endTime)}`
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: event.description ?? '',
    location: event.spot ? `${event.spot.name}, ${event.spot.neighbourhood ?? 'Nairobi'}` : 'Nairobi',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuth()
  const { showToast } = useToast()
  const { data: event, isLoading, isError } = useEvent(id)
  const { data: rsvps } = useEventRsvps(id)
  const rsvp = useRsvpMutation()

  if (isLoading) {
    return (
      <div className="pb-10">
        <Skeleton className="full-bleed h-56 rounded-none" />
        <div className="space-y-4 py-8">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    )
  }

  if (isError || !event) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="font-display text-3xl font-bold text-text">Event not found</h1>
        <p className="mt-2 font-sans text-sm text-muted">
          This event may have been removed.
        </p>
        <Link
          to="/events"
          className="mt-6 inline-flex h-11 min-h-[44px] items-center rounded-pill bg-primary px-5 font-sans text-sm font-semibold text-inverse"
        >
          Back to Events
        </Link>
      </div>
    )
  }

  const hasRsvped = Boolean(user && rsvps?.some((r) => r.user_id === user.id))
  const isPast = event.event_date < todayStr()

  async function handleRsvp() {
    if (!id || isPast) return
    try {
      await rsvp.mutateAsync(id)
      showToast("You're going! 🎉", { icon: '✅' })
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not RSVP.', {
        icon: '⚠️',
      })
    }
  }

  return (
    <div className="pb-16">
      {/* Hero */}
      <section
        className="full-bleed relative overflow-hidden px-4 py-8 md:px-10 md:py-12 lg:px-[60px]"
        style={{
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--color-info) 85%, black) 0%, var(--color-primary) 100%)',
        }}
      >
        <div className="mx-auto max-w-content">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="grid h-10 w-10 place-items-center rounded-full bg-surface text-dark shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <HeroBadge>{formatEventDate(event.event_date)}</HeroBadge>
            <HeroBadge>
              {formatTime(event.start_time)}
              {event.end_time ? ` – ${formatTime(event.end_time)}` : ''}
            </HeroBadge>
            {event.is_free && <HeroBadge>Free</HeroBadge>}
          </div>

          <h1 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-tight text-inverse">
            {event.title}
          </h1>
        </div>
      </section>

      <div className="space-y-8 py-8">
        {/* Ended / Confirmed / RSVP */}
        {isPast ? (
          <div className="rounded-xl border border-border bg-surface-alt p-6 text-center">
            <p className="font-display text-xl font-bold text-text">
              {hasRsvped ? 'You attended this event' : 'This event has ended'}
            </p>
            <p className="mt-1 font-sans text-sm text-muted">
              {hasRsvped
                ? 'Thanks for coming — keep an eye out for the next meetup.'
                : 'RSVPs are closed for this one. Here’s what’s coming up next.'}
            </p>
            <Link
              to="/events"
              className="mt-5 inline-flex h-11 min-h-[44px] items-center rounded-pill bg-dark px-5 font-sans text-sm font-semibold text-inverse"
            >
              See upcoming events
            </Link>
          </div>
        ) : hasRsvped ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden rounded-xl p-6 text-center"
            style={{
              background:
                'linear-gradient(135deg, var(--color-success) 0%, color-mix(in srgb, var(--color-success) 70%, black) 100%)',
            }}
          >
            <p className="text-4xl" aria-hidden="true">
              🎉
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-inverse">
              You&rsquo;re in!
            </p>
            <p
              className="mt-1 font-sans text-sm"
              style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 80%, transparent)' }}
            >
              We&rsquo;ll see you there. Add it to your calendar so you don&rsquo;t forget.
            </p>
            <a
              href={googleCalendarUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex h-11 min-h-[44px] items-center rounded-pill bg-surface px-5 font-sans text-sm font-semibold text-dark shadow-sm transition-opacity duration-fast hover:opacity-90"
            >
              📅 Add to Calendar
            </a>
          </motion.div>
        ) : isLoggedIn ? (
          <button
            type="button"
            onClick={handleRsvp}
            disabled={rsvp.isPending}
            className="flex h-12 w-full min-h-[44px] items-center justify-center rounded-pill bg-secondary px-6 font-sans text-sm font-semibold text-dark transition-opacity duration-fast hover:opacity-90 disabled:opacity-60"
          >
            {rsvp.isPending ? 'Saving…' : "RSVP — It's Free"}
          </button>
        ) : (
          <Link
            to="/auth"
            state={{ from: `/events/${id}` }}
            className="flex h-12 w-full min-h-[44px] items-center justify-center rounded-pill bg-secondary px-6 font-sans text-sm font-semibold text-dark transition-opacity duration-fast hover:opacity-90"
          >
            Log in to RSVP
          </Link>
        )}

        {/* Host venue */}
        {event.spot && (
          <section>
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-light">
              Host venue
            </h2>
            <Link
              to={`/spot/${event.spot.id}`}
              className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4 transition-colors duration-fast hover:border-border-strong"
            >
              <span
                className="h-14 w-14 shrink-0 rounded-md"
                style={{ background: event.spot.cover_gradient ?? 'var(--color-dark)' }}
                aria-hidden="true"
              />
              <span className="min-w-0">
                <span className="block truncate font-display text-lg font-bold text-text">
                  {event.spot.name}
                </span>
                <span className="block font-mono text-[11px] uppercase tracking-wide text-muted">
                  {event.spot.neighbourhood}
                </span>
              </span>
            </Link>
          </section>
        )}

        {/* Description */}
        {event.description && (
          <section>
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-light">
              About
            </h2>
            <p className="max-w-2xl font-sans text-[15px] leading-[1.8] text-text">
              {event.description}
            </p>
          </section>
        )}

        {/* Attendees — live "who's going" for upcoming events, a simple count once past */}
        <section>
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-light">
            {isPast ? 'Attendance' : "Who's going"}
          </h2>
          {isPast ? (
            <p className="font-sans text-sm text-muted">
              {rsvps && rsvps.length > 0
                ? `${rsvps.length} ${rsvps.length === 1 ? 'person' : 'people'} attended`
                : 'No attendance recorded.'}
            </p>
          ) : rsvps && rsvps.length > 0 ? (
            <div className="flex items-center gap-3">
              <AvatarStack
                people={rsvps.map((r) => ({ name: r.display_name, seed: r.user_id }))}
                size={36}
                max={6}
              />
              <span className="font-sans text-sm text-muted">
                {rsvps.length} going
              </span>
            </div>
          ) : (
            <p className="font-sans text-sm text-muted">
              Be the first to RSVP.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

function HeroBadge({ children }: { children: ReactNode }) {
  return (
    <span
      className="rounded-pill px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide text-inverse"
      style={{ background: 'color-mix(in srgb, var(--color-dark) 25%, transparent)' }}
    >
      {children}
    </span>
  )
}
