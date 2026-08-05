import { Link } from 'react-router-dom'
import { PLATFORM, SUBSCRIPTION_NAME } from '@/config/platform'

interface FooterLink {
  label: string
  to: string
}

const FOOTER_SECTIONS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Explore',
    links: [
      { label: 'All spots', to: '/#all-spots' },
      { label: 'Check in', to: '/check-in' },
      { label: 'Community', to: '/community' },
      { label: 'Events', to: '/events' },
    ],
  },
  {
    title: 'Membership',
    links: [
      { label: SUBSCRIPTION_NAME, to: '/workpass' },
      { label: 'My bookings', to: '/bookings' },
      { label: 'Profile', to: '/profile' },
    ],
  },
  {
    title: 'Partners',
    links: [
      { label: 'List a space', to: '/partner' },
      { label: 'Partner portal', to: '/partner/dashboard' },
    ],
  },
]

/**
 * Global site footer. Rendered once in RootLayout below the page content. On
 * mobile it reserves bottom padding so nothing hides behind the fixed BottomTabs.
 */
export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-dark pb-[88px] pt-12 text-inverse md:pb-12">
      <div className="mx-auto max-w-content px-4 md:px-10 lg:px-[60px]">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-baseline gap-1.5" aria-label={`${PLATFORM.name} home`}>
              <span className="font-display text-xl font-bold tracking-tight text-inverse">
                {PLATFORM.name}
              </span>
              <span
                className="font-display text-lg italic"
                style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 60%, transparent)' }}
              >
                Nairobi
              </span>
            </Link>
            <p
              className="mt-3 max-w-xs font-sans text-sm leading-relaxed"
              style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 60%, transparent)' }}
            >
              {PLATFORM.tagline}
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_SECTIONS.map((section) => (
            <nav key={section.title} aria-label={section.title}>
              <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-secondary">
                {section.title}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="font-sans text-sm transition-colors duration-fast hover:text-inverse"
                      style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 65%, transparent)' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div
          className="mt-10 border-t pt-6 font-mono text-[11px]"
          style={{
            borderColor: 'color-mix(in srgb, var(--color-text-inverse) 12%, transparent)',
            color: 'color-mix(in srgb, var(--color-text-inverse) 45%, transparent)',
          }}
        >
          © {year} {PLATFORM.name} · {PLATFORM.domain}
        </div>
      </div>
    </footer>
  )
}
