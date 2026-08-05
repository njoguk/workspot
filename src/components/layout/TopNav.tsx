import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarCheck, LogOut, Sparkles, Store, User } from 'lucide-react'
import { PLATFORM, SUBSCRIPTION_NAME } from '@/config/platform'
import { useAuth } from '@/contexts/AuthContext'
import { useIsWorkPassMember } from '@/hooks/useWorkPass'
import { usePlatformStats } from '@/hooks/usePlatformStats'
import { cn } from '@/lib/utils'

/** Primary destinations shown as inline links on desktop (mirrors BottomTabs). */
const NAV_LINKS: { to: string; label: string; end?: boolean }[] = [
  { to: '/', label: 'Explore', end: true },
  { to: '/check-in', label: 'Check In' },
  { to: '/community', label: 'Community' },
  { to: '/events', label: 'Events' },
]

/**
 * Fixed 64px top bar. Cream background with backdrop-blur, subtle bottom
 * border. Logo (display font) on the left; live spot count on the right.
 * When signed out we show the "List a Space" CTA; when signed in that is
 * replaced by the avatar chip + account dropdown (Phase 2 STEP 7).
 */
export function TopNav() {
  const { isLoggedIn, initials, displayName, signOut } = useAuth()
  const { isActive: isMember } = useIsWorkPassMember()
  const { data: stats } = usePlatformStats()
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
        {/* Logo + desktop nav */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-baseline gap-1.5" aria-label={`${PLATFORM.name} home`}>
            <span className="font-display text-xl font-bold tracking-tight text-text">
              {PLATFORM.name}
            </span>
            <span className="font-display text-lg italic text-muted">Nairobi</span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    'font-sans text-sm font-medium transition-colors duration-fast',
                    isActive ? 'text-primary' : 'text-muted hover:text-text',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Live verified-spot count — only once we have a meaningful number */}
          {typeof stats?.spotCount === 'number' && stats.spotCount >= 5 && (
            <div
              className="hidden items-center gap-2 sm:flex"
              aria-label={`${stats.spotCount} verified spots`}
            >
              <motion.span
                className="inline-block h-2 w-2 rounded-pill bg-success"
                animate={{ opacity: [1, 0.35, 1], scale: [1, 1.25, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                aria-hidden="true"
              />
              <span className="font-mono text-xs text-muted">
                {stats.spotCount} verified spots
              </span>
            </div>
          )}

          {isLoggedIn && isMember && (
            /* WorkPass member badge */
            <Link
              to="/workpass"
              aria-label={`${SUBSCRIPTION_NAME} member`}
              className="hidden items-center gap-1 rounded-pill bg-secondary px-2.5 py-1 font-mono text-[11px] font-medium text-dark shadow-sm transition-opacity duration-fast hover:opacity-90 sm:inline-flex"
            >
              🏆 {SUBSCRIPTION_NAME}
            </Link>
          )}

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
                      icon={<Sparkles size={16} />}
                      onClick={() => go('/workpass')}
                    >
                      {isMember ? `${SUBSCRIPTION_NAME} member` : `Get ${SUBSCRIPTION_NAME}`}
                    </MenuItem>
                    <MenuItem
                      icon={<CalendarCheck size={16} />}
                      onClick={() => go('/bookings')}
                    >
                      My Bookings
                    </MenuItem>
                    <MenuItem icon={<Store size={16} />} onClick={() => go('/partner')}>
                      List a Space
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
            /* Auth + List a Space CTAs (signed out) */
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                to="/auth"
                className="inline-flex h-9 min-h-[44px] items-center justify-center rounded-pill px-3 font-sans text-sm font-semibold text-text transition-colors duration-fast hover:text-primary"
              >
                Log in
              </Link>
              <Link
                to="/partner"
                className="inline-flex h-9 min-h-[44px] items-center justify-center rounded-pill bg-dark px-4 font-sans text-sm font-semibold text-inverse transition-colors duration-fast hover:bg-dark-alt"
              >
                List a Space
              </Link>
            </div>
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
