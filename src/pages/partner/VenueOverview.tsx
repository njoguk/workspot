import { useEffect, useState } from 'react'
import { animate } from 'framer-motion'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import type { PartnerData } from '@/lib/partner'
import { formatKES } from '@/lib/booking'
import type { PartnerVenue } from '@/hooks/useVenue'
import { Panel, SectionHeading, StatusChip } from '@/components/partner/partner-ui'

/**
 * Dashboard overview (STEP 9): a 4-KPI strip with count-up animation, a daily
 * bookings bar chart, and an upcoming-bookings table. KPI + booking figures are
 * demo data (see src/lib/partner.ts) until an owner-scoped bookings RPC exists.
 */

export function VenueOverview({ venue, data }: { venue: PartnerVenue; data: PartnerData }) {
  const { kpis, dailyBookings, upcoming } = data

  return (
    <div>
      <SectionHeading title="Overview" subtitle={`How ${venue.name} is performing this week`} />

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon="📅" label="Bookings this week" value={kpis.bookingsThisWeek} />
        <Kpi icon="💰" label="Revenue (net)" value={kpis.revenueNetKes} money />
        <Kpi icon="👁" label="Profile views" value={kpis.profileViews} />
        <Kpi icon="📊" label="Conversion rate" value={kpis.conversionRate} suffix="%" decimals={1} />
      </div>

      {/* Daily bookings chart */}
      <Panel className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-widest text-light">
            Daily bookings · this week
          </p>
          <p className="font-mono text-xs text-muted">Mon–Sun</p>
        </div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyBookings} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--color-text-muted)' }}
              />
              <Tooltip
                cursor={{ fill: 'color-mix(in srgb, var(--color-primary) 8%, transparent)' }}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                }}
                labelStyle={{ color: 'var(--color-text-muted)' }}
              />
              <Bar dataKey="bookings" radius={[6, 6, 0, 0]} maxBarSize={40}>
                {dailyBookings.map((_, i) => (
                  <Cell key={i} fill="var(--color-primary)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Upcoming bookings table */}
      <div className="mt-6">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-light">
          Upcoming bookings
        </p>
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
                {upcoming.map((b) => (
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
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  )
}

// ── KPI card with count-up ─────────────────────────────────────

function Kpi({
  icon,
  label,
  value,
  money,
  suffix,
  decimals = 0,
}: {
  icon: string
  label: string
  value: number
  money?: boolean
  suffix?: string
  decimals?: number
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        <span className="text-base" aria-hidden="true">{icon}</span>
        <p className="font-mono text-[10px] uppercase tracking-wide text-light">{label}</p>
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-text">
        <CountUp value={value} money={money} suffix={suffix} decimals={decimals} />
      </p>
    </div>
  )
}

function CountUp({
  value,
  money,
  suffix,
  decimals = 0,
}: {
  value: number
  money?: boolean
  suffix?: string
  decimals?: number
}) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    })
    return () => controls.stop()
  }, [value])

  if (money) return <>{formatKES(display)}</>
  const n = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString('en-KE')
  return <>{n}{suffix ?? ''}</>
}
