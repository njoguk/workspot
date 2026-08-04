import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check } from 'lucide-react'
import { PLATFORM_NAME, SUBSCRIPTION_NAME } from '@/config/platform'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import {
  useActivateWorkPass,
  useCancelWorkPass,
  useIsWorkPassMember,
  type WorkPassPlan,
} from '@/hooks/useWorkPass'
import { WorkPassCard } from '@/components/workpass/WorkPassCard'
import { formatKES } from '@/lib/booking'
import { cn } from '@/lib/utils'

type Screen = 'pitch' | 'plans' | 'payment'

interface PlanSpec {
  id: WorkPassPlan
  name: string
  monthly: number
  billedNow: number
  badge?: string
  note: string
  savings?: string
  features: string[]
}

const PLANS: Record<WorkPassPlan, PlanSpec> = {
  monthly: {
    id: 'monthly',
    name: 'Monthly',
    monthly: 1200,
    billedNow: 1200,
    note: 'Cancel anytime',
    features: ['Book any spot ahead', '30% off every slot', 'Member badge'],
  },
  annual: {
    id: 'annual',
    name: 'Annual',
    monthly: 900,
    billedNow: 10800,
    badge: 'Best value',
    note: 'Billed KES 10,800 yearly',
    savings: 'Saves KES 3,600/yr',
    features: [
      'Book any spot ahead',
      '30% off every slot',
      'Priority seats at busy spots',
      'Member badge + early event access',
    ],
  },
}

const PERKS = [
  { icon: '📅', title: 'Book ahead', desc: 'Reserve your seat before you arrive' },
  { icon: '💸', title: '30% off', desc: 'Member rate on every slot' },
  { icon: '⭐', title: 'Priority seats', desc: 'First pick at the busiest spots' },
  { icon: '🏆', title: 'Member badge', desc: 'Show your status in the community' },
]

// ── Kenyan phone formatting ────────────────────────────────────

/** Normalise arbitrary input to "+254 7XX XXX XXX". */
function formatKenyanPhone(input: string): string {
  let digits = input.replace(/\D/g, '')
  if (digits.startsWith('254')) digits = digits.slice(3)
  if (digits.startsWith('0')) digits = digits.slice(1)
  digits = digits.slice(0, 9)
  const groups = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)].filter(Boolean)
  return groups.length ? `+254 ${groups.join(' ')}` : '+254 '
}

/** A complete Kenyan mobile number (9 subscriber digits starting 7 or 1). */
function isValidKenyanPhone(formatted: string): boolean {
  const digits = formatted.replace(/\D/g, '').replace(/^254/, '')
  return digits.length === 9 && /^[17]/.test(digits)
}

export default function WorkPassPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useAuth()
  const { isActive, expiresAt, daysLeft } = useIsWorkPassMember()
  const activate = useActivateWorkPass()
  const { showToast } = useToast()

  const [screen, setScreen] = useState<Screen>('pitch')
  const [plan, setPlan] = useState<WorkPassPlan>('annual')
  const [phone, setPhone] = useState('')
  const [done, setDone] = useState(false)

  const from = (location.state as { from?: string } | null)?.from
  const returnTo = from && from !== '/workpass' ? from : '/'

  const selected = PLANS[plan]

  async function handlePay() {
    try {
      await activate.mutateAsync(plan)
      setDone(true)
      showToast('WorkPass activated', { icon: '🏆' })
    } catch {
      showToast('Could not activate — please try again', { icon: '⚠️' })
    }
  }

  function goBack() {
    if (screen === 'payment') setScreen('plans')
    else if (screen === 'plans') setScreen('pitch')
    else navigate(-1)
  }

  return (
    <div
      className="full-bleed relative min-h-[calc(100dvh_-_4rem)] overflow-hidden bg-dark"
      style={{ color: 'var(--color-text-inverse)' }}
    >
      {/* Radial gold gradient, top-right */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 85% 6%, color-mix(in srgb, var(--color-secondary) 20%, transparent) 0%, transparent 46%)',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-lg px-4 py-6 md:py-10">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            aria-label="Go back"
            className="grid h-11 w-11 min-h-[44px] min-w-[44px] place-items-center rounded-pill"
            style={{ background: 'color-mix(in srgb, var(--color-text-inverse) 10%, transparent)' }}
          >
            <ArrowLeft size={18} />
          </button>
          {!done && !isActive && (
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {(['pitch', 'plans', 'payment'] as Screen[]).map((s) => (
                <span
                  key={s}
                  className="h-1.5 rounded-pill transition-all duration-normal"
                  style={{
                    width: s === screen ? 22 : 8,
                    background:
                      s === screen
                        ? 'var(--color-secondary)'
                        : 'color-mix(in srgb, var(--color-text-inverse) 22%, transparent)',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Each screen animates in on mount. We intentionally do NOT use
            AnimatePresence mode="wait" here: gating the next screen on an exit
            animation can strand this upgrade/payment flow if the tab is
            backgrounded mid-transition (rAF pauses → exit never completes). */}
        {done ? (
          <SuccessScreen
            key="done"
            profile={profile}
            alreadyMember={isActive}
            onContinue={() => navigate(returnTo)}
          />
        ) : isActive ? (
          <MemberScreen
            key="member"
            profile={profile}
            daysLeft={daysLeft}
            expiresAt={expiresAt}
            onBrowse={() => navigate('/')}
            onBookings={() => navigate('/bookings')}
          />
        ) : screen === 'pitch' ? (
          <PitchScreen key="pitch" profile={profile} onNext={() => setScreen('plans')} />
        ) : screen === 'plans' ? (
          <PlansScreen
            key="plans"
            plan={plan}
            onSelect={setPlan}
            onContinue={() => setScreen('payment')}
          />
        ) : (
          <PaymentScreen
            key="payment"
            spec={selected}
            phone={phone}
            onPhoneChange={(v) => setPhone(formatKenyanPhone(v))}
            phoneValid={isValidKenyanPhone(phone)}
            submitting={activate.isPending}
            onPay={handlePay}
          />
        )}
      </div>
    </div>
  )
}

// ── Screen transitions ─────────────────────────────────────────

const screenMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
}

const cream60 = 'color-mix(in srgb, var(--color-text-inverse) 60%, transparent)'
const cream72 = 'color-mix(in srgb, var(--color-text-inverse) 72%, transparent)'

// ── Screen 1 — Pitch ───────────────────────────────────────────

function PitchScreen({
  profile,
  onNext,
}: {
  profile: ReturnType<typeof useAuth>['profile']
  onNext: () => void
}) {
  return (
    <motion.div {...screenMotion}>
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-secondary">
        {SUBSCRIPTION_NAME}
      </p>
      <h1 className="mt-2 font-display text-[28px] font-bold leading-tight">
        One pass. <span className="italic text-secondary">Every spot.</span>
      </h1>
      <p className="mt-2 font-sans text-sm" style={{ color: cream72 }}>
        Book ahead, skip the queue, and save 30% at Nairobi&rsquo;s best workspaces —
        cafés, hotels, gardens and coworking, all on one membership.
      </p>

      <div className="mt-6">
        <WorkPassCard profile={profile} variant="full" />
      </div>

      {/* 2×2 perks grid */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {PERKS.map((perk) => (
          <div
            key={perk.title}
            className="rounded-md p-4"
            style={{
              background: 'color-mix(in srgb, var(--color-text-inverse) 7%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-text-inverse) 10%, transparent)',
            }}
          >
            <span className="text-xl" aria-hidden="true">
              {perk.icon}
            </span>
            <p className="mt-2 font-sans text-sm font-semibold">{perk.title}</p>
            <p className="mt-0.5 font-sans text-[11px] leading-snug" style={{ color: cream60 }}>
              {perk.desc}
            </p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onNext}
        className="mt-7 flex h-12 w-full min-h-[44px] items-center justify-center rounded-pill bg-secondary font-sans text-sm font-semibold text-dark transition-opacity duration-fast hover:opacity-90"
      >
        See plans &amp; pricing →
      </button>
    </motion.div>
  )
}

// ── Screen 2 — Plan selector ───────────────────────────────────

function PlansScreen({
  plan,
  onSelect,
  onContinue,
}: {
  plan: WorkPassPlan
  onSelect: (p: WorkPassPlan) => void
  onContinue: () => void
}) {
  const selected = PLANS[plan]
  const other = plan === 'annual' ? PLANS.monthly : PLANS.annual

  return (
    <motion.div {...screenMotion}>
      <h1 className="font-display text-[26px] font-bold leading-tight">Choose your plan</h1>
      <p className="mt-1 font-sans text-sm" style={{ color: cream72 }}>
        Cancel anytime. Prices in Kenyan shillings.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <PlanCard spec={PLANS.annual} selected={plan === 'annual'} onSelect={() => onSelect('annual')} />
        <PlanCard spec={PLANS.monthly} selected={plan === 'monthly'} onSelect={() => onSelect('monthly')} />
      </div>

      {/* Corporate callout */}
      <div
        className="mt-5 rounded-md p-4"
        style={{
          background: 'color-mix(in srgb, var(--color-success) 16%, transparent)',
          border: '1px solid color-mix(in srgb, var(--color-success) 30%, transparent)',
        }}
      >
        <p className="font-sans text-sm font-semibold">Corporate WorkPass 🏢</p>
        <p className="mt-1 font-sans text-[12px] leading-snug" style={{ color: cream72 }}>
          Cover your whole remote team with pooled passes and central billing.
        </p>
        <a
          href="mailto:teams@remospot.com?subject=Corporate%20WorkPass"
          className="mt-3 inline-flex h-10 min-h-[44px] items-center rounded-pill px-4 font-sans text-[13px] font-semibold"
          style={{ border: '1px solid color-mix(in srgb, var(--color-text-inverse) 30%, transparent)' }}
        >
          Talk to us
        </a>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-6 flex h-12 w-full min-h-[44px] items-center justify-center rounded-pill bg-secondary font-sans text-sm font-semibold text-dark transition-opacity duration-fast hover:opacity-90"
      >
        Start {selected.name} Plan → {formatKES(selected.billedNow)}
      </button>
      <button
        type="button"
        onClick={() => onSelect(other.id)}
        className="mt-3 flex h-11 w-full min-h-[44px] items-center justify-center rounded-pill font-sans text-sm font-medium"
        style={{ color: cream72 }}
      >
        {other.name} instead
      </button>
    </motion.div>
  )
}

function PlanCard({
  spec,
  selected,
  onSelect,
}: {
  spec: PlanSpec
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'relative rounded-lg p-5 text-left transition-transform duration-fast',
        selected ? 'scale-[1.01]' : '',
      )}
      style={{
        background: 'color-mix(in srgb, var(--color-text-inverse) 7%, transparent)',
        border: selected
          ? '1.5px solid var(--color-secondary)'
          : '1px solid color-mix(in srgb, var(--color-text-inverse) 14%, transparent)',
      }}
    >
      {spec.badge && (
        <span className="absolute -top-2.5 left-4 rounded-pill bg-secondary px-2.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wide text-dark">
          {spec.badge}
        </span>
      )}
      <p className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: cream60 }}>
        {spec.name}
      </p>
      <p className="mt-1.5 font-display text-2xl font-bold">
        {formatKES(spec.monthly)}
        <span className="ml-1 font-sans text-sm font-normal" style={{ color: cream60 }}>
          /mo
        </span>
      </p>
      <p className="mt-0.5 font-sans text-[11px]" style={{ color: cream60 }}>
        {spec.note}
      </p>
      {spec.savings && (
        <p className="mt-1 font-mono text-[11px] font-medium text-secondary">{spec.savings}</p>
      )}
      <ul className="mt-4 space-y-2">
        {spec.features.map((f) => (
          <li key={f} className="flex items-start gap-2 font-sans text-[12px]" style={{ color: cream72 }}>
            <Check size={14} className="mt-0.5 shrink-0 text-secondary" aria-hidden="true" />
            {f}
          </li>
        ))}
      </ul>
    </button>
  )
}

// ── Screen 3 — M-Pesa payment ──────────────────────────────────

function PaymentScreen({
  spec,
  phone,
  onPhoneChange,
  phoneValid,
  submitting,
  onPay,
}: {
  spec: PlanSpec
  phone: string
  onPhoneChange: (v: string) => void
  phoneValid: boolean
  submitting: boolean
  onPay: () => void
}) {
  return (
    <motion.div {...screenMotion}>
      <h1 className="font-display text-[26px] font-bold leading-tight">Pay with M-Pesa</h1>
      <p className="mt-1 font-sans text-sm" style={{ color: cream72 }}>
        Enter your M-Pesa number and approve the prompt on your phone.
      </p>

      {/* Order summary */}
      <div
        className="mt-6 rounded-lg p-5"
        style={{
          background:
            'linear-gradient(135deg, var(--color-dark-alt) 0%, var(--color-dark) 100%)',
          border: '1px solid color-mix(in srgb, var(--color-text-inverse) 12%, transparent)',
        }}
      >
        <SummaryRow label="Plan" value={`${spec.name} · ${formatKES(spec.monthly)}/mo`} />
        <SummaryRow label="Billed today" value={formatKES(spec.billedNow)} />
        <div
          className="my-3 h-px"
          style={{ background: 'color-mix(in srgb, var(--color-text-inverse) 12%, transparent)' }}
        />
        <div className="flex items-center justify-between">
          <span className="font-sans text-sm font-semibold">Total</span>
          <span className="font-display text-xl font-bold text-secondary">
            {formatKES(spec.billedNow)}
          </span>
        </div>
      </div>

      {/* M-Pesa number */}
      <div className="mt-5">
        <label htmlFor="mpesa" className="font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: cream60 }}>
          M-Pesa number
        </label>
        <input
          id="mpesa"
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="+254 7XX XXX XXX"
          aria-label="M-Pesa phone number"
          className="mt-2 h-12 w-full rounded-md px-4 font-mono text-base outline-none"
          style={{
            background: 'color-mix(in srgb, var(--color-text-inverse) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--color-text-inverse) 18%, transparent)',
            color: 'var(--color-text-inverse)',
          }}
        />
      </div>

      {/* Session 6 note */}
      <p
        className="mt-4 rounded-md p-3 font-sans text-[12px] leading-snug"
        style={{
          background: 'color-mix(in srgb, var(--color-secondary) 14%, transparent)',
          color: cream72,
        }}
      >
        💡 Live M-Pesa payment is coming in Session 6. For now this activates a 30-day
        test membership instantly.
      </p>

      <button
        type="button"
        onClick={onPay}
        disabled={!phoneValid || submitting}
        className="mt-5 flex h-12 w-full min-h-[44px] items-center justify-center rounded-pill bg-success font-sans text-sm font-semibold text-inverse transition-opacity duration-fast hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? 'Processing…' : `Send M-Pesa Request · ${formatKES(spec.billedNow)}`}
      </button>
    </motion.div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="font-sans text-sm" style={{ color: cream72 }}>
        {label}
      </span>
      <span className="font-sans text-sm font-medium">{value}</span>
    </div>
  )
}

// ── Success ────────────────────────────────────────────────────

function SuccessScreen({
  profile,
  alreadyMember,
  onContinue,
}: {
  profile: ReturnType<typeof useAuth>['profile']
  alreadyMember: boolean
  onContinue: () => void
}) {
  return (
    <motion.div {...screenMotion} className="text-center">
      <div
        className="mx-auto grid h-16 w-16 place-items-center rounded-pill"
        style={{ background: 'color-mix(in srgb, var(--color-success) 26%, transparent)' }}
      >
        <Check size={30} className="text-success" aria-hidden="true" />
      </div>
      <h1 className="mt-4 font-display text-[26px] font-bold">
        You&rsquo;re a {SUBSCRIPTION_NAME} member!
      </h1>
      <p className="mx-auto mt-2 max-w-xs font-sans text-sm" style={{ color: cream72 }}>
        {alreadyMember
          ? 'Your membership is active. Book any spot ahead and save 30% on every slot.'
          : 'Payment processing is coming in Session 6 — for now your 30-day test membership is live.'}
      </p>

      <div className="mx-auto mt-6 max-w-sm text-left">
        <WorkPassCard profile={profile} variant="full" />
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="mt-7 flex h-12 w-full min-h-[44px] items-center justify-center rounded-pill bg-secondary font-sans text-sm font-semibold text-dark transition-opacity duration-fast hover:opacity-90"
      >
        Start booking →
      </button>
    </motion.div>
  )
}

// ── Member status + manage/cancel ──────────────────────────────

function MemberScreen({
  profile,
  daysLeft,
  expiresAt,
  onBrowse,
  onBookings,
}: {
  profile: ReturnType<typeof useAuth>['profile']
  daysLeft: number
  expiresAt: Date | null
  onBrowse: () => void
  onBookings: () => void
}) {
  const cancel = useCancelWorkPass()
  const { showToast } = useToast()
  const [confirming, setConfirming] = useState(false)

  const renewal = expiresAt
    ? expiresAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  async function handleCancel() {
    try {
      await cancel.mutateAsync()
      showToast('Membership cancelled', { icon: '✓' })
      setConfirming(false)
    } catch {
      showToast('Could not cancel — please try again', { icon: '⚠️' })
    }
  }

  return (
    <motion.div {...screenMotion}>
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-secondary">
        {PLATFORM_NAME} Member
      </p>
      <h1 className="mt-2 font-display text-[28px] font-bold leading-tight">
        Your {SUBSCRIPTION_NAME}
      </h1>
      <p className="mt-2 font-sans text-sm" style={{ color: cream72 }}>
        You&rsquo;re all set — book any spot ahead and save 30% on every session.
      </p>

      <div className="mt-6">
        <WorkPassCard profile={profile} variant="full" />
      </div>

      {/* Status row */}
      <div
        className="mt-5 flex items-center gap-3 rounded-lg p-4"
        style={{
          background: 'color-mix(in srgb, var(--color-text-inverse) 7%, transparent)',
          border: '1px solid color-mix(in srgb, var(--color-text-inverse) 12%, transparent)',
        }}
      >
        <span className="relative grid h-2.5 w-2.5 place-items-center" aria-hidden="true">
          <motion.span
            className="absolute inset-0 rounded-full bg-success"
            animate={{ opacity: [0.7, 0, 0.7], scale: [1, 1.9, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
        </span>
        <div>
          <p className="font-sans text-sm font-semibold">Active</p>
          <p className="font-mono text-[11px]" style={{ color: cream60 }}>
            {daysLeft} day{daysLeft === 1 ? '' : 's'} left
            {renewal ? ` · renews ${renewal}` : ''}
          </p>
        </div>
      </div>

      {/* Primary actions */}
      <button
        type="button"
        onClick={onBrowse}
        className="mt-6 flex h-12 w-full min-h-[44px] items-center justify-center rounded-pill bg-secondary font-sans text-sm font-semibold text-dark transition-opacity duration-fast hover:opacity-90"
      >
        Explore spots →
      </button>
      <button
        type="button"
        onClick={onBookings}
        className="mt-3 flex h-11 w-full min-h-[44px] items-center justify-center rounded-pill font-sans text-sm font-medium"
        style={{ border: '1px solid color-mix(in srgb, var(--color-text-inverse) 30%, transparent)' }}
      >
        My Bookings
      </button>

      {/* Manage / cancel */}
      {confirming ? (
        <div
          className="mt-6 rounded-md p-4"
          style={{
            background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)',
          }}
        >
          <p className="font-sans text-[13px]" style={{ color: cream72 }}>
            Cancel your {SUBSCRIPTION_NAME}? You&rsquo;ll lose member pricing right away.
          </p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancel.isPending}
              className="flex h-11 flex-1 min-h-[44px] items-center justify-center rounded-pill bg-primary font-sans text-sm font-semibold text-inverse transition-opacity duration-fast hover:opacity-90 disabled:opacity-50"
            >
              {cancel.isPending ? 'Cancelling…' : 'Yes, cancel'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="flex h-11 flex-1 min-h-[44px] items-center justify-center rounded-pill font-sans text-sm font-medium"
              style={{ border: '1px solid color-mix(in srgb, var(--color-text-inverse) 30%, transparent)' }}
            >
              Keep it
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mx-auto mt-6 block font-sans text-[13px] underline underline-offset-4"
          style={{ color: cream60 }}
        >
          Cancel membership
        </button>
      )}
    </motion.div>
  )
}
