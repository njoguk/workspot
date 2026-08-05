import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { PLATFORM_NAME, VENUE_PORTAL_NAME } from '@/config/platform'
import { cn } from '@/lib/utils'

/**
 * Venue Partner landing page (Phase 3 Part B, STEP 7). Public route at /partner.
 * Desktop-optimised 50/50 split: a dark pitch column on the left, a light tier
 * comparison on the right. Stacks vertically on mobile.
 */

const BENEFITS = [
  'Fill empty tables during off-peak hours',
  'Reach thousands of Nairobi remote workers',
  'Get paid instantly via M-Pesa — no cash handling',
  'Real reviews that build your WorkScore reputation',
]

interface Tier {
  name: string
  price: string
  cadence: string
  perks: string[]
  locked?: string[]
  featured?: boolean
  dark?: boolean
  badge?: string
}

const TIERS: Tier[] = [
  {
    name: 'Free',
    price: 'KES 0',
    cadence: '/mo',
    perks: ['Basic listing on the directory', 'Accept check-ins & reviews', 'WorkScore profile'],
    locked: ['Slot bookings', 'Priority placement', 'Analytics dashboard'],
  },
  {
    name: 'Premium',
    price: 'KES 3,500',
    cadence: '/mo',
    badge: 'Most Popular',
    featured: true,
    perks: [
      'Everything in Free',
      'Accept slot bookings',
      'Analytics dashboard',
      'Higher search placement',
      'Featured in neighbourhood',
    ],
  },
  {
    name: 'Featured',
    price: 'KES 8,000',
    cadence: '/mo',
    dark: true,
    perks: [
      'Everything in Premium',
      'Top of Editor’s Picks',
      'Homepage hero rotation',
      'Dedicated partner manager',
      'Event hosting priority',
      'Custom promotions',
    ],
  },
]

export default function PartnerLandingPage() {
  const navigate = useNavigate()

  return (
    <div className="full-bleed">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* ── Left: dark pitch ── */}
        <section className="relative overflow-hidden bg-dark px-6 py-14 md:px-12 lg:flex lg:min-h-[calc(100dvh_-_4rem)] lg:items-center lg:px-[60px] lg:py-24">
          {/* Subtle line pattern, 4% opacity */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, color-mix(in srgb, var(--color-text-inverse) 4%, transparent) 0px, color-mix(in srgb, var(--color-text-inverse) 4%, transparent) 1px, transparent 1px, transparent 22px)',
            }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 12% 8%, color-mix(in srgb, var(--color-primary) 22%, transparent) 0%, transparent 45%)',
            }}
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto max-w-lg text-inverse lg:ml-auto lg:mr-0"
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-secondary">
              {PLATFORM_NAME} · {VENUE_PORTAL_NAME}
            </p>
            <h1 className="mt-4 font-display text-[34px] font-bold leading-[1.1] md:text-[44px]">
              Your empty seats are money{' '}
              <span className="italic text-primary">left on the table.</span>
            </h1>
            <p
              className="mt-5 max-w-md font-sans text-base leading-relaxed"
              style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 72%, transparent)' }}
            >
              List your café, coworking space, hotel lobby or garden on {PLATFORM_NAME} and turn
              quiet hours into booked, paying remote workers.
            </p>

            <ul className="mt-8 space-y-4">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full"
                    style={{ background: 'color-mix(in srgb, var(--color-success) 28%, transparent)' }}
                    aria-hidden="true"
                  >
                    <Check size={14} className="text-success" />
                  </span>
                  <span className="font-sans text-[15px]">{b}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </section>

        {/* ── Right: tier comparison ── */}
        <section className="bg-surface px-6 py-14 md:px-12 lg:flex lg:min-h-[calc(100dvh_-_4rem)] lg:items-center lg:px-[60px] lg:py-24">
          <div className="mx-auto w-full max-w-xl">
            <h2 className="font-display text-[26px] font-bold text-text">Choose your listing type</h2>
            <p className="mt-2 font-sans text-sm text-muted">
              Start free, upgrade when you’re ready to take bookings. Change plans anytime.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {TIERS.map((tier) => (
                <TierCard key={tier.name} tier={tier} />
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate('/partner/dashboard')}
                className="flex h-12 min-h-[44px] flex-1 items-center justify-center rounded-pill bg-primary px-6 font-sans text-sm font-semibold text-inverse transition-opacity duration-fast hover:opacity-90"
              >
                Get Started — Free →
              </button>
              <a
                href="mailto:partners@remospot.com?subject=Listing%20my%20venue%20on%20RemoSpot"
                className="flex h-12 min-h-[44px] flex-1 items-center justify-center rounded-pill border border-border-strong px-6 font-sans text-sm font-semibold text-text transition-colors duration-fast hover:border-primary hover:text-primary"
              >
                Talk to us
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function TierCard({ tier }: { tier: Tier }) {
  return (
    <div
      className={cn(
        'relative flex flex-col rounded-lg p-5',
        tier.dark ? 'bg-dark text-inverse' : 'bg-bg',
        tier.featured ? 'border-2 border-primary shadow-md' : 'border border-border',
      )}
    >
      {tier.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-pill bg-primary px-3 py-1 font-mono text-[9px] font-medium uppercase tracking-wide text-inverse">
          {tier.badge}
        </span>
      )}
      <p
        className={cn(
          'font-mono text-[10px] uppercase tracking-[0.16em]',
          tier.dark ? 'text-secondary' : 'text-muted',
        )}
      >
        {tier.name}
      </p>
      <p className="mt-2 font-display text-2xl font-bold">
        {tier.price}
        <span
          className={cn('ml-1 font-sans text-sm font-normal', tier.dark ? 'text-inverse' : 'text-muted')}
          style={tier.dark ? { color: 'color-mix(in srgb, var(--color-text-inverse) 60%, transparent)' } : undefined}
        >
          {tier.cadence}
        </span>
      </p>

      <ul className="mt-4 space-y-2.5">
        {tier.perks.map((p) => (
          <li key={p} className="flex items-start gap-2 font-sans text-[12px]">
            <Check
              size={14}
              className={cn('mt-0.5 shrink-0', tier.dark ? 'text-secondary' : 'text-success')}
              aria-hidden="true"
            />
            <span className={tier.dark ? undefined : 'text-text'}>{p}</span>
          </li>
        ))}
        {tier.locked?.map((p) => (
          <li key={p} className="flex items-start gap-2 font-sans text-[12px] text-light">
            <X size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span className="line-through">{p}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
