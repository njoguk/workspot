import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { SCORE_LABEL } from '@/config/platform'
import {
  useSpotCompanions,
  useCheckInMutations,
  type ActiveCheckin,
} from '@/hooks/useCheckins'
import { useInterval } from '@/hooks/useInterval'
import { useToast } from '@/contexts/ToastContext'
import { formatDuration } from '@/lib/time'
import { AvatarStack } from '@/components/ui/Avatar'
import { ReviewFlow } from '@/components/review/ReviewFlow'

const REVIEW_PROMPT_MS = 30 * 60 * 1000

/**
 * Active check-in card (Phase 2 Part B, STEP 5). Replaces the check-in bar
 * while the user has an open session: a live count-up timer, streak, the
 * "also working here" stack, quick actions, and a leave control.
 */
export function ActiveCheckIn({ checkin }: { checkin: ActiveCheckin }) {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { checkOut } = useCheckInMutations()
  const { data: companions } = useSpotCompanions(checkin.spot_id, user?.id)

  const [now, setNow] = useState(() => Date.now())
  useInterval(() => setNow(Date.now()), 1000)
  const start = new Date(checkin.checked_in_at).getTime()
  const elapsed = Number.isNaN(start) ? 0 : now - start
  const showReviewPrompt = elapsed >= REVIEW_PROMPT_MS

  const [reviewOpen, setReviewOpen] = useState(false)

  const spot = checkin.spot
  const streak = profile?.check_in_streak ?? 0

  async function handleLeave() {
    try {
      await checkOut.mutateAsync(checkin.id)
      showToast('You checked out. Nice session!', { icon: '👋' })
    } catch {
      showToast('Could not check out. Try again.', { icon: '⚠️' })
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="mt-4 overflow-hidden rounded-lg bg-dark p-5 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-success px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-widest text-inverse">
              <span className="h-1.5 w-1.5 rounded-full bg-inverse" aria-hidden="true" />
              Checked in
            </span>
            <h3 className="mt-2 truncate font-display text-xl font-bold text-inverse">
              {spot?.name ?? 'Your spot'}
            </h3>
            {spot?.neighbourhood && (
              <p
                className="font-mono text-[11px] uppercase tracking-wide"
                style={{
                  color: 'color-mix(in srgb, var(--color-text-inverse) 60%, transparent)',
                }}
              >
                {spot.neighbourhood}
              </p>
            )}
          </div>

          <div className="text-right">
            <p className="font-mono text-2xl font-medium tabular-nums text-secondary">
              {formatDuration(elapsed)}
            </p>
            <p
              className="font-mono text-[10px] uppercase tracking-wide"
              style={{
                color: 'color-mix(in srgb, var(--color-text-inverse) 45%, transparent)',
              }}
            >
              🔥 {streak} day{streak === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {/* Also working here */}
        <div className="mt-4 flex items-center gap-3">
          {companions && companions.length > 0 ? (
            <>
              <AvatarStack
                people={companions.map((c) => ({
                  name: c.display_name,
                  seed: c.user_id,
                }))}
                size={28}
              />
              <span
                className="font-sans text-xs"
                style={{
                  color: 'color-mix(in srgb, var(--color-text-inverse) 70%, transparent)',
                }}
              >
                {companions.length} also working here
              </span>
            </>
          ) : (
            <span
              className="font-sans text-xs"
              style={{
                color: 'color-mix(in srgb, var(--color-text-inverse) 55%, transparent)',
              }}
            >
              You&rsquo;re the only one checked in — for now.
            </span>
          )}
        </div>

        {showReviewPrompt && (
          <button
            type="button"
            onClick={() => setReviewOpen(true)}
            className="mt-4 flex w-full items-center justify-between rounded-md bg-secondary px-4 py-3 text-left"
          >
            <span className="font-sans text-sm font-semibold text-dark">
              You&rsquo;ve been here a while — leave a review?
            </span>
            <span aria-hidden="true" className="font-sans text-sm text-dark">
              →
            </span>
          </button>
        )}

        {/* Quick actions */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <QuickAction
            label="Still quiet 🔇"
            onClick={() => showToast('Thanks — marked as quiet', { icon: '🔇' })}
          />
          <QuickAction label="Test WiFi 📡" onClick={() => setReviewOpen(true)} />
          <QuickAction label="Leave review ✍️" onClick={() => setReviewOpen(true)} />
        </div>

        <button
          type="button"
          onClick={handleLeave}
          disabled={checkOut.isPending}
          className="mt-3 flex h-9 w-full min-h-[44px] items-center justify-center font-sans text-sm font-medium transition-opacity duration-fast hover:opacity-80 disabled:opacity-50"
          style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 65%, transparent)' }}
        >
          {checkOut.isPending ? 'Leaving…' : 'Leave ×'}
        </button>
      </motion.div>

      {reviewOpen && spot && (
        <ReviewFlow
          spot={{
            id: spot.id,
            name: spot.name,
            type: spot.type,
            coverGradient: spot.cover_gradient,
            neighbourhood: spot.neighbourhood,
            scoreLabel: SCORE_LABEL,
          }}
          onClose={() => setReviewOpen(false)}
          onSubmitted={(spotId) => {
            setReviewOpen(false)
            navigate(`/spot/${spotId}`)
          }}
        />
      )}
    </>
  )
}

function QuickAction({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[44px] items-center justify-center rounded-pill px-2 py-2 text-center font-sans text-xs font-medium text-inverse transition-colors duration-fast"
      style={{
        border: '1px solid color-mix(in srgb, var(--color-text-inverse) 22%, transparent)',
      }}
    >
      {label}
    </button>
  )
}
