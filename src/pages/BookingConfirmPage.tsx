import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Clock } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { useBooking } from '@/hooks/useBookings'
import {
  bookingICS,
  formatKES,
  slotDurationLabel,
  slotRangeLabel,
} from '@/lib/booking'
import { formatEventDate } from '@/lib/time'
import { spotTypeLabel } from '@/lib/spot-format'
import { Skeleton } from '@/components/ui/Skeleton'

/** Deterministic bar widths (2–5px) from the booking code for the "barcode". */
function barcodeWidths(seed: string): number[] {
  const s = seed || 'WORKPASS'
  const widths: number[] = []
  for (let i = 0; i < 48; i++) {
    const code = s.charCodeAt(i % s.length)
    widths.push(2 + ((code + i * 7) % 4))
  }
  return widths
}

export default function BookingConfirmPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { data: booking, isLoading, isError } = useBooking(bookingId)

  if (isLoading) {
    return (
      <div className="space-y-5 py-10">
        <Skeleton className="mx-auto h-40 w-full max-w-md rounded-xl" />
        <Skeleton className="mx-auto h-72 w-full max-w-md rounded-xl" />
      </div>
    )
  }

  if (isError || !booking) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h1 className="font-display text-2xl font-bold text-text">Booking not found</h1>
        <button
          type="button"
          onClick={() => navigate('/bookings')}
          className="mt-5 inline-flex h-11 min-h-[44px] items-center rounded-pill bg-primary px-5 font-sans text-sm font-semibold text-inverse"
        >
          My Bookings
        </button>
      </div>
    )
  }

  const spot = booking.spot
  const dateLabel = formatEventDate(booking.slot_date)
  const timeLabel = slotRangeLabel(booking.slot_start, booking.slot_end)
  const durationLabel = slotDurationLabel(booking.slot_start, booking.slot_end)
  const paidConfirmed = booking.status === 'confirmed' || booking.status === 'completed'

  function addToCalendar() {
    const ics = bookingICS({
      title: `Workspace @ ${spot?.name ?? 'RemoSpot'}`,
      location: `${spot?.name ?? ''}${spot?.neighbourhood ? `, ${spot.neighbourhood}` : ''}, Nairobi`,
      description: `WorkPass booking ${booking!.booking_code ?? ''}`,
      dateStr: booking!.slot_date,
      start: booking!.slot_start,
      end: booking!.slot_end,
      uid: `${booking!.id}@remospot.com`,
    })
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${booking!.booking_code ?? 'booking'}.ics`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    showToast('Calendar file downloaded', { icon: '📅' })
  }

  async function share() {
    const text = `I've booked a workspace at ${spot?.name ?? 'a RemoSpot spot'} — ${dateLabel}, ${timeLabel}. Booking code ${booking!.booking_code ?? ''}.`
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'RemoSpot booking', text })
      } catch {
        /* user dismissed the share sheet */
      }
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      showToast('Booking details copied', { icon: '📋' })
    } catch {
      showToast('Could not share right now', { icon: '⚠️' })
    }
  }

  return (
    <div className="pb-16">
      {/* Hero — celebratory once paid; "reserved / payment pending" until then */}
      <section
        className={`full-bleed px-4 py-12 text-center ${paidConfirmed ? 'bg-success' : 'bg-dark'}`}
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto grid h-20 w-20 place-items-center rounded-full"
          style={{
            background: paidConfirmed
              ? 'color-mix(in srgb, white 22%, transparent)'
              : 'color-mix(in srgb, var(--color-secondary) 22%, transparent)',
          }}
        >
          {paidConfirmed ? (
            <Check size={44} className="text-inverse" aria-hidden="true" />
          ) : (
            <Clock size={40} className="text-secondary" aria-hidden="true" />
          )}
        </motion.div>
        <h1 className="mt-5 font-display text-3xl font-bold text-inverse">
          {paidConfirmed ? 'You’re booked!' : 'Seat reserved'}
        </h1>
        <p
          className="mt-2 font-sans text-sm"
          style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 82%, transparent)' }}
        >
          {spot?.name} · {dateLabel} · {timeLabel}
        </p>
        {!paidConfirmed && (
          <p
            className="mx-auto mt-3 max-w-xs font-sans text-xs"
            style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 60%, transparent)' }}
          >
            Payment — M-Pesa or card via Paystack — is coming in Session 6.
          </p>
        )}
      </section>

      {/* Ticket */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto -mt-6 max-w-md overflow-hidden rounded-xl bg-surface shadow-lg"
      >
        {/* Top: spot */}
        <div className="flex items-center gap-4 p-5">
          <span
            className="h-14 w-14 shrink-0 rounded-md"
            style={{ background: spot?.cover_gradient ?? 'var(--color-dark)' }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold text-text">{spot?.name}</p>
            <p className="font-mono text-[11px] uppercase tracking-wide text-light">
              {spot?.neighbourhood}
              {spot?.type ? ` · ${spotTypeLabel(spot.type)}` : ''}
            </p>
          </div>
        </div>

        {/* Dashed divider with notches */}
        <div className="relative">
          <span
            className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-bg"
            aria-hidden="true"
          />
          <span
            className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-bg"
            aria-hidden="true"
          />
          <div className="mx-5 border-t-2 border-dashed border-border-strong" aria-hidden="true" />
        </div>

        {/* Bottom: 2×2 grid */}
        <div className="grid grid-cols-2 gap-4 p-5">
          <TicketCell label="Date" value={dateLabel} />
          <TicketCell label="Time" value={timeLabel} />
          <TicketCell label="Duration" value={durationLabel} />
          <TicketCell
            label="Paid"
            value={paidConfirmed ? `${formatKES(booking.price_paid)} ✓` : 'Pending'}
            accent={paidConfirmed ? 'var(--color-success)' : 'var(--color-primary)'}
          />
        </div>

        {/* Barcode area */}
        <div className="bg-dark px-5 py-4">
          <div className="flex h-12 items-end justify-center gap-[2px]" aria-hidden="true">
            {barcodeWidths(booking.booking_code ?? booking.id).map((w, i) => (
              <span
                key={i}
                className="h-full"
                style={{
                  width: w,
                  background:
                    i % 5 === 0
                      ? 'color-mix(in srgb, var(--color-text-inverse) 35%, transparent)'
                      : 'var(--color-text-inverse)',
                }}
              />
            ))}
          </div>
          <p className="mt-3 text-center font-mono text-sm tracking-[0.2em] text-inverse">
            {booking.booking_code ?? '—'}
          </p>
        </div>
      </motion.div>

      {/* Actions */}
      <div className="mx-auto mt-6 flex max-w-md gap-3">
        <button
          type="button"
          onClick={addToCalendar}
          className="flex h-12 flex-1 min-h-[44px] items-center justify-center gap-2 rounded-pill bg-dark font-sans text-sm font-semibold text-inverse transition-colors duration-fast hover:bg-dark-alt"
        >
          📅 Add to Calendar
        </button>
        <button
          type="button"
          onClick={share}
          className="flex h-12 flex-1 min-h-[44px] items-center justify-center gap-2 rounded-pill border border-border-strong bg-surface font-sans text-sm font-semibold text-text transition-colors duration-fast hover:bg-surface-alt"
        >
          📤 Share
        </button>
      </div>

      <div className="mx-auto mt-4 flex max-w-md items-center justify-center gap-4">
        <Link to="/bookings" className="font-sans text-sm text-muted underline-offset-4 hover:underline">
          View my bookings
        </Link>
        <span className="text-light" aria-hidden="true">·</span>
        <Link to="/" className="font-sans text-sm text-muted underline-offset-4 hover:underline">
          Back to Explore
        </Link>
      </div>
    </div>
  )
}

function TicketCell({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: string
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wide text-light">{label}</p>
      <p
        className="mt-0.5 font-display text-base font-bold"
        style={{ color: accent ?? 'var(--color-text)' }}
      >
        {value}
      </p>
    </div>
  )
}
