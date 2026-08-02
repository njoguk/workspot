import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

/**
 * Grey animated placeholder block used for loading states across the app.
 * Uses a design-token surface tint + Tailwind's `animate-pulse`. Never a
 * spinner (see CLAUDE.md code-quality rules).
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-surface-alt', className)}
    />
  )
}

/**
 * Card-shaped skeleton matching the footprint of a SpotCard, for the
 * Explore grid loading state.
 */
export function SpotCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-16 rounded-pill" />
          <Skeleton className="h-6 w-20 rounded-pill" />
        </div>
      </div>
    </div>
  )
}
