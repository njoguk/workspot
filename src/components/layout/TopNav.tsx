import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PLATFORM, VERIFIED_SPOT_COUNT } from '@/config/platform'
import { useAuth } from '@/hooks/useAuth'

/**
 * Fixed 64px top bar. Cream background with backdrop-blur, subtle bottom
 * border. Logo (display font) on the left; live spot count + "List a Space"
 * CTA on the right, with the signed-in avatar when a session exists.
 */
export function TopNav() {
  const { isLoggedIn, initials, displayName } = useAuth()

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
          <div className="hidden items-center gap-2 sm:flex" aria-label={`${VERIFIED_SPOT_COUNT} verified spots`}>
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

          {/* List a Space CTA */}
          <Link
            to="/partner"
            className="inline-flex h-9 items-center justify-center rounded-pill bg-dark px-4 font-sans text-sm font-semibold text-inverse transition-colors duration-fast hover:bg-dark-alt"
          >
            List a Space
          </Link>

          {/* Signed-in avatar */}
          {isLoggedIn && (
            <Link
              to="/profile"
              aria-label={displayName ? `${displayName} — profile` : 'Profile'}
              className="grid h-9 w-9 place-items-center rounded-pill bg-gradient-to-br from-primary to-secondary font-mono text-xs font-medium text-inverse shadow-sm"
            >
              {initials}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
