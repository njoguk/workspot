import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * Minimal global toast (Phase 2 Part B). Used for success confirmations after
 * check-ins, reviews, and RSVPs. Toasts stack bottom-centre, above the mobile
 * tab bar, and auto-dismiss.
 */

interface ToastOptions {
  icon?: string
  durationMs?: number
}

interface ToastItem {
  id: number
  message: string
  icon?: string
}

interface ToastContextValue {
  showToast: (message: string, options?: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    const id = nextId.current++
    setToasts((prev) => [...prev, { id, message, icon: options?.icon }])
    const duration = options?.durationMs ?? 2800
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-[84px] z-[70] flex flex-col items-center gap-2 px-4 md:bottom-8"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              role="status"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto flex max-w-sm items-center gap-2 rounded-pill bg-dark px-4 py-3 font-sans text-sm font-medium text-inverse shadow-lg"
            >
              {toast.icon && (
                <span aria-hidden="true" className="text-base leading-none">
                  {toast.icon}
                </span>
              )}
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a <ToastProvider>')
  return ctx
}
