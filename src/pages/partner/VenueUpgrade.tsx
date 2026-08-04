import { Check } from 'lucide-react'
import { TIER_LABEL, type VenueTier } from '@/lib/partner'
import { Panel, SectionHeading } from '@/components/partner/partner-ui'
import { cn } from '@/lib/utils'
import type { PartnerVenue as Venue } from '@/hooks/useVenue'

/**
 * Upgrade Plan. Presents the paid tiers above the current one. Venue-tier
 * billing runs through a Paystack partner subscription in production; here the
 * CTA opens a conversation (no client-side charge).
 */

interface UpgradeTier {
  id: Exclude<VenueTier, 'free'>
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
  const current: VenueTier = venue?.tier ?? 'free'

  return (
    <div>
      <SectionHeading title="Upgrade Plan" subtitle="Unlock bookings and reach more remote workers" />

      <Panel className="mb-5">
        <p className="font-mono text-[10px] uppercase tracking-wide text-light">Current plan</p>
        <p className="mt-1 font-display text-xl font-bold text-text">{TIER_LABEL[current]}</p>
      </Panel>

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
                <a
                  href={`mailto:partners@remospot.com?subject=Upgrade%20to%20${TIER_LABEL[tier.id]}`}
                  className={cn(
                    'mt-5 inline-flex h-11 min-h-[44px] items-center justify-center rounded-pill px-5 font-sans text-sm font-semibold transition-opacity duration-fast hover:opacity-90',
                    tier.id === 'featured' ? 'bg-secondary text-dark' : 'bg-primary text-inverse',
                  )}
                >
                  Upgrade to {TIER_LABEL[tier.id]} →
                </a>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
