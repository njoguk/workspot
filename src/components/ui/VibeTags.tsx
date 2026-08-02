import { cn } from '@/lib/utils'

interface VibeTagsProps {
  tags: string[]
  max?: number
  className?: string
}

/**
 * Pill-shaped vibe tags on a neutral surface. Truncates to `max`.
 * Spec: docs/BUILD_PLAN.md Session 2 STEP 6.
 */
export function VibeTags({ tags, max = 3, className }: VibeTagsProps) {
  const shown = tags.slice(0, max)
  return (
    <ul className={cn('flex flex-wrap gap-1.5', className)}>
      {shown.map((tag) => (
        <li
          key={tag}
          className="rounded-pill bg-surface-alt px-2.5 py-1 font-sans text-[11px] text-muted"
        >
          {tag}
        </li>
      ))}
    </ul>
  )
}
