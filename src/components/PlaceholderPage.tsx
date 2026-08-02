import { PLATFORM } from '@/config/platform'

interface PlaceholderPageProps {
  title: string
  /** Optional short line under the title. */
  subtitle?: string
}

/**
 * Temporary centred placeholder used by every route until real pages
 * are built. Uses the editorial display font and platform kicker.
 */
export function PlaceholderPage({ title, subtitle }: PlaceholderPageProps) {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-light">
        {PLATFORM.name} Nairobi
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold text-text">{title}</h1>
      <p className="mt-2 font-sans text-sm text-muted">
        {subtitle ?? 'Coming soon.'}
      </p>
    </section>
  )
}
