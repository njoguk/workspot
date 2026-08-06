import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useSpotTips, tipAccentVar } from '@/hooks/useTips'
import { useUserBadges } from '@/hooks/useUserBadges'
import { useAuth } from '@/contexts/AuthContext'
import { AddTipSheet } from '@/components/tips/AddTipSheet'
import { Avatar } from '@/components/ui/Avatar'
import { BadgeTag } from '@/components/ui/BadgeTag'
import { Skeleton } from '@/components/ui/Skeleton'
import { timeAgo } from '@/lib/time'

/** Tips left about a spot, with an "Add a tip" composer. */
export function SpotTips({ spotId, spotName }: { spotId: string; spotName: string }) {
  const { isLoggedIn } = useAuth()
  const { data: tips, isLoading } = useSpotTips(spotId)
  const { data: badges } = useUserBadges((tips ?? []).map((t) => t.userId))
  const [open, setOpen] = useState(false)

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-light">Tips</h2>
        {isLoggedIn && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-pill border border-border-strong px-3 font-sans text-[13px] font-semibold text-text transition-colors duration-fast hover:border-primary hover:text-primary"
          >
            <Plus size={15} /> Add a tip
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : tips && tips.length > 0 ? (
        <ul className="space-y-3">
          {tips.map((tip) => {
            const accent = tipAccentVar(tip.tagLabel)
            const badge = badges?.[tip.userId]?.[0]
            return (
              <li
                key={tip.id}
                className="rounded-lg border border-border bg-surface p-4"
                style={{ borderLeft: `4px solid ${accent}` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={tip.userName} seed={tip.userId} size={32} />
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 font-sans text-sm font-semibold text-text">
                        <span className="truncate">{tip.userName ?? 'A member'}</span>
                        {badge && <BadgeTag badge={badge} />}
                      </p>
                      <p className="font-mono text-[11px] text-muted">{timeAgo(tip.createdAt)}</p>
                    </div>
                  </div>
                  <span
                    className="shrink-0 rounded-pill px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide"
                    style={{ color: accent, background: `color-mix(in srgb, ${accent} 14%, transparent)` }}
                  >
                    {tip.tagLabel}
                  </span>
                </div>
                <p className="mt-3 font-sans text-sm leading-relaxed text-text">{tip.body}</p>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="rounded-lg bg-surface py-8 text-center font-sans text-sm text-muted">
          No tips yet{isLoggedIn ? ' — be the first to add one.' : '.'}
        </p>
      )}

      <AddTipSheet
        open={open}
        onClose={() => setOpen(false)}
        spotId={spotId}
        targetLabel={spotName}
      />
    </div>
  )
}
