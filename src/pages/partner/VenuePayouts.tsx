import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useToast } from '@/contexts/ToastContext'
import type { PartnerData } from '@/lib/partner'
import type { PartnerVenue } from '@/hooks/useVenue'
import { formatKES } from '@/lib/booking'
import { Panel, SectionHeading, StatusChip } from '@/components/partner/partner-ui'
import { cn } from '@/lib/utils'

/**
 * Payouts (STEP 12). Summary cards + a withdraw-to-M-Pesa intent. The actual
 * transfer runs through Paystack's Transfers API in production; here the button
 * only records intent (a toast) — no funds move from the client.
 */

export function VenuePayouts({ venue, data }: { venue: PartnerVenue; data: PartnerData }) {
  const { payouts } = data
  const { showToast } = useToast()
  const [confirming, setConfirming] = useState(false)

  const destination = venue.payoutMpesaNumber ?? 'your M-Pesa number'

  function handleWithdraw() {
    setConfirming(false)
    showToast('Payout requested — sent via Paystack in production', { icon: '💸' })
  }

  return (
    <div>
      <SectionHeading title="Payouts" subtitle="Your earnings and withdrawals" />

      {/* 2×2 summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <SummaryCard
          label="Available to withdraw"
          value={payouts.availableKes}
          highlight
        />
        <SummaryCard label="Total earned" value={payouts.totalEarnedKes} />
        <SummaryCard label="This month" value={payouts.thisMonthKes} />
        <SummaryCard label="Commission" value={payouts.commissionPct} suffix="%" plain />
      </div>

      {/* Withdraw CTA */}
      <div className="mt-6">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={payouts.availableKes <= 0}
          className="inline-flex h-12 min-h-[44px] items-center justify-center rounded-pill bg-success px-6 font-sans text-sm font-semibold text-inverse transition-opacity duration-fast hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55"
        >
          Withdraw to M-Pesa via Paystack
        </button>
        <p className="mt-2 font-sans text-[12px] text-muted">
          Withdrawals are sent to {destination} via Paystack Transfers.
        </p>
      </div>

      {/* History */}
      <div className="mt-8">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-light">
          Payout history
        </p>
        <Panel className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border">
                  {['Period', 'Amount', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 font-mono text-[10px] uppercase tracking-wide text-light">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payouts.history.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-sans text-sm text-text">{row.date}</td>
                    <td className="px-4 py-3 font-mono text-[13px] text-text">{formatKES(row.amount)}</td>
                    <td className="px-4 py-3">
                      <StatusChip kind={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* Confirmation modal */}
      <AnimatePresence>
        {confirming && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-dark/50"
              style={{ background: 'color-mix(in srgb, var(--color-dark) 50%, transparent)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirming(false)}
              aria-hidden="true"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Confirm withdrawal"
              className="fixed inset-x-4 top-1/2 z-[61] mx-auto max-w-sm -translate-y-1/2 rounded-xl bg-surface p-6 shadow-lg"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <h3 className="font-display text-xl font-bold text-text">Withdraw funds</h3>
              <p className="mt-2 font-sans text-sm text-muted">
                Send{' '}
                <span className="font-semibold text-text">{formatKES(payouts.availableKes)}</span> to{' '}
                {destination}? Paystack processes M-Pesa transfers within minutes.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={handleWithdraw}
                  className="flex h-11 flex-1 min-h-[44px] items-center justify-center rounded-pill bg-success font-sans text-sm font-semibold text-inverse transition-opacity duration-fast hover:opacity-90"
                >
                  Confirm withdrawal
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="flex h-11 flex-1 min-h-[44px] items-center justify-center rounded-pill border border-border-strong font-sans text-sm font-medium text-text transition-colors duration-fast hover:border-primary hover:text-primary"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  highlight,
  plain,
  suffix,
}: {
  label: string
  value: number
  highlight?: boolean
  plain?: boolean
  suffix?: string
}) {
  return (
    <div
      className={cn(
        'rounded-lg p-5',
        highlight ? 'bg-dark text-inverse' : 'border border-border bg-surface',
      )}
    >
      <p
        className={cn(
          'font-mono text-[10px] uppercase tracking-wide',
          highlight ? undefined : 'text-light',
        )}
        style={highlight ? { color: 'color-mix(in srgb, var(--color-text-inverse) 60%, transparent)' } : undefined}
      >
        {label}
      </p>
      <p
        className={cn(
          'mt-2 font-display text-2xl font-bold',
          highlight ? 'text-secondary' : 'text-text',
        )}
      >
        {plain ? `${value}${suffix ?? ''}` : formatKES(value)}
      </p>
    </div>
  )
}
