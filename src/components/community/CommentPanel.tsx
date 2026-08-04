import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useComments, useAddComment, type CommentTargetType } from '@/hooks/useComments'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { timeAgo } from '@/lib/time'

const MAX = 240

/**
 * Expandable comment thread for a feed item (Community v2, Phase C1).
 * Rendered below a row's action bar when the 💬 toggle is open; subscribes to
 * realtime while mounted so new replies appear without a refresh.
 */
export function CommentPanel({
  targetType,
  targetId,
}: {
  targetType: CommentTargetType
  targetId: string
}) {
  const { isLoggedIn } = useAuth()
  const { showToast } = useToast()
  const { data: comments, isLoading } = useComments(targetType, targetId, true)
  const add = useAddComment(targetType, targetId)
  const [draft, setDraft] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    const body = draft.trim()
    if (!body) return
    try {
      await add.mutateAsync(body)
      setDraft('')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not post comment.', {
        icon: '⚠️',
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-3 overflow-hidden border-t border-border pt-3"
    >
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-4/5" />
        </div>
      ) : comments && comments.length > 0 ? (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex items-start gap-2.5">
              <Avatar name={c.authorName} seed={c.authorId} size={26} />
              <div className="min-w-0 flex-1">
                <p className="font-sans text-[13px] text-text">
                  <span className="font-semibold">{c.authorName ?? 'Member'}</span>{' '}
                  <span className="font-mono text-[10px] text-light">
                    {timeAgo(c.createdAt)}
                  </span>
                </p>
                <p className="font-sans text-sm leading-snug text-muted">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-1 font-sans text-xs text-light">
          No comments yet — start the thread.
        </p>
      )}

      {isLoggedIn ? (
        <form onSubmit={submit} className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={draft}
            maxLength={MAX}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment…"
            aria-label="Add a comment"
            className="h-9 flex-1 rounded-pill border border-border bg-surface-alt px-3.5 font-sans text-sm text-text placeholder:text-light focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={!draft.trim() || add.isPending}
            className="h-9 min-h-[36px] shrink-0 rounded-pill bg-dark px-4 font-sans text-xs font-semibold text-inverse transition-opacity duration-fast hover:opacity-90 disabled:opacity-50"
          >
            {add.isPending ? '…' : 'Post'}
          </button>
        </form>
      ) : (
        <p className="mt-3 font-sans text-xs text-light">
          Sign in to join the conversation.
        </p>
      )}
    </motion.div>
  )
}
