import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { SCORE_LABEL } from '@/config/platform'
import {
  useReviewSchema,
  useSpotMetricAverage,
  useSubmitReview,
  calcOverallScore,
} from '@/hooks/useReviews'
import { useToast } from '@/contexts/ToastContext'
import { StarRating } from '@/components/ui/StarRating'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

export interface ReviewFlowSpot {
  id: string
  name: string
  type: string
  coverGradient: string | null
  neighbourhood?: string | null
  scoreLabel?: string | null
}

interface ReviewFlowProps {
  spot: ReviewFlowSpot
  onClose: () => void
  /** Called after a successful submit (e.g. to navigate to the spot detail). */
  onSubmitted?: (spotId: string) => void
}

const COMMENT_MAX = 280

/**
 * Config-driven review flow (Phase 2 Part B, STEP 7). A full-screen modal with
 * three steps — star ratings, the primary metric + note, and quick tags — all
 * sourced from the spot type's `review_schemas` row.
 */
export function ReviewFlow({ spot, onClose, onSubmitted }: ReviewFlowProps) {
  const { data: schema, isLoading, isError } = useReviewSchema(spot.type)
  const { data: metricAvg } = useSpotMetricAverage(spot.id)
  const submit = useSubmitReview()
  const { showToast } = useToast()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [metricValue, setMetricValue] = useState('')
  const [comment, setComment] = useState('')
  const [tags, setTags] = useState<Set<string>>(new Set())

  const scoreLabel = spot.scoreLabel ?? schema?.score_label ?? SCORE_LABEL

  const allRated = useMemo(
    () => Boolean(schema) && schema!.categories.every((c) => (ratings[c.key] ?? 0) > 0),
    [schema, ratings],
  )

  const overall = useMemo(
    () => (schema ? calcOverallScore(schema.categories, ratings) : 0),
    [schema, ratings],
  )

  const numericMetric = metricValue === '' ? null : Number(metricValue)
  const metricUnit = schema?.primary_metric_unit ?? ''

  function toggleTag(tag: string) {
    setTags((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  async function handleSubmit() {
    if (!schema) return
    try {
      await submit.mutateAsync({
        spotId: spot.id,
        spaceType: spot.type,
        ratings,
        overallScore: overall,
        primaryMetricValue: numericMetric,
        comment: comment.trim() || null,
        quickTags: [...tags],
      })
      showToast('Review submitted — thank you!', { icon: '🌟' })
      onClose()
      onSubmitted?.(spot.id)
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Could not submit review.',
        { icon: '⚠️' },
      )
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex items-end justify-center md:items-center"
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <motion.button
          type="button"
          aria-label="Close review"
          onClick={onClose}
          className="absolute inset-0"
          style={{ background: 'color-mix(in srgb, var(--color-dark) 55%, transparent)' }}
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
          transition={{ duration: 0.25 }}
        />

        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Review ${spot.name}`}
          className="relative flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-xl bg-surface shadow-xl md:max-h-[88vh] md:rounded-xl"
          variants={{
            hidden: { y: '100%', opacity: 0.6 },
            visible: { y: 0, opacity: 1 },
          }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header */}
          <div
            className="relative shrink-0 p-5"
            style={{ background: spot.coverGradient ?? 'var(--color-dark)' }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to top, color-mix(in srgb, var(--color-dark) 80%, transparent), color-mix(in srgb, var(--color-dark) 30%, transparent))',
              }}
              aria-hidden="true"
            />
            <div className="relative flex items-start justify-between">
              <div>
                <p
                  className="font-mono text-[10px] uppercase tracking-widest"
                  style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 70%, transparent)' }}
                >
                  Step {step} of 3
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-inverse">
                  Rate {spot.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-pill bg-surface text-dark shadow-sm"
              >
                <X size={16} />
              </button>
            </div>
            {/* Progress */}
            <div className="relative mt-4 flex gap-1.5">
              {[1, 2, 3].map((s) => (
                <span
                  key={s}
                  className="h-1 flex-1 rounded-pill"
                  style={{
                    background:
                      s <= step
                        ? 'var(--color-secondary)'
                        : 'color-mix(in srgb, var(--color-text-inverse) 30%, transparent)',
                  }}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-md" />
                ))}
              </div>
            ) : isError || !schema ? (
              <div className="py-10 text-center">
                <p className="font-display text-lg font-bold text-text">
                  Reviews aren&rsquo;t available here yet
                </p>
                <p className="mt-2 font-sans text-sm text-muted">
                  We couldn&rsquo;t load the rating form for this spot type.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-6 inline-flex h-11 min-h-[44px] items-center rounded-pill bg-dark px-5 font-sans text-sm font-semibold text-inverse"
                >
                  Close
                </button>
              </div>
            ) : step === 1 ? (
              <div className="space-y-1">
                <p className="mb-3 font-sans text-sm text-muted">
                  How was it? Rate each area from 1 to 5.
                </p>
                {schema.categories.map((cat) => (
                  <div
                    key={cat.key}
                    className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0"
                  >
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true" className="text-lg">
                        {cat.icon}
                      </span>
                      <span className="font-sans text-sm font-medium text-text">
                        {cat.label}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <StarRating
                        value={ratings[cat.key] ?? 0}
                        onChange={(v) =>
                          setRatings((prev) => ({ ...prev, [cat.key]: v }))
                        }
                        label={cat.label}
                      />
                      <span className="w-4 text-right font-mono text-sm text-muted">
                        {ratings[cat.key] ?? '–'}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            ) : step === 2 ? (
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="metric"
                    className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-muted"
                  >
                    {schema.primary_metric_label}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="metric"
                      inputMode="numeric"
                      value={metricValue}
                      onChange={(e) =>
                        setMetricValue(e.target.value.replace(/[^0-9]/g, ''))
                      }
                      placeholder="0"
                      className="h-12 w-28 rounded-sm border border-border bg-surface-alt px-3 font-mono text-lg text-text focus:border-primary focus:outline-none"
                    />
                    <span className="font-mono text-sm text-muted">{metricUnit}</span>
                  </div>
                  <p className="mt-2 font-sans text-xs text-light">
                    {metricAvg && metricAvg.count > 0
                      ? `${schema.primary_metric_avg_label}: ${metricAvg.average} ${metricUnit} from ${metricAvg.count} test${metricAvg.count === 1 ? '' : 's'}`
                      : 'Be the first to test here.'}
                  </p>

                  {numericMetric != null && numericMetric > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 flex items-center gap-2 rounded-md px-3 py-2.5"
                      style={{
                        background: 'color-mix(in srgb, var(--color-success) 14%, transparent)',
                      }}
                    >
                      <span className="font-mono text-sm font-medium text-success">
                        {numericMetric} {metricUnit} · ✓ Saved
                      </span>
                    </motion.div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="note"
                    className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-muted"
                  >
                    Your note
                  </label>
                  <textarea
                    id="note"
                    value={comment}
                    maxLength={COMMENT_MAX}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What should other remote workers know?"
                    className="min-h-[120px] w-full resize-none rounded-md border border-border bg-surface-alt p-3 font-sans text-sm text-text placeholder:text-light focus:border-primary focus:outline-none"
                  />
                  <p className="mt-1 text-right font-mono text-[11px] text-light">
                    {comment.length}/{COMMENT_MAX}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <TagGroup
                  title="Conditions"
                  tags={schema.quick_tags.conditions}
                  selected={tags}
                  onToggle={toggleTag}
                />
                <TagGroup
                  title="Vibe"
                  tags={schema.quick_tags.vibe}
                  selected={tags}
                  onToggle={toggleTag}
                />

                <div className="rounded-lg bg-dark p-5">
                  <p
                    className="font-mono text-[11px] uppercase tracking-widest"
                    style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 60%, transparent)' }}
                  >
                    🌟 Your {scoreLabel} contribution
                  </p>
                  <p className="mt-2 font-display text-4xl font-black text-secondary">
                    {overall.toFixed(1)}
                    <span
                      className="ml-1 font-mono text-sm font-normal"
                      style={{ color: 'color-mix(in srgb, var(--color-text-inverse) 55%, transparent)' }}
                    >
                      / 10
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submit.isPending}
                    className="mt-4 flex h-12 w-full min-h-[44px] items-center justify-center rounded-pill bg-secondary font-sans text-sm font-semibold text-dark transition-opacity duration-fast hover:opacity-90 disabled:opacity-60"
                  >
                    {submit.isPending ? 'Submitting…' : 'Submit Review ✓'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer nav (steps 1–2 only, and only with a valid schema) */}
          {!isLoading && !isError && schema && step < 3 && (
            <div className="shrink-0 border-t border-border p-4">
              <button
                type="button"
                disabled={step === 1 && !allRated}
                onClick={() => setStep((s) => (s === 1 ? 2 : 3))}
                className="flex h-12 w-full min-h-[44px] items-center justify-center rounded-pill bg-primary font-sans text-sm font-semibold text-inverse transition-opacity duration-fast hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {step === 1
                  ? `Next: ${schema.primary_metric_label ?? 'Details'} →`
                  : 'Next: Quick Tags →'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function TagGroup({
  title,
  tags,
  selected,
  onToggle,
}: {
  title: string
  tags: string[]
  selected: Set<string>
  onToggle: (tag: string) => void
}) {
  return (
    <div>
      <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-light">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const active = selected.has(tag)
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(tag)}
              className={cn(
                'min-h-[40px] rounded-pill border px-3.5 py-2 font-sans text-[13px] font-medium transition-colors duration-fast',
                active
                  ? 'border-dark bg-dark text-inverse'
                  : 'border-border-strong text-muted hover:border-primary hover:text-primary',
              )}
            >
              {tag}
            </button>
          )
        })}
      </div>
    </div>
  )
}
