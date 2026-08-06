import { useState } from 'react'
import { Check } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { initializePayment, openPaystackPopup } from '@/lib/paystack'
import { TIER_LABEL, type VenueTier } from '@/lib/partner'
import { Panel, SectionHeading } from '@/components/partner/partner-ui'
import { cn } from '@/lib/utils'
import type { PartnerVenue as Venue } from '@/hooks/useVenue'

/**
 * Upgrade Plan. Paid tiers run through the same Paystack flow as bookings and
 * WorkPass: initialize a transaction (Edge Function) → inline popup → the
 * paystack-webhook flips the spot's tier server-side after verifying payment.
 * (The Edge Function + webhook must handle the `partner_*` payment types — see
 * docs/PAYSTACK_DEPLOY.md; until deployed, starting a payment surfaces an error.)
 */

type PaidTier = Exclude<VenueTier, 'free'>

const TIER_PRICE: Record<PaidTier, number> = { premium: 3500, featured: 8000 }

interface UpgradeTier {
  id: PaidTier
  price: string
  perks: string[]
}

const UPGRADES: UpgradeTier[] = [
  {
    id: 'premium',
    price: 'KES 3,500/mo',
    perks: [
      'Accept slot bookings',
      'Full analytics dashboard',
      'Higher search placement',
      'Featured in your neighbourhood',
    ],
  },
  {
    id: 'featured',
    price: 'KES 8,000/mo',
    perks: [
      'Everything in Premium',
      'Top of Editor’s Picks',
      'Homepage hero rotation',
      'Dedicated partner manager',
      'Event hosting priority',
    ],
  },
]

const RANK: Record<VenueTier, number> = { free: 0, premium: 1, featured: 2 }

export function VenueUpgrade({ venue }: { venue: Venue | null }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState<PaidTier | null>(null)
  const [error, setError] = useState<string | null>(null)

  const current: VenueTier = venue?.tier ?? 'free'

  async function handleUpgrade(tier: PaidTier) {
    if (!venue) {
      setError('Create your listing before upgrading.')
      return
    }
    if (!user?.email) {
      setError('You need to be signed in to upgrade.')
      return
    }
    setError(null)
    setBusy(tier)
    try {
      const { access_code } = await initializePayment({
        amountKes: TIER_PRICE[tier],
        email: user.email,
        paymentType: tier === 'premium' ? 'partner_premium' : 'partner_featured',
        spotId: venue.spotId,
        userId: user.id,
      })
      openPaystackPopup(access_code, {
        onSuccess: () => {
          setBusy(null)
          showToast('Payment received — your plan updates shortly.', { icon: '🎉' })
          queryClient.invalidateQueries({ queryKey: ['venue'] })
          queryClient.invalidateQueries({ queryKey: ['spots'] })
        },
        onCancel: () => setBusy(null),
        onError: (message) => {
          setError(message)
          setBusy(null)
        },
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the payment.')
      setBusy(null)
    }
  }

  return (
    <div>
      <SectionHeading title="Upgrade Plan" subtitle="Unlock bookings and reach more remote workers" />

      <Panel className="mb-5">
        <p className="font-mono text-[10px] uppercase tracking-wide text-light">Current plan</p>
        <p className="mt-1 font-display text-xl font-bold text-text">{TIER_LABEL[current]}</p>
      </Panel>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-md p-3 font-sans text-[13px] text-primary"
          style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}
        >
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {UPGRADES.map((tier) => {
          const isCurrent = RANK[current] >= RANK[tier.id]
          return (
            <div
              key={tier.id}
              className={cn(
                'flex flex-col rounded-lg p-5',
                tier.id === 'featured' ? 'bg-dark text-inverse' : 'border-2 border-primary bg-surface',
              )}
            >
              <p
                className={cn(
                  'font-mono text-[10px] uppercase tracking-[0.16em]',
                  tier.id === 'featured' ? 'text-secondary' : 'text-muted',
                )}
              >
                {TIER_LABEL[tier.id]}
              </p>
              <p className="mt-2 font-display text-2xl font-bold">{tier.price}</p>
              <ul className="mt-4 flex-1 space-y-2.5">
                {tier.perks.map((p) => (
                  <li key={p} className="flex items-start gap-2 font-sans text-[13px]">
                    <Check
                      size={14}
                      className={cn(
                        'mt-0.5 shrink-0',
                        tier.id === 'featured' ? 'text-secondary' : 'text-success',
                      )}
                      aria-hidden="true"
                    />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <span
                  className={cn(
                    'mt-5 inline-flex h-11 items-center justify-center rounded-pill font-sans text-sm font-medium',
                    tier.id === 'featured' ? undefined : 'border border-border-strong text-muted',
                  )}
                  style={
                    tier.id === 'featured'
                      ? { border: '1px solid color-mix(in srgb, var(--color-text-inverse) 25%, transparent)' }
                      : undefined
                  }
                >
                  Your current plan
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleUpgrade(tier.id)}
                  disabled={busy !== null}
                  className={cn(
                    'mt-5 inline-flex h-11 min-h-[44px] items-center justify-center rounded-pill px-5 font-sans text-sm font-semibold transition-opacity duration-fast hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60',
                    tier.id === 'featured' ? 'bg-secondary text-dark' : 'bg-primary text-inverse',
                  )}
                >
                  {busy === tier.id ? 'Starting…' : `Upgrade to ${TIER_LABEL[tier.id]} →`}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
