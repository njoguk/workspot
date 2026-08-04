import { PLATFORM_NAME, SUBSCRIPTION_NAME, VERIFIED_SPOT_COUNT } from '@/config/platform'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

interface WorkPassCardProps {
  /** Card holder. Omit for the generic upgrade-pitch preview. */
  profile?: Profile | null
  variant?: 'full' | 'mini'
  className?: string
}

/**
 * The WorkPass "membership card" (Phase 3 monetisation, STEP 2). A physical
 * credit-card aesthetic — dark earthy gradient, gold EMV chip, watermark and a
 * stats row. Colours come entirely from design tokens (dark / secondary /
 * inverse) via inline color-mix, never hardcoded hex.
 */
export function WorkPassCard({ profile, variant = 'full', className }: WorkPassCardProps) {
  const isMini = variant === 'mini'
  const holder = profile?.display_name?.trim()

  const gold70 = 'color-mix(in srgb, var(--color-secondary) 70%, transparent)'
  const cream = 'var(--color-text-inverse)'
  const cream60 = 'color-mix(in srgb, var(--color-text-inverse) 60%, transparent)'

  return (
    <div
      className={cn(
        'relative isolate overflow-hidden rounded-lg shadow-lg',
        isMini ? 'p-4' : 'p-6',
        className,
      )}
      style={{
        aspectRatio: isMini ? undefined : '1.586 / 1',
        background:
          'linear-gradient(140deg, var(--color-dark) 0%, var(--color-dark-alt) 55%, var(--color-dark) 100%)',
        border: '1px solid color-mix(in srgb, var(--color-secondary) 20%, transparent)',
      }}
      role="img"
      aria-label={`${SUBSCRIPTION_NAME} membership card${holder ? ` for ${holder}` : ''}`}
    >
      {/* Warm gold radial glow (top-right) */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 88% 8%, color-mix(in srgb, var(--color-secondary) 22%, transparent) 0%, transparent 46%)',
        }}
        aria-hidden="true"
      />

      {/* Watermark */}
      <span
        className="pointer-events-none absolute -right-2 -top-3 select-none font-display font-black leading-none"
        style={{
          fontSize: isMini ? '52px' : '92px',
          color: 'color-mix(in srgb, var(--color-text-inverse) 12%, transparent)',
        }}
        aria-hidden="true"
      >
        {SUBSCRIPTION_NAME}
      </span>

      {/* Top row: chip + tier label */}
      <div className="relative flex items-start justify-between">
        {/* Gold EMV chip */}
        <div
          className="rounded-[5px]"
          style={{
            width: isMini ? 26 : 30,
            height: isMini ? 18 : 22,
            background:
              'linear-gradient(135deg, var(--color-secondary) 0%, color-mix(in srgb, var(--color-secondary) 55%, var(--color-dark)) 100%)',
            boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--color-dark) 25%, transparent)',
          }}
          aria-hidden="true"
        />
        <span
          className="font-mono uppercase tracking-[0.16em]"
          style={{ fontSize: isMini ? 9 : 10, color: gold70 }}
        >
          {PLATFORM_NAME} Member
        </span>
      </div>

      {/* Title block */}
      <div className={cn('relative', isMini ? 'mt-3' : 'mt-6')}>
        <h3
          className="font-display font-bold leading-none"
          style={{ fontSize: isMini ? 18 : 22, color: cream }}
        >
          {SUBSCRIPTION_NAME}
        </h3>
        <p
          className="mt-1.5 font-mono uppercase tracking-[0.14em]"
          style={{ fontSize: isMini ? 9 : 10, color: cream60 }}
        >
          Nairobi ·{' '}
          <span style={{ color: 'color-mix(in srgb, var(--color-success) 80%, white)' }}>
            Active
          </span>
        </p>
      </div>

      {/* Cardholder (full variant, when known) */}
      {!isMini && holder && (
        <p
          className="relative mt-4 font-mono uppercase tracking-[0.14em]"
          style={{ fontSize: 12, color: cream }}
        >
          {holder}
        </p>
      )}

      {/* Stats row (full variant only) */}
      {!isMini && (
        <dl
          className="absolute flex items-end gap-5"
          style={{ left: 24, right: 24, bottom: 22 }}
        >
          <Stat value={String(VERIFIED_SPOT_COUNT)} label="Spots" cream={cream} muted={cream60} />
          <Divider />
          <Stat value="∞" label="Sessions" cream={cream} muted={cream60} />
          <Divider />
          <Stat value="−30%" label="Off" cream={cream} muted={cream60} />
        </dl>
      )}
    </div>
  )
}

function Stat({
  value,
  label,
  cream,
  muted,
}: {
  value: string
  label: string
  cream: string
  muted: string
}) {
  return (
    <div>
      <dd className="font-display text-lg font-bold leading-none" style={{ color: cream }}>
        {value}
      </dd>
      <dt
        className="mt-1 font-mono uppercase tracking-[0.12em]"
        style={{ fontSize: 9, color: muted }}
      >
        {label}
      </dt>
    </div>
  )
}

function Divider() {
  return (
    <span
      className="h-6 w-px self-center"
      style={{ background: 'color-mix(in srgb, var(--color-text-inverse) 16%, transparent)' }}
      aria-hidden="true"
    />
  )
}
