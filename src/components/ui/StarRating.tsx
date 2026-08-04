import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  /** Star glyph size in px (touch target stays ≥44px regardless). */
  size?: number
  label?: string
}

/**
 * Five-star tap rating (Phase 2 Part B, STEP 7). Active stars fill amber;
 * inactive show a muted outline. Rendered as an accessible radiogroup.
 */
export function StarRating({ value, onChange, size = 22, label }: StarRatingProps) {
  return (
    <div
      role="radiogroup"
      aria-label={label ?? 'Rating'}
      className="flex items-center"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n)}
          className="grid h-11 w-9 place-items-center rounded-sm transition-transform duration-fast hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Star
            size={size}
            strokeWidth={1.75}
            className={cn(
              n <= value
                ? 'fill-secondary text-secondary'
                : 'fill-transparent text-border-strong',
            )}
          />
        </button>
      ))}
    </div>
  )
}
