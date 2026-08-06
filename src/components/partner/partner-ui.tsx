import type { ReactNode } from 'react'
import type { UpcomingBooking } from '@/lib/partner'
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

/**
 * Bookings, responsive: stacked cards below md (no horizontal scroll on phones),
 * the full table at md and up. Shared by the Overview and Bookings views.
 */
export function BookingsTable({
  rows,
  emptyLabel = 'No bookings to show.',
}: {
  rows: UpcomingBooking[]
  emptyLabel?: string
}) {
  return (
    <>
      {/* Mobile — cards */}
      <ul className="space-y-3 md:hidden">
        {rows.length === 0 ? (
          <li className="rounded-lg border border-border bg-surface px-4 py-8 text-center font-sans text-sm text-muted">
            {emptyLabel}
          </li>
        ) : (
          rows.map((b) => (
            <li key={b.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-sans text-sm font-semibold text-text">{b.guest}</p>
                <StatusChip kind={b.status} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[12px] text-muted">
                <span>
                  {b.date} · {b.time}
                </span>
                <span className="text-text">{b.slot}</span>
                <span>{b.payment}</span>
              </div>
            </li>
          ))
        )}
      </ul>

      {/* Desktop — table */}
      <div className="hidden md:block">
        <Panel className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border">
                  {['Guest', 'Date & time', 'Slot', 'Payment', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 font-mono text-[10px] uppercase tracking-wide text-light"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-sans text-sm font-medium text-text">{b.guest}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-muted">
                      {b.date} · {b.time}
                    </td>
                    <td className="px-4 py-3 font-sans text-[13px] text-text">{b.slot}</td>
                    <td className="px-4 py-3 font-sans text-[13px] text-muted">{b.payment}</td>
                    <td className="px-4 py-3">
                      <StatusChip kind={b.status} />
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center font-sans text-sm text-muted">
                      {emptyLabel}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  )
}
