import { useState } from 'react'
import { useToast } from '@/contexts/ToastContext'
import { useUpdatePayoutNumber, type PartnerVenue } from '@/hooks/useVenue'
import { TIER_LABEL } from '@/lib/partner'
import { spotTypeLabel } from '@/lib/spot-format'
import { formatKenyanPhone, isValidKenyanPhone, toPaystackPhone } from '@/lib/phone'
import { Panel, SectionHeading } from '@/components/partner/partner-ui'

/**
 * Settings. A read-only summary of the current listing (edit via the Listing
 * tab) plus the payout M-Pesa number, which is a real, owner-scoped write.
 */

export function VenueSettings({
  venue,
  onEdit,
}: {
  venue: PartnerVenue | null
  onEdit: () => void
}) {
  const { showToast } = useToast()
  const updatePayout = useUpdatePayoutNumber()
  const [phone, setPhone] = useState(() =>
    venue?.payoutMpesaNumber ? formatKenyanPhone(venue.payoutMpesaNumber) : '',
  )

  if (!venue) {
    return (
      <div>
        <SectionHeading title="Settings" />
        <Panel>
          <p className="font-sans text-sm text-muted">Create a listing first to manage settings.</p>
          <button
            type="button"
            onClick={onEdit}
            className="mt-4 inline-flex h-11 min-h-[44px] items-center rounded-pill bg-primary px-5 font-sans text-sm font-semibold text-inverse"
          >
            Create your listing →
          </button>
        </Panel>
      </div>
    )
  }

  const phoneValid = phone === '' || isValidKenyanPhone(phone)

  async function savePayout() {
    if (!venue) return
    try {
      await updatePayout.mutateAsync({
        spotId: venue.spotId,
        mpesaNumber: toPaystackPhone(phone) ?? '',
      })
      showToast('Payout number saved', { icon: '✅' })
    } catch {
      showToast('Could not save — please try again', { icon: '⚠️' })
    }
  }

  return (
    <div>
      <SectionHeading title="Settings" subtitle="Your listing and payout details" />

      {/* Listing summary */}
      <Panel>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-display text-lg font-bold text-text">{venue.name}</p>
            <p className="mt-0.5 font-mono text-[12px] text-muted">
              {venue.neighbourhood} · {spotTypeLabel(venue.type)}
            </p>
          </div>
          <span className="shrink-0 rounded-pill bg-secondary px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide text-dark">
            {TIER_LABEL[venue.tier]}
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Discount" value={`${venue.workpassDiscountPct}%`} />
          <Stat label="Max seats" value={String(venue.maxSeatsPerSlot)} />
          <Stat label="Slot length" value={`${venue.slotDurationHours}h`} />
          <Stat label="Book ahead" value={`${venue.advanceBookingDays}d`} />
        </dl>

        <button
          type="button"
          onClick={onEdit}
          className="mt-5 inline-flex h-11 min-h-[44px] items-center rounded-pill border border-border-strong px-5 font-sans text-sm font-semibold text-text transition-colors duration-fast hover:border-primary hover:text-primary"
        >
          Edit listing
        </button>
      </Panel>

      {/* Payout number */}
      <Panel className="mt-5">
        <h3 className="font-display text-lg font-bold text-text">Payout M-Pesa number</h3>
        <p className="mt-1 font-sans text-sm text-muted">
          Where Paystack sends your withdrawals.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(formatKenyanPhone(e.target.value))}
            placeholder="+254 7XX XXX XXX"
            aria-label="Payout M-Pesa number"
            className="h-11 flex-1 rounded-md border border-border bg-bg px-3 font-mono text-sm text-text outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={savePayout}
            disabled={!phoneValid || updatePayout.isPending}
            className="inline-flex h-11 min-h-[44px] items-center justify-center rounded-pill bg-primary px-5 font-sans text-sm font-semibold text-inverse transition-opacity duration-fast hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {updatePayout.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
        {!phoneValid && (
          <p className="mt-2 font-sans text-[12px] text-primary">Enter a valid Kenyan mobile number.</p>
        )}
      </Panel>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-wide text-light">{label}</dt>
      <dd className="mt-1 font-display text-lg font-bold text-text">{value}</dd>
    </div>
  )
}
