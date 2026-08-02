import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarCheck, LogOut, User } from 'lucide-react'
import { PLATFORM, VERIFIED_SPOT_COUNT } from '@/config/platform'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Fixed 64px top bar. Cream background with backdrop-blur, subtle bottom
 * border. Logo (display font) on the left; live spot count on the right.
 * When signed out we show the "List a Space" CTA; when signed in that is
 * replaced by the avatar chip + account dropdown (Phase 2 STEP 7).
 */
export function TopNav() {
  const { isLoggedIn, initials, displayName, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close the dropdown on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  function go(path: string) {
    setMenuOpen(false)
    navigate(path)
  }

  async function handleSignOut() {
    setMenuOpen(false)
    await signOut()
    navigate('/')
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-border bg-bg backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-content items-center justify-between px-4 md:px-10 lg:px-[60px]">
        {/* Logo */}
        <Link to="/" className="flex items-baseline gap-1.5" aria-label={`${PLATFORM.name} home`}>
          <span className="font-display text-xl font-bold tracking-tight text-text">
            {PLATFORM.name}
          </span>
          <span className="font-display text-lg italic text-muted">Nairobi</span>
        </Link>

        {/* Right cluster */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Live verified-spot count */}
          <div
            className="hidden items-center gap-2 sm:flex"
            aria-label={`${VERIFIED_SPOT_COUNT} verified spots`}
          >
            <motion.span
              className="inline-block h-2 w-2 rounded-pill bg-success"
              animate={{ opacity: [1, 0.35, 1], scale: [1, 1.25, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            />
            <span className="font-mono text-xs text-muted">
              {VERIFIED_SPOT_COUNT} verified spots
            </span>
          </div>

          {isLoggedIn ? (
            /* Account avatar + dropdown */
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label={displayName ? `${displayName} — account menu` : 'Account menu'}
                className="grid h-9 w-9 min-h-[44px] min-w-[44px] place-items-center rounded-pill bg-gradient-to-br from-primary to-secondary font-mono text-xs font-medium text-inverse shadow-sm"
              >
                {initials}
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, scale: 0.96, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -6 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-12 w-48 overflow-hidden rounded-md border border-border bg-surface py-1 shadow-md"
                  >
                    <MenuItem icon={<User size={16} />} onClick={() => go('/profile')}>
                      Profile
                    </MenuItem>
                    <MenuItem
                      icon={<CalendarCheck size={16} />}
                      onClick={() => go('/profile')}
                    >
                      My Bookings
                    </MenuItem>
                    <div className="my-1 h-px bg-border" aria-hidden="true" />
                    <MenuItem icon={<LogOut size={16} />} onClick={handleSignOut}>
                      Sign Out
                    </MenuItem>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* List a Space CTA (signed out) */
            <Link
              to="/partner"
              className="inline-flex h-9 min-h-[44px] items-center justify-center rounded-pill bg-dark px-4 font-sans text-sm font-semibold text-inverse transition-colors duration-fast hover:bg-dark-alt"
            >
              List a Space
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

function MenuItem({
  icon,
  onClick,
  children,
}: {
  icon: ReactNode
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left font-sans text-sm text-text transition-colors duration-fast hover:bg-surface-alt"
    >
      <span className="text-muted" aria-hidden="true">
        {icon}
      </span>
      {children}
    </button>
  )
}
