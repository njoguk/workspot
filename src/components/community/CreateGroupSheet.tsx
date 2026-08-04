import { useEffect, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { useCreateGroup, type Group, type GroupVisibility } from '@/hooks/useGroups'
import { cn } from '@/lib/utils'

const NAME_MAX = 50
const DESC_MAX = 160

/**
 * Create-group bottom sheet (Community v2, Phase C1). Any signed-in user can
 * start a public or private group; the DB trigger makes them its admin.
 */
export function CreateGroupSheet({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (group: Group) => void
}) {
  const create = useCreateGroup()
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<GroupVisibility>('public')

  useEffect(() => {
    if (!open) {
      setName('')
      setDescription('')
      setVisibility('public')
    }
  }, [open])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      const group = await create.mutateAsync({ name, description, visibility })
      showToast(`Created ${group.name}`, { icon: '🎉' })
      onCreated(group)
      onClose()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not create group.', {
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
            aria-label="Dismiss"
            onClick={onClose}
            className="absolute inset-0"
            style={{ background: 'color-mix(in srgb, var(--color-dark) 50%, transparent)' }}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            transition={{ duration: 0.25 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Create a group"
            className="relative max-h-[90vh] w-full max-w-content overflow-y-auto rounded-t-xl bg-surface px-5 pb-8 pt-4 shadow-xl md:mb-6 md:max-w-md md:rounded-xl md:px-6"
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

            <h2 className="font-display text-2xl font-bold text-text">Create a group</h2>
            <p className="mt-1 font-sans text-sm text-muted">
              Start a space for your crew, neighbourhood, or niche.
            </p>

            <form onSubmit={submit} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="group-name"
                  className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-muted"
                >
                  Name
                </label>
                <input
                  id="group-name"
                  value={name}
                  maxLength={NAME_MAX}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Westlands Early Birds"
                  className="h-11 w-full rounded-md border border-border bg-surface-alt px-3.5 font-sans text-sm text-text placeholder:text-light focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="group-desc"
                  className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-muted"
                >
                  Description
                </label>
                <textarea
                  id="group-desc"
                  value={description}
                  maxLength={DESC_MAX}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this group about?"
                  className="min-h-[72px] w-full resize-none rounded-md border border-border bg-surface-alt p-3 font-sans text-sm text-text placeholder:text-light focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-muted">
                  Visibility
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(['public', 'private'] as GroupVisibility[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={visibility === v}
                      onClick={() => setVisibility(v)}
                      className={cn(
                        'flex min-h-[44px] flex-col items-start rounded-md border-2 px-3 py-2 text-left transition-colors duration-fast',
                        visibility === v
                          ? 'border-primary'
                          : 'border-border hover:border-border-strong',
                      )}
                      style={
                        visibility === v
                          ? { background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)' }
                          : undefined
                      }
                    >
                      <span className="font-sans text-sm font-semibold text-text">
                        {v === 'public' ? '🌍 Public' : '🔒 Private'}
                      </span>
                      <span className="font-sans text-[11px] text-muted">
                        {v === 'public' ? 'Anyone can find & join' : 'Invite-only (you manage)'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!name.trim() || create.isPending}
                className="flex h-12 w-full min-h-[44px] items-center justify-center rounded-pill bg-primary font-sans text-sm font-semibold text-inverse transition-opacity duration-fast hover:opacity-90 disabled:opacity-50"
              >
                {create.isPending ? 'Creating…' : 'Create group'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
