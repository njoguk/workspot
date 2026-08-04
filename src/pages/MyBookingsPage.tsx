import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'
import {
  useCancelBooking,
  useMyBookings,
  type BookingWithSpot,
} from '@/hooks/useBookings'
import { formatKES, slotRangeLabel } from '@/lib/booking'
import { formatEventDate } from '@/lib/time'
import { spotTypeLabel } from '@/lib/spot-format'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import type { BookingStatus } from '@/types'

const MS_24H = 24 * 60 * 60 * 1000

/** Slot start as a Date for upcoming/past partitioning + cancel window. */
function slotDateTime(b: BookingWithSpot): number {
  const t = new Date(`${b.slot_date}T${b.slot_start}`).getTime()
  return Number.isNaN(t) ? 0 : t
}

interface StatusMeta {
  label: string
  color: string
}
function statusMeta(status: BookingStatus): StatusMeta {
  switch (status) {
    case 'confirmed':
      return { label: 'Confirmed', color: 'var(--color-success)' }
    case 'pending':
      return { label: 'Pending', color: 'var(--color-secondary)' }
    case 'completed':
      return { label: 'Done', color: 'var(--color-info)' }
    case 'cancelled':
      return { label: 'Cancelled', color: 'var(--color-primary)' }
    default:
      return { label: 'Failed', color: 'var(--color-primary)' }
  }
}

export default function MyBookingsPage() {
  const { isLoggedIn, loading } = useAuth()
  const { data: bookings, isLoading } = useMyBookings()
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')

  const { upcoming, past, totalSaved } = useMemo(() => {
    const now = Date.now()
    const up: BookingWithSpot[] = []
    const pa: BookingWithSpot[] = []
    let saved = 0
    for (const b of bookings ?? []) {
      if (b.status === 'confirmed' || b.status === 'completed') {
        saved += b.workpass_discount ?? 0
      }
      const isLive = b.status === 'confirmed' || b.status === 'pending'
      if (isLive && slotDateTime(b) >= now) up.push(b)
      else pa.push(b)
    }
    up.sort((a, b) => slotDateTime(a) - slotDateTime(b))
    pa.sort((a, b) => slotDateTime(b) - slotDateTime(a))
    return { upcoming: up, past: pa, totalSaved: saved }
  }, [bookings])

  if (!loading && !isLoggedIn) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-4xl" aria-hidden="true">🎫</p>
        <h1 className="mt-3 font-display text-2xl font-bold text-text">Log in to see bookings</h1>
        <Link
          to="/auth"
          state={{ from: '/bookings' }}
          className="mt-5 inline-flex h-11 min-h-[44px] items-center rounded-pill bg-primary px-5 font-sans text-sm font-semibold text-inverse"
        >
          Log in
        </Link>
      </div>
    )
  }

  const list = tab === 'upcoming' ? upcoming : past

  return (
    <div className="py-6">
      <header className="mb-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">Bookings</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-text">My Bookings</h1>
      </header>

      {/* Total savings banner */}
      <section
        className="overflow-hidden rounded-xl p-5"
        style={{
          background: 'linear-gradient(135deg, var(--color-dark-alt) 0%, var(--color-dark) 100%)',
        }}
      >
        <div className="flex items-center gap-4">
          <span className="text-4xl" aria-hidden="true">🏆</span>
          <div>
            <p
              className="font-mono text-[11px] uppercase tracking-widest"
              style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 60%, transparent)' }}
            >
              Total WorkPass savings
            </p>
            {isLoading ? (
              <Skeleton className="mt-1 h-9 w-32" />
            ) : (
              <p className="mt-0.5 font-display text-4xl font-black text-secondary">
                {formatKES(totalSaved)}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="mt-6 flex gap-2" role="tablist" aria-label="Bookings filter">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              'h-9 min-h-[44px] rounded-pill px-4 font-sans text-sm font-semibold capitalize transition-colors duration-fast',
              tab === t
                ? 'bg-dark text-inverse'
                : 'border border-border-strong bg-surface text-muted hover:border-primary hover:text-primary',
            )}
          >
            {t}
            {t === 'upcoming' && upcoming.length > 0 ? ` · ${upcoming.length}` : ''}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState tab={tab} />
        ) : tab === 'upcoming' ? (
          <ul className="space-y-4">
            {list.map((b) => (
              <UpcomingCard key={b.id} booking={b} />
            ))}
          </ul>
        ) : (
          <ul className="space-y-2">
            {list.map((b) => (
              <PastRow key={b.id} booking={b} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ── Upcoming card ──────────────────────────────────────────────

function UpcomingCard({ booking }: { booking: BookingWithSpot }) {
  const { showToast } = useToast()
  const cancel = useCancelBooking()
  const meta = statusMeta(booking.status)
  const spot = booking.spot
  const canCancel =
    (booking.status === 'confirmed' || booking.status === 'pending') &&
    slotDateTime(booking) - Date.now() > MS_24H

  async function handleCancel(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    try {
      await cancel.mutateAsync(booking.id)
      showToast('Booking cancelled', { icon: '✅' })
    } catch {
      showToast('Could not cancel — try again', { icon: '⚠️' })
    }
  }

  return (
    <li>
      <Link
        to={`/booking/${booking.id}/confirm`}
        className="block overflow-hidden rounded-lg bg-surface shadow-sm transition-shadow duration-normal hover:shadow-md"
        aria-label={`Booking at ${spot?.name ?? 'spot'}, ${formatEventDate(booking.slot_date)}`}
      >
        {/* Amber top stripe */}
        <div className="h-1 w-full bg-secondary" aria-hidden="true" />
        <div className="p-4">
          <div className="flex items-center gap-3">
            <span
              className="h-12 w-12 shrink-0 rounded-md"
              style={{ background: spot?.cover_gradient ?? 'var(--color-dark)' }}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base font-bold text-text">{spot?.name}</p>
              <p className="font-mono text-[11px] text-muted">
                {formatEventDate(booking.slot_date)} · {slotRangeLabel(booking.slot_start, booking.slot_end)}
              </p>
            </div>
            <StatusBadge meta={meta} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-md bg-surface-alt p-2.5">
              <p className="font-mono text-[10px] uppercase tracking-wide text-light">Paid</p>
              <p className="font-display text-sm font-bold text-text">{formatKES(booking.price_paid)}</p>
            </div>
            <div className="rounded-md bg-surface-alt p-2.5">
              <p className="font-mono text-[10px] uppercase tracking-wide text-light">Saved</p>
              <p className="font-display text-sm font-bold text-success">
                {formatKES(booking.workpass_discount ?? 0)}
              </p>
            </div>
          </div>

          {canCancel && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancel.isPending}
              className="mt-3 font-sans text-[13px] text-muted underline decoration-border-strong underline-offset-4 transition-colors duration-fast hover:text-primary disabled:opacity-50"
            >
              {cancel.isPending ? 'Cancelling…' : 'Cancel booking'}
            </button>
          )}
        </div>
      </Link>
    </li>
  )
}

// ── Past row ───────────────────────────────────────────────────

function PastRow({ booking }: { booking: BookingWithSpot }) {
  const meta = statusMeta(booking.status)
  const spot = booking.spot
  return (
    <li>
      <Link
        to={`/booking/${booking.id}/confirm`}
        className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors duration-fast hover:border-border-strong"
      >
        <span
          className="h-9 w-9 shrink-0 rounded-md"
          style={{ background: spot?.cover_gradient ?? 'var(--color-dark)' }}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-sans text-sm font-semibold text-text">{spot?.name}</p>
          <p className="font-mono text-[11px] text-muted">
            {formatEventDate(booking.slot_date)} · {spot?.type ? spotTypeLabel(spot.type) : ''}
          </p>
        </div>
        <StatusBadge meta={meta} />
      </Link>
    </li>
  )
}

function StatusBadge({ meta }: { meta: StatusMeta }) {
  return (
    <span
      className="shrink-0 rounded-pill px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide"
      style={{
        background: `color-mix(in srgb, ${meta.color} 16%, transparent)`,
        color: meta.color,
      }}
    >
      {meta.label}
    </span>
  )
}

function EmptyState({ tab }: { tab: 'upcoming' | 'past' }) {
  return (
    <div className="rounded-lg border border-border bg-surface py-14 text-center">
      <p className="text-4xl" aria-hidden="true">
        {tab === 'upcoming' ? '📅' : '🗂'}
      </p>
      <p className="mt-3 font-display text-lg font-bold text-text">
        {tab === 'upcoming' ? 'No upcoming bookings' : 'Nothing here yet'}
      </p>
      <p className="mx-auto mt-1 max-w-xs font-sans text-sm text-muted">
        {tab === 'upcoming'
          ? 'Find a spot and book your next work session.'
          : 'Your past and cancelled bookings will show up here.'}
      </p>
      {tab === 'upcoming' && (
        <Link
          to="/"
          className="mt-5 inline-flex h-11 min-h-[44px] items-center rounded-pill bg-primary px-5 font-sans text-sm font-semibold text-inverse"
        >
          Explore spots
        </Link>
      )}
    </div>
  )
}
