import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useAddTip, TIP_TAG_OPTIONS, type TipTag } from '@/hooks/useTips'
import { useToast } from '@/contexts/ToastContext'
import { cn } from '@/lib/utils'

const MAX = 280

/**
 * Bottom-sheet composer for a first-class tip. Scoped to a spot (`spotId`),
 * a community group (`groupId`), or both. `targetLabel` is the human context
 * shown in the header, e.g. a spot name or group name.
 */
export function AddTipSheet({
  open,
  onClose,
  spotId,
  groupId,
  targetLabel,
  onAdded,
}: {
  open: boolean
  onClose: () => void
  spotId?: string | null
  groupId?: string | null
  targetLabel?: string
  onAdded?: () => void
}) {
  const addTip = useAddTip()
  const { showToast } = useToast()
  const [body, setBody] = useState('')
  const [tag, setTag] = useState<TipTag>('general')

  function reset() {
    setBody('')
    setTag('general')
  }

  async function submit() {
    const trimmed = body.trim()
    if (!trimmed) return
    try {
      await addTip.mutateAsync({ body: trimmed, tag, spotId, groupId })
      showToast('Tip added — thanks!', { icon: '💡' })
      reset()
      onAdded?.()
      onClose()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not add your tip.', {
        icon: '⚠️',
      })
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center md:items-center"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.button
            type="button"
            aria-label="Cancel"
            onClick={onClose}
            className="absolute inset-0"
            style={{ background: 'color-mix(in srgb, var(--color-dark) 55%, transparent)' }}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            transition={{ duration: 0.25 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Add a tip"
            className="relative w-full max-w-content rounded-t-xl bg-surface px-5 pb-8 pt-5 shadow-xl md:mb-6 md:max-w-md md:rounded-xl md:px-6"
            variants={{ hidden: { y: '100%' }, visible: { y: 0 } }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-pill text-muted transition-colors duration-fast hover:bg-surface-alt"
            >
              <X size={18} />
            </button>

            <h2 className="font-display text-xl font-bold text-text">Add a tip</h2>
            {targetLabel && (
              <p className="mt-1 font-sans text-sm text-muted">
                Share what you know about{' '}
                <span className="font-semibold text-text">{targetLabel}</span>.
              </p>
            )}

            {/* Tag selector */}
            <div className="mt-4 flex flex-wrap gap-2">
              {TIP_TAG_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTag(opt.value)}
                  aria-pressed={tag === opt.value}
                  className={cn(
                    'inline-flex min-h-[36px] items-center rounded-pill border px-3 font-sans text-[13px] font-medium transition-colors duration-fast',
                    tag === opt.value
                      ? 'border-dark bg-dark text-inverse'
                      : 'border-border-strong text-muted hover:border-primary hover:text-primary',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, MAX))}
              placeholder="e.g. Ask for a seat near the window — best light and closest sockets."
              aria-label="Your tip"
              rows={4}
              className="mt-4 w-full resize-none rounded-md border border-border bg-surface-alt px-4 py-3 font-sans text-sm text-text placeholder:text-light focus:border-primary focus:outline-none"
            />
            <div className="mt-1 text-right font-mono text-[11px] text-light">
              {body.length}/{MAX}
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={!body.trim() || addTip.isPending}
              className="mt-3 flex h-12 w-full min-h-[44px] items-center justify-center rounded-pill bg-primary font-sans text-sm font-semibold text-inverse transition-opacity duration-fast hover:opacity-90 disabled:opacity-50"
            >
              {addTip.isPending ? 'Posting…' : 'Post tip'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
