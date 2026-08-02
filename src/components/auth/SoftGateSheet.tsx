import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { COMMUNITY } from '@/config/platform'
import {
  VISIT_THRESHOLD,
  dismissSoftGate,
  getSpotVisitCount,
  isSoftGateDismissed,
  markShownThisSession,
  wasShownThisSession,
} from '@/lib/softGate'

/**
 * Soft-gate bottom sheet (Phase 2 STEP 6). After a guest opens
 * VISIT_THRESHOLD spot detail pages, this slides up from the bottom inviting
 * them to join. Shown at most once per browser session, and never again once
 * dismissed via "continue as guest". Rendered by ExplorePage.
 */
export function SoftGateSheet() {
  const { isLoggedIn, loading } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (loading || isLoggedIn) return
    if (isSoftGateDismissed() || wasShownThisSession()) return
    if (getSpotVisitCount() >= VISIT_THRESHOLD) {
      setOpen(true)
      markShownThisSession()
    }
  }, [loading, isLoggedIn])

  // A session appearing (e.g. sign-in in another tab) closes the sheet.
  useEffect(() => {
    if (isLoggedIn) setOpen(false)
  }, [isLoggedIn])

  const close = () => setOpen(false)

  const continueAsGuest = () => {
    dismissSoftGate()
    setOpen(false)
  }

  const show = open && !isLoggedIn

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Backdrop */}
          <motion.button
            type="button"
            aria-label="Dismiss"
            onClick={close}
            className="absolute inset-0 bg-dark/50"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            transition={{ duration: 0.25 }}
          />

          {/* Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="softgate-title"
            className="relative w-full max-w-content rounded-t-xl bg-surface px-5 pb-8 pt-3 shadow-xl md:mb-6 md:rounded-xl md:px-8"
            variants={{
              hidden: { y: '100%' },
              visible: { y: 0 },
            }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Grab handle */}
            <div
              className="mx-auto mb-5 h-1 w-10 rounded-pill bg-border-strong"
              aria-hidden="true"
            />

            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-pill text-muted transition-colors duration-fast hover:bg-surface-alt"
            >
              <X size={18} />
            </button>

            <div className="mx-auto max-w-md text-center md:text-left">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                {COMMUNITY.communityName}
              </p>
              <h2
                id="softgate-title"
                className="mt-2 font-display text-2xl font-bold text-text"
              >
                Join the community
              </h2>
              <p className="mt-2 font-sans text-sm leading-relaxed text-muted">
                Save your favourite spots, check in, and add reviews that help
                thousands of remote workers in Nairobi find their perfect place
                to work.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    close()
                    navigate('/auth')
                  }}
                  className="flex h-12 min-h-[44px] items-center justify-center rounded-pill bg-dark px-6 font-sans text-sm font-semibold text-inverse transition-colors duration-fast hover:bg-dark-alt"
                >
                  Create account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    close()
                    navigate('/auth')
                  }}
                  className="font-sans text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={continueAsGuest}
                  className="mt-1 font-sans text-xs text-light hover:text-muted"
                >
                  Continue browsing as guest
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
