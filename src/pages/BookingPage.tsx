import { useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useSpot } from '@/hooks/useSpots'
import { useAuth } from '@/contexts/AuthContext'
import { useIsWorkPassMember } from '@/hooks/useWorkPass'
import { initializePayment, openPaystackPopup } from '@/lib/paystack'
import { formatKenyanPhone, toPaystackPhone } from '@/lib/phone'
import {
  useCreateBooking,
  useOccupancyRealtime,
  useSlotOccupancy,
  useVenueSettings,
} from '@/hooks/useBookings'
import {
  SLOTS,
  formatKES,
  occupancyRatio,
  slotAvailability,
  slotRangeLabel,
  workpassDiscount,
  type SlotAvailability,
} from '@/lib/booking'
import { spotTypeLabel } from '@/lib/spot-format'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

/** Build the next `count` calendar days starting today (local). */
function buildDateStrip(count: number): { iso: string; weekday: string; day: string }[] {
  const out: { iso: string; weekday: string; day: string }[] = []
  const base = new Date()
  base.setHours(12, 0, 0, 0)
  for (let i = 0; i < count; i++) {
    const d = new Date(base.getTime() + i * 24 * 60 * 60 * 1000)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    out.push({
      iso: `${y}-${m}-${day}`,
      weekday: i === 0 ? 'Today' : d.toLocaleDateString('en-GB', { weekday: 'short' }),
      day: String(d.getDate()),
    })
  }
  return out
}

const availabilityColor: Record<SlotAvailability, string> = {
  open: 'var(--color-success)',
  filling: 'var(--color-secondary)',
  full: 'var(--color-primary)',
}

export default function BookingPage() {
  const { spotId } = useParams<{ spotId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()
  const { isActive } = useIsWorkPassMember()

  const { data: spot, isLoading: spotLoading, isError: spotError } = useSpot(spotId)
  const { data: settings } = useVenueSettings(spotId)
  const pct = settings?.workpassDiscountPct ?? 30
  const maxSeats = settings?.maxSeatsPerSlot ?? 30
  const advanceDays = settings?.advanceBookingDays ?? 7

  const dates = useMemo(() => buildDateStrip(Math.max(1, advanceDays)), [advanceDays])
  const [selectedDate, setSelectedDate] = useState(dates[0].iso)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [step, setStep] = useState<'slot' | 'review'>('slot')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)

  const { data: occupancy } = useSlotOccupancy(spotId, selectedDate)
  useOccupancyRealtime(spotId, selectedDate)
  const createBooking = useCreateBooking()

  // Wait for auth + the profile row to resolve before gating — otherwise a
  // genuine member who lands here directly (or refreshes) is bounced to
  // /workpass during the brief window where the profile is still loading.
  if (authLoading || (user && !profile)) return <BookingSkeleton />

  // Gate: WorkPass members only. Send free users to the upgrade flow.
  if (!isActive) {
    return <Navigate to="/workpass" replace state={{ from: location.pathname }} />
  }

  if (spotLoading) return <BookingSkeleton />
  if (spotError || !spot) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h1 className="font-display text-2xl font-bold text-text">Spot not found</h1>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-5 inline-flex h-11 min-h-[44px] items-center rounded-pill bg-primary px-5 font-sans text-sm font-semibold text-inverse"
        >
          Back to Explore
        </button>
      </div>
    )
  }

  const slot = selectedSlot ? SLOTS.find((s) => s.key === selectedSlot) ?? null : null
  const discount = slot ? workpassDiscount(slot.standard, pct) : 0
  const total = slot ? slot.standard - discount : 0

  async function confirm() {
    if (!slot || !user || !spot) return
    if (!user.email) {
      setError('Your account has no email on file — add one to pay.')
      return
    }
    setError(null)
    setPaying(true)
    try {
      // 1. Create the booking as 'pending'. The Paystack webhook flips it to
      //    'confirmed' once payment settles (a pending row holds no seat).
      const booking = await createBooking.mutateAsync({
        spotId: spot.id,
        slotDate: selectedDate,
        slotStart: slot.start,
        slotEnd: slot.end,
        standardPrice: slot.standard,
        pricePaid: total,
        workpassDiscount: discount,
        paymentMethod: 'paystack',
      })

      // 2. Initialise the Paystack transaction server-side.
      const { access_code } = await initializePayment({
        amountKes: total,
        email: user.email,
        paymentType: 'booking',
        bookingId: booking.id,
        phoneNumber: toPaystackPhone(phone),
        userId: user.id,
      })

      // 3. Open the popup — it runs the full M-Pesa STK push / card flow and
      //    closes itself. We only navigate on a completed payment.
      openPaystackPopup(access_code, {
        onSuccess: () => navigate(`/booking/${booking.id}/confirm`),
        onCancel: () => {
          setError('Payment cancelled. Please try again.')
          setPaying(false)
        },
        onError: (msg) => {
          setError(msg || 'Payment could not be started. Please try again.')
          setPaying(false)
        },
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start payment — try again.')
      setPaying(false)
    }
  }

  const headerHeight = step === 'slot' ? 'h-[150px]' : 'h-[100px]'

  return (
    <div className="pb-28">
      {/* Spot header */}
      <section
        className={cn('full-bleed relative overflow-hidden', headerHeight)}
        style={{ background: spot.coverGradient }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, color-mix(in srgb, var(--color-dark) 88%, transparent) 0%, color-mix(in srgb, var(--color-dark) 35%, transparent) 70%, color-mix(in srgb, var(--color-dark) 25%, transparent) 100%)',
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto flex h-full max-w-content flex-col justify-between px-4 py-3 md:px-10 lg:px-[60px]">
          <button
            type="button"
            onClick={() => (step === 'review' ? setStep('slot') : navigate(-1))}
            aria-label="Go back"
            className="grid h-10 w-10 place-items-center rounded-full bg-surface text-dark shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold leading-tight text-inverse">
              {spot.name}
            </h1>
            <p
              className="mt-0.5 font-mono text-[11px] uppercase tracking-wide"
              style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 65%, transparent)' }}
            >
              {spot.neighbourhood} · {spotTypeLabel(spot.type)}
            </p>
          </div>
        </div>
      </section>

      {step === 'slot' ? (
        <div className="pt-6">
          {/* Date strip */}
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-light">
            Pick a date
          </h2>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
            {dates.map((d) => {
              const active = d.iso === selectedDate
              return (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => {
                    setSelectedDate(d.iso)
                    setSelectedSlot(null)
                  }}
                  aria-pressed={active}
                  className={cn(
                    'flex min-h-[64px] w-[58px] shrink-0 flex-col items-center justify-center rounded-md bg-surface transition-colors duration-fast',
                    active ? 'border-2 border-primary' : 'border border-border',
                  )}
                >
                  <span className="font-mono text-[10px] uppercase tracking-wide text-muted">
                    {d.weekday}
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 font-display text-lg font-bold',
                      active ? 'text-primary' : 'text-text',
                    )}
                  >
                    {d.day}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Slot list */}
          <h2 className="mb-3 mt-7 font-mono text-[11px] uppercase tracking-widest text-light">
            Choose a slot
          </h2>
          <ul className="space-y-3">
            {SLOTS.map((s) => {
              const booked = occupancy?.[s.start] ?? 0
              const avail = slotAvailability(booked, maxSeats)
              const ratio = occupancyRatio(booked, maxSeats)
              const full = avail === 'full'
              const active = selectedSlot === s.key
              const discounted = s.standard - workpassDiscount(s.standard, pct)
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    disabled={full}
                    onClick={() => setSelectedSlot(s.key)}
                    aria-pressed={active}
                    className={cn(
                      'flex w-full items-center gap-4 rounded-lg bg-surface p-4 text-left transition-colors duration-fast disabled:cursor-not-allowed disabled:opacity-55',
                      active ? 'border-2 border-primary' : 'border border-border',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-sans text-sm font-semibold text-text">
                        {s.label}
                      </p>
                      <p className="font-mono text-[11px] text-muted">
                        {slotRangeLabel(s.start, s.end)}
                      </p>
                      {/* Availability bar */}
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-pill bg-surface-alt">
                        <div
                          className="h-full rounded-pill"
                          style={{
                            width: `${Math.max(6, ratio * 100)}%`,
                            background: availabilityColor[avail],
                          }}
                        />
                      </div>
                      <p className="mt-1 font-mono text-[10px] text-light">
                        {full ? 'Fully booked' : `${maxSeats - booked} of ${maxSeats} seats left`}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-mono text-[11px] text-light line-through">
                        {formatKES(s.standard)}
                      </p>
                      <p className="font-display text-lg font-bold text-primary">
                        {formatKES(discounted)}
                      </p>
                      <p className="font-mono text-[9px] uppercase tracking-wide text-success">
                        Pass −{pct}%
                      </p>
                    </div>

                    {/* Selection circle */}
                    <span
                      className={cn(
                        'grid h-6 w-6 shrink-0 place-items-center rounded-full border-2',
                        active ? 'border-primary bg-primary' : 'border-border-strong',
                      )}
                      aria-hidden="true"
                    >
                      {active && <span className="h-2 w-2 rounded-full bg-inverse" />}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          {/* Continue */}
          <div className="fixed inset-x-0 bottom-[68px] z-40 border-t border-border bg-surface md:bottom-0">
            <div className="mx-auto flex max-w-content px-4 py-3 md:px-10 lg:px-[60px]">
              <button
                type="button"
                disabled={!selectedSlot}
                onClick={() => setStep('review')}
                className="flex h-12 w-full min-h-[44px] items-center justify-center rounded-pill bg-primary font-sans text-sm font-semibold text-inverse transition-opacity duration-fast hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Review Booking →
              </button>
            </div>
          </div>
        </div>
      ) : (
        <ReviewStep
          slotLabel={slot ? `${slot.label} · ${slotRangeLabel(slot.start, slot.end)}` : ''}
          standard={slot?.standard ?? 0}
          discount={discount}
          total={total}
          phone={phone}
          onPhoneChange={(v) => setPhone(formatKenyanPhone(v))}
          submitting={paying}
          error={error}
          onConfirm={confirm}
        />
      )}
    </div>
  )
}

// ── Review step ────────────────────────────────────────────────

function ReviewStep({
  slotLabel,
  standard,
  discount,
  total,
  phone,
  onPhoneChange,
  submitting,
  error,
  onConfirm,
}: {
  slotLabel: string
  standard: number
  discount: number
  total: number
  phone: string
  onPhoneChange: (v: string) => void
  submitting: boolean
  error: string | null
  onConfirm: () => void
}) {
  const cream72 = 'color-mix(in srgb, var(--color-text-inverse) 72%, transparent)'
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="pt-6"
    >
      {/* Summary card */}
      <div
        className="rounded-lg p-5"
        style={{
          background: 'linear-gradient(135deg, var(--color-dark-alt) 0%, var(--color-dark) 100%)',
        }}
      >
        <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: cream72 }}>
          Your slot
        </p>
        <p className="mt-1 font-display text-lg font-bold text-inverse">{slotLabel}</p>

        <div
          className="my-4 h-px"
          style={{ background: 'color-mix(in srgb, var(--color-text-inverse) 12%, transparent)' }}
        />

        <Row label="Standard rate" value={formatKES(standard)} color={cream72} />
        <div className="flex items-center justify-between py-1">
          <span className="font-sans text-sm" style={{ color: cream72 }}>
            WorkPass discount
          </span>
          <span className="font-sans text-sm font-medium text-success">
            −{formatKES(discount)}
          </span>
        </div>
        <div
          className="my-3 h-px"
          style={{ background: 'color-mix(in srgb, var(--color-text-inverse) 12%, transparent)' }}
        />
        <div className="flex items-center justify-between">
          <span className="font-sans text-sm font-semibold text-inverse">Total</span>
          <span className="font-display text-xl font-bold text-secondary">
            {formatKES(total)}
          </span>
        </div>
      </div>

      {/* Payment */}
      <h2 className="mb-3 mt-6 font-mono text-[11px] uppercase tracking-widest text-light">
        Payment
      </h2>
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4">
        <span className="text-xl" aria-hidden="true">📱</span>
        <div className="min-w-0">
          <p className="font-sans text-sm font-semibold text-text">M-Pesa or card</p>
          <p className="font-sans text-[12px] text-muted">Paid securely via Paystack.</p>
        </div>
      </div>

      {/* Optional M-Pesa number — pre-fills the STK push in the popup. */}
      <div className="mt-4">
        <label htmlFor="booking-mpesa" className="font-mono text-[11px] uppercase tracking-[0.14em] text-light">
          M-Pesa number <span className="normal-case tracking-normal">(optional)</span>
        </label>
        <input
          id="booking-mpesa"
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="+254 7XX XXX XXX"
          aria-label="M-Pesa phone number (optional)"
          className="mt-2 h-12 w-full rounded-md border border-border bg-surface px-4 font-mono text-base text-text outline-none focus:border-primary"
        />
        <p className="mt-1.5 font-sans text-[11px] text-muted">
          Leave blank to enter it in the payment popup.
        </p>
      </div>

      <p className="mt-4 flex items-start gap-2 font-sans text-[12px] text-muted">
        <span aria-hidden="true">⏳</span>
        We&rsquo;ll hold your seat for 10 minutes. Confirm to lock it in.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md p-3 font-sans text-[13px] text-primary"
          style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}
        >
          {error}
        </p>
      )}

      {/* Confirm bar */}
      <div className="fixed inset-x-0 bottom-[68px] z-40 border-t border-border bg-surface md:bottom-0">
        <div className="mx-auto flex max-w-content px-4 py-3 md:px-10 lg:px-[60px]">
          <button
            type="button"
            disabled={submitting}
            onClick={onConfirm}
            className="flex h-12 w-full min-h-[44px] items-center justify-center rounded-pill bg-success font-sans text-sm font-semibold text-inverse transition-opacity duration-fast hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {submitting ? 'Starting payment…' : `Confirm & Pay · ${formatKES(total)}`}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="font-sans text-sm" style={{ color }}>
        {label}
      </span>
      <span className="font-sans text-sm font-medium text-inverse">{value}</span>
    </div>
  )
}

function BookingSkeleton() {
  return (
    <div className="pb-28">
      <Skeleton className="full-bleed h-[150px] rounded-none" />
      <div className="space-y-4 pt-6">
        <Skeleton className="h-16 w-full rounded-md" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
