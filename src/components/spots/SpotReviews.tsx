import { useSpotReviews } from '@/hooks/useReviews'
import { useUserBadges } from '@/hooks/useUserBadges'
import { Avatar } from '@/components/ui/Avatar'
import { BadgeTag } from '@/components/ui/BadgeTag'
import { Skeleton } from '@/components/ui/Skeleton'
import { timeAgo } from '@/lib/time'

/** Recent reviews for a spot (net-new read-back — reviews had no display before). */
export function SpotReviews({ spotId }: { spotId: string }) {
  const { data: reviews, isLoading, isError } = useSpotReviews(spotId)
  const { data: badges } = useUserBadges((reviews ?? []).map((r) => r.userId))

  return (
    <div>
      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-light">
        Reviews
      </h2>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <p className="rounded-lg bg-surface py-8 text-center font-sans text-sm text-muted">
          Couldn&rsquo;t load reviews right now.
        </p>
      ) : reviews && reviews.length > 0 ? (
        <ul className="space-y-3">
          {reviews.map((review) => {
            const badge = badges?.[review.userId]?.[0]
            return (
              <li key={review.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={review.userName} seed={review.userId} size={32} />
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 font-sans text-sm font-semibold text-text">
                        <span className="truncate">{review.userName ?? 'A member'}</span>
                        {badge && <BadgeTag badge={badge} />}
                      </p>
                      <p className="font-mono text-[11px] text-muted">
                        {timeAgo(review.createdAt)}
                      </p>
                    </div>
                  </div>
                  {review.overallScore != null && (
                    <span className="shrink-0 rounded-pill bg-secondary px-2.5 py-1 font-mono text-[11px] font-semibold text-dark">
                      {review.overallScore.toFixed(1)}
                    </span>
                  )}
                </div>

                {review.comment?.trim() && (
                  <p className="mt-3 font-sans text-sm leading-relaxed text-text">
                    {review.comment}
                  </p>
                )}

                {review.quickTags.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {review.quickTags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-pill bg-surface-alt px-2.5 py-1 font-sans text-[12px] text-muted"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="rounded-lg bg-surface py-8 text-center font-sans text-sm text-muted">
          No reviews yet — check in and be the first to rate this spot.
        </p>
      )}
    </div>
  )
}
