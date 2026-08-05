import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Spot } from '@/types'
import { SpotCardFeatured } from '@/components/spots/SpotCardFeatured'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

interface HeroSpotCarouselProps {
  spots: Spot[] | undefined
  isLoading?: boolean
  /** Show the "Book a slot" shortcut on the card (WorkPass members). */
  showBook?: boolean
}

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 48 : -48 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -48 : 48 }),
}

/**
 * Story-style hero carousel: one featured/premium spot on screen at a time,
 * using the same tall card as Editor's Picks. Dot indicators + side arrows give
 * the slide affordance; it also auto-advances gently. Sits to the right of the
 * hero copy on desktop and below it on mobile.
 */
export function HeroSpotCarousel({ spots, isLoading, showBook = false }: HeroSpotCarouselProps) {
  const [[index, direction], setState] = useState<[number, number]>([0, 0])
  const count = spots?.length ?? 0

  const paginate = useCallback(
    (dir: number) => {
      setState(([i]) => {
        if (count === 0) return [0, dir]
        return [(i + dir + count) % count, dir]
      })
    },
    [count],
  )

  const goTo = useCallback((target: number) => {
    setState(([i]) => [target, target >= i ? 1 : -1])
  }, [])

  // Gentle auto-advance; the timer resets whenever the active slide changes.
  useEffect(() => {
    if (count <= 1) return
    const t = window.setInterval(() => paginate(1), 6000)
    return () => window.clearInterval(t)
  }, [count, index, paginate])

  if (isLoading) {
    return <Skeleton className="h-[440px] w-full rounded-lg" />
  }
  if (!spots || count === 0) return null

  const safeIndex = Math.min(index, count - 1)
  const spot = spots[safeIndex]

  return (
    <div
      className="relative w-full"
      role="group"
      aria-roledescription="carousel"
      aria-label="Featured spots"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') paginate(-1)
        if (e.key === 'ArrowRight') paginate(1)
      }}
    >
      <div className="relative">
        <div className="relative h-[440px] overflow-hidden rounded-lg">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={spot.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <SpotCardFeatured spot={spot} showBook={showBook} className="block h-full" />
            </motion.div>
          </AnimatePresence>
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => paginate(-1)}
              aria-label="Previous spot"
              className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-pill bg-surface text-dark shadow-md transition-opacity duration-fast hover:opacity-90"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => paginate(1)}
              aria-label="Next spot"
              className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-pill bg-surface text-dark shadow-md transition-opacity duration-fast hover:opacity-90"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1">
          {spots.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show spot ${i + 1} of ${count}`}
              aria-current={i === safeIndex}
              className="grid h-11 place-items-center px-1"
            >
              <span
                className={cn(
                  'block h-2 rounded-pill transition-all duration-normal',
                  i === safeIndex ? 'w-6 bg-secondary' : 'w-2',
                )}
                style={
                  i === safeIndex
                    ? undefined
                    : { backgroundColor: 'color-mix(in srgb, var(--color-text-inverse) 40%, transparent)' }
                }
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
