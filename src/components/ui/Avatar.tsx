import { cn } from '@/lib/utils'
import { avatarGradient, initialsFrom } from '@/lib/avatar'

interface AvatarProps {
  /** Display name — used for initials and (unless `seed` is given) colour. */
  name: string | null | undefined
  /** Stable colour seed (e.g. user id). Falls back to `name`. */
  seed?: string
  /** Pixel diameter. Default 40. */
  size?: number
  className?: string
}

/**
 * Circular initials avatar on a deterministic token gradient (Phase 2 Part B).
 * The same seed always yields the same colour, so a person looks consistent
 * across the community feed, attendee stacks, and their profile.
 */
export function Avatar({ name, seed, size = 40, className }: AvatarProps) {
  const initials = initialsFrom(name)
  return (
    <span
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full font-mono font-medium text-inverse shadow-sm',
        className,
      )}
      style={{
        width: size,
        height: size,
        background: avatarGradient(seed ?? name ?? initials),
        fontSize: Math.round(size * 0.36),
      }}
      role="img"
      aria-label={name ?? 'Member'}
    >
      {initials}
    </span>
  )
}

interface AvatarStackItem {
  name: string | null | undefined
  seed?: string
}

interface AvatarStackProps {
  people: AvatarStackItem[]
  max?: number
  size?: number
  className?: string
}

/** Overlapping row of avatars with a "+N" overflow chip. */
export function AvatarStack({
  people,
  max = 4,
  size = 32,
  className,
}: AvatarStackProps) {
  const shown = people.slice(0, max)
  const overflow = people.length - shown.length
  return (
    <div className={cn('flex items-center', className)}>
      {shown.map((person, i) => (
        <span
          key={person.seed ?? `${person.name}-${i}`}
          className="rounded-full ring-2 ring-surface"
          style={{ marginLeft: i === 0 ? 0 : -size * 0.3 }}
        >
          <Avatar name={person.name} seed={person.seed} size={size} />
        </span>
      ))}
      {overflow > 0 && (
        <span
          className="grid place-items-center rounded-full bg-surface-alt font-mono text-muted ring-2 ring-surface"
          style={{
            width: size,
            height: size,
            marginLeft: -size * 0.3,
            fontSize: Math.round(size * 0.34),
          }}
        >
          +{overflow}
        </span>
      )}
    </div>
  )
}
