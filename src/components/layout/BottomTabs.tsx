import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface Tab {
  to: string
  label: string
  icon: string
  /** Match the path exactly (used for the index route). */
  end?: boolean
}

const TABS: Tab[] = [
  { to: '/', label: 'Explore', icon: '🏠', end: true },
  { to: '/check-in', label: 'Check In', icon: '📍' },
  { to: '/community', label: 'Community', icon: '👥' },
  { to: '/events', label: 'Events', icon: '🎉' },
  { to: '/profile', label: 'Profile', icon: '👤' },
]

/**
 * Mobile-only bottom tab bar (hidden at md and up). Fixed to the bottom,
 * 68px tall. The active tab is rendered in the terracotta brand colour.
 */
export function BottomTabs() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 h-[68px] border-t border-border bg-surface md:hidden"
    >
      <ul className="flex h-full items-stretch">
        {TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  'flex h-full min-h-[44px] flex-col items-center justify-center gap-1 font-sans text-[11px] font-medium transition-colors duration-fast',
                  isActive ? 'text-primary' : 'text-muted',
                )
              }
            >
              <span className="text-lg leading-none" aria-hidden="true">
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
