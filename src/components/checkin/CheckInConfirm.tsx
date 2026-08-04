import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import type { Spot } from '@/types'
import { useLiveCounts, useCheckInMutations } from '@/hooks/useCheckins'
import { useToast } from '@/contexts/ToastContext'
import { noiseLabel, wifiClass } from '@/lib/spot-format'

/**
 * Check-in confirmation (Phase 2 Part B, STEP 4). Shows the spot header and a
 * 2×2 grid of live-ish conditions, then commits the check-in. People-here is a
 * realtime count; the other tiles fall back to the spot's baseline until live
 * review data exists.
 */
export function CheckInConfirm({
  spot,
  onBack,
  onConfirmed,
  backLabel = 'Different spot',
}: {
  spot: Spot
  onBack: () => void
  onConfirmed: () => void
  backLabel?: string
}) {
  const { data: counts } = useLiveCounts([spot.id])
  const { checkIn } = useCheckInMutations()
  const { showToast } = useToast()

  const peopleHere = counts?.[spot.id] ?? 0

  const bestUntil =
    spot.bestTimes.find((t) => t.includes('✓'))?.replace(/[✓✗]/g, '').trim() ??
    spot.bestTimes[0]?.replace(/[✓✗]/g, '').trim() ??
    'Anytime'

  const conditions: { label: string; value: string }[] = [
    { label: 'People here', value: peopleHere === 0 ? 'Be the first' : String(peopleHere) },
    { label: 'Noise', value: noiseLabel(spot.noiseLevel) },
    { label: 'WiFi now', value: `${spot.wifiMbps} Mbps · ${wifiClass(spot.wifiMbps)}` },
    { label: 'Best until', value: bestUntil },
  ]

  async function handleCheckIn() {
    try {
      await checkIn.mutateAsync(spot.id)
      showToast(`Checked in at ${spot.name}`, { icon: '📍' })
      onConfirmed()
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Could not check in. Try again.',
        { icon: '⚠️' },
      )
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Spot header */}
      <div
        className="relative h-28 overflow-hidden rounded-lg"
        style={{ background: spot.coverGradient }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, color-mix(in srgb, var(--color-dark) 82%, transparent) 0%, color-mix(in srgb, var(--color-dark) 20%, transparent) 100%)',
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="font-display text-xl font-bold leading-tight text-inverse">
            {spot.name}
          </h3>
          <p
            className="mt-0.5 font-mono text-[11px] uppercase tracking-wide"
            style={{
              color: 'color-mix(in srgb, var(--color-text-inverse) 70%, transparent)',
            }}
          >
            {spot.neighbourhood}
          </p>
        </div>
      </div>

      {/* Live conditions */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {conditions.map((c) => (
          <div key={c.label} className="rounded-md border border-border bg-surface p-4">
            <p className="font-mono text-[10px] uppercase tracking-wide text-light">
              {c.label}
            </p>
            <p className="mt-1 font-display text-base font-bold text-text">
              {c.value}
            </p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-5 space-y-2">
        <button
          type="button"
          onClick={handleCheckIn}
          disabled={checkIn.isPending}
          className="flex h-12 w-full min-h-[44px] items-center justify-center rounded-pill bg-success font-sans text-sm font-semibold text-inverse transition-opacity duration-fast hover:opacity-90 disabled:opacity-60"
        >
          {checkIn.isPending ? 'Checking in…' : '📍 Check In Here'}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 w-full min-h-[44px] items-center justify-center gap-1.5 rounded-pill font-sans text-sm font-medium text-muted transition-colors duration-fast hover:text-text"
        >
          <ArrowLeft size={15} aria-hidden="true" /> {backLabel}
        </button>
      </div>
    </motion.div>
  )
}
