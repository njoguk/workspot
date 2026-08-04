import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PartnerData } from '@/lib/partner'
import type { PartnerVenue } from '@/hooks/useVenue'
import { Panel, SectionHeading } from '@/components/partner/partner-ui'

/**
 * Analytics (STEP 11): 2×2 grid — peak hours, visitor profile, WorkScore trend
 * and neighbourhood ranking. Visitor-profile percentages are the fixed mix from
 * the spec; the rest is demo data derived from the venue (src/lib/partner.ts).
 */

const chartTooltip = {
  contentStyle: {
    borderRadius: 12,
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
  },
  labelStyle: { color: 'var(--color-text-muted)' },
} as const

const axisTick = { fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--color-text-muted)' }

export function VenueAnalytics({ venue, data }: { venue: PartnerVenue; data: PartnerData }) {
  const { peakHours, visitorProfile, workScoreTrend, neighbourhoodRanking } = data
  const maxRank = Math.max(...neighbourhoodRanking.map((h) => h.score), 10)

  return (
    <div>
      <SectionHeading title="Analytics" subtitle={`Who visits ${venue.name} and when`} />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 1. Peak hours — horizontal bars */}
        <Panel>
          <ChartTitle>Peak hours</ChartTitle>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={peakHours} margin={{ left: 8, right: 12 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tick={axisTick}
                />
                <Tooltip cursor={{ fill: 'color-mix(in srgb, var(--color-primary) 8%, transparent)' }} {...chartTooltip} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={22}>
                  {peakHours.map((_, i) => (
                    <Cell key={i} fill="var(--color-primary)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* 2. Visitor profile — horizontal bars */}
        <Panel>
          <ChartTitle>Visitor profile</ChartTitle>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={visitorProfile} margin={{ left: 8, right: 12 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  type="category"
                  dataKey="role"
                  tickLine={false}
                  axisLine={false}
                  width={110}
                  tick={axisTick}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Share']}
                  cursor={{ fill: 'color-mix(in srgb, var(--color-secondary) 10%, transparent)' }}
                  {...chartTooltip}
                />
                <Bar dataKey="pct" radius={[0, 6, 6, 0]} maxBarSize={22}>
                  {visitorProfile.map((_, i) => (
                    <Cell key={i} fill="var(--color-secondary)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* 3. WorkScore trend — 3 bars */}
        <Panel>
          <ChartTitle>WorkScore trend</ChartTitle>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workScoreTrend} margin={{ top: 8, right: 8, left: 8 }}>
                <XAxis dataKey="period" tickLine={false} axisLine={false} tick={axisTick} />
                <YAxis domain={[0, 10]} tickLine={false} axisLine={false} width={28} tick={axisTick} />
                <Tooltip cursor={{ fill: 'color-mix(in srgb, var(--color-success) 8%, transparent)' }} {...chartTooltip} />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={56}>
                  {workScoreTrend.map((_, i) => (
                    <Cell key={i} fill="var(--color-success)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* 4. Neighbourhood ranking — list */}
        <Panel>
          <ChartTitle>Neighbourhood ranking</ChartTitle>
          <ul className="mt-2 space-y-3">
            {neighbourhoodRanking.map((h, i) => (
              <li key={h.name} className="flex items-center gap-3">
                <span className="w-5 shrink-0 font-mono text-[11px] text-light">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={
                        h.isCurrent
                          ? 'font-sans text-sm font-semibold text-primary'
                          : 'font-sans text-sm text-text'
                      }
                    >
                      {h.name}
                      {h.isCurrent && (
                        <span className="ml-2 font-mono text-[9px] uppercase tracking-wide text-primary">
                          You
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-xs text-muted">{h.score.toFixed(1)}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-pill bg-surface-alt">
                    <div
                      className="h-full rounded-pill"
                      style={{
                        width: `${(h.score / maxRank) * 100}%`,
                        background: h.isCurrent ? 'var(--color-primary)' : 'var(--color-border-strong)',
                      }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}

function ChartTitle({ children }: { children: string }) {
  return (
    <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-light">{children}</p>
  )
}
