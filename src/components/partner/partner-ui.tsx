import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Small shared building blocks for the Venue Partner Portal views. Keeps the
 * dashboard sub-pages visually consistent without repeating token classes.
 */

/** White card panel used across the dashboard. */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-lg border border-border bg-surface p-5', className)}>{children}</div>
  )
}

/** Section heading with an optional subtitle. */
export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="font-display text-2xl font-bold text-text">{title}</h2>
      {subtitle && <p className="mt-1 font-sans text-sm text-muted">{subtitle}</p>}
    </div>
  )
}

type ChipKind = 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'processing' | 'paid'

const CHIP_STYLES: Record<ChipKind, { mix: string; text: string; label: string }> = {
  confirmed: { mix: 'var(--color-success)', text: 'var(--color-success)', label: 'Confirmed' },
  paid: { mix: 'var(--color-success)', text: 'var(--color-success)', label: 'Paid' },
  completed: { mix: 'var(--color-info)', text: 'var(--color-info)', label: 'Completed' },
  pending: { mix: 'var(--color-secondary)', text: 'var(--color-dark)', label: 'Pending' },
  processing: { mix: 'var(--color-secondary)', text: 'var(--color-dark)', label: 'Processing' },
  cancelled: { mix: 'var(--color-primary)', text: 'var(--color-primary)', label: 'Cancelled' },
}

/** Coloured status pill used in the bookings and payouts tables. */
export function StatusChip({ kind }: { kind: ChipKind }) {
  const s = CHIP_STYLES[kind]
  return (
    <span
      className="inline-flex items-center rounded-pill px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide"
      style={{ background: `color-mix(in srgb, ${s.mix} 16%, transparent)`, color: s.text }}
    >
      {s.label}
    </span>
  )
}
