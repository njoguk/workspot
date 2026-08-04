import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useActiveCheckin, type ActiveCheckin } from '@/hooks/useCheckins'
import { useInterval } from '@/hooks/useInterval'
import { formatDuration } from '@/lib/time'
import { CheckInBar } from '@/components/checkin/CheckInBar'
import { CheckInSheet } from '@/components/checkin/CheckInSheet'

/**
 * Whether the global check-in dock should show on the current route, and the
 * user's active check-in when it does. The dock is hidden on the spot detail
 * page (it has its own bottom action bar) and on /check-in (redundant there).
 * Shared with RootLayout so it can reserve bottom padding for the dock.
 */
export function useCheckinDockState(): { visible: boolean; active: ActiveCheckin | null } {
  const { isLoggedIn } = useAuth()
  const { data: active } = useActiveCheckin()
  const { pathname } = useLocation()
  // Hidden where a page owns the bottom of the screen or the dock is off-topic:
  // the spot detail bar, /check-in itself, and the whole booking/upgrade journey
  // (`/book`, `/booking/…/confirm`, `/bookings`, `/workpass`).
  const hidden =
    pathname.startsWith('/spot/') ||
    pathname === '/check-in' ||
    pathname.startsWith('/book') ||
    pathname.startsWith('/workpass')
  const visible = isLoggedIn && !hidden
  return { visible, active: visible ? active ?? null : null }
}

/**
 * Global floating check-in surface. Not checked in → the "Where are you working
 * from?" bar (opens the sheet). Checked in → a slim live pill that taps through
 * to the /check-in dashboard. Floats above the mobile bottom nav.
 */
export function CheckInDock() {
  const { visible, active } = useCheckinDockState()
  const [sheetOpen, setSheetOpen] = useState(false)

  if (!visible) return null

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-[68px] z-40 px-4 pb-3 md:bottom-0 md:pb-5">
        <div className="pointer-events-auto mx-auto w-full max-w-md">
          <AnimatePresence mode="wait" initial={false}>
            {active ? (
              <motion.div
                key="pill"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25 }}
              >
                <CheckedInPill checkin={active} />
              </motion.div>
            ) : (
              <motion.div
                key="bar"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25 }}
              >
                <CheckInBar onOpen={() => setSheetOpen(true)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <CheckInSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  )
}

function CheckedInPill({ checkin }: { checkin: ActiveCheckin }) {
  const navigate = useNavigate()
  const [now, setNow] = useState(() => Date.now())
  useInterval(() => setNow(Date.now()), 1000)
  const start = new Date(checkin.checked_in_at).getTime()
  const elapsed = Number.isNaN(start) ? 0 : now - start

  return (
    <button
      type="button"
      onClick={() => navigate('/check-in')}
      aria-label="View your active check-in"
      className="flex min-h-[44px] w-full items-center gap-3 rounded-pill bg-dark px-4 py-3 text-left shadow-lg transition-colors duration-fast hover:bg-dark-alt"
    >
      <span className="relative grid h-2.5 w-2.5 place-items-center">
        <motion.span
          className="absolute inset-0 rounded-full bg-success"
          animate={{ opacity: [0.7, 0, 0.7], scale: [1, 1.9, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        />
        <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
      </span>
      <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-secondary">
        Checked in
      </span>
      <span className="font-mono text-sm tabular-nums text-inverse">
        {formatDuration(elapsed)}
      </span>
      {checkin.spot?.name && (
        <span
          className="min-w-0 flex-1 truncate font-sans text-xs"
          style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 65%, transparent)' }}
        >
          {checkin.spot.name}
        </span>
      )}
      <ArrowRight size={16} className="ml-auto shrink-0 text-inverse" aria-hidden="true" />
    </button>
  )
}
