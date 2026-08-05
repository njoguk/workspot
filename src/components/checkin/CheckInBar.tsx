import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

/**
 * The "Where are you working from?" prompt bar (Phase 2 Part B, STEP 2).
 * Rendered by the global CheckInDock as a floating card for signed-in users
 * with no open check-in. Tapping opens the check-in bottom sheet.
 */
export function CheckInBar({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Check in to a spot"
      className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg bg-primary px-4 py-4 text-left shadow-lg transition-opacity duration-fast hover:opacity-90"
    >
      <span className="flex items-center gap-3">
        <span className="relative grid h-3 w-3 place-items-center">
          <motion.span
            className="absolute inset-0 rounded-full bg-inverse"
            animate={{ opacity: [0.7, 0, 0.7], scale: [1, 1.9, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          />
          <span className="h-2 w-2 rounded-full bg-inverse" aria-hidden="true" />
        </span>
        <span className="font-sans text-sm font-medium text-inverse">
          Where are you working from?
        </span>
      </span>
      <ArrowRight size={18} className="text-inverse" aria-hidden="true" />
    </button>
  )
}
