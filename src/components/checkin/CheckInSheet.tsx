import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { CheckInPicker } from '@/components/checkin/CheckInPicker'

/**
 * Check-in bottom sheet (Phase 2 Part B, STEP 3). Slides up from the bottom
 * with the shared spot picker. Opened from the global floating check-in bar.
 */
export function CheckInSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.button
            type="button"
            aria-label="Dismiss"
            onClick={onClose}
            className="absolute inset-0"
            style={{ background: 'color-mix(in srgb, var(--color-dark) 50%, transparent)' }}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            transition={{ duration: 0.25 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Check in to a spot"
            className="relative flex max-h-[85vh] w-full max-w-content flex-col overflow-y-auto rounded-t-xl bg-surface px-5 pb-8 pt-3 shadow-xl md:mb-6 md:rounded-xl md:px-6"
            variants={{ hidden: { y: '100%' }, visible: { y: 0 } }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="mx-auto mb-4 h-1 w-10 rounded-pill bg-border-strong"
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-pill text-muted transition-colors duration-fast hover:bg-surface-alt"
            >
              <X size={18} />
            </button>

            <h2 className="font-display text-2xl font-bold text-text">Check in</h2>
            <div className="mt-4">
              <CheckInPicker onDone={onClose} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
