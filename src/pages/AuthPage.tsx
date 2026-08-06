import { useState, type FormEvent, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { AuthError } from '@supabase/supabase-js'
import { PLATFORM } from '@/config/platform'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

type Tab = 'signup' | 'login'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Turn a Supabase AuthError into a user-facing message. Server-side failures
 * (e.g. a signup trigger raising) come back as a 5xx with an empty/`{}` body,
 * which must never be shown verbatim.
 */
function friendlyAuthError(error: AuthError): string {
  const raw = error.message?.trim() ?? ''
  const status = error.status ?? 0
  if (status >= 500 || raw === '' || raw === '{}') {
    return 'Something went wrong on our end. Please try again in a moment.'
  }
  return raw
}

interface LocationState {
  from?: string
}

export default function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth()

  const [tab, setTab] = useState<Tab>('signup')

  const [accountType, setAccountType] = useState<'member' | 'partner'>('member')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const from = (location.state as LocationState | null)?.from ?? '/'

  function switchTab(next: Tab) {
    setTab(next)
    setErrors({})
    setFormError(null)
    setResetSent(false)
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    const next: Record<string, string> = {}
    if (!firstName.trim()) next.firstName = 'First name is required'
    if (!lastName.trim()) next.lastName = 'Last name is required'
    if (!EMAIL_RE.test(email)) next.email = 'Enter a valid email address'
    if (password.length < 8) next.password = 'Password must be at least 8 characters'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    const { error } = await signUp({ firstName, lastName, email, password, accountType })
    setSubmitting(false)
    if (error) {
      setFormError(friendlyAuthError(error))
      return
    }
    navigate(accountType === 'partner' ? '/partner/dashboard' : '/onboarding')
  }

  async function handleLogIn(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    const next: Record<string, string> = {}
    if (!EMAIL_RE.test(email)) next.email = 'Enter a valid email address'
    if (!password) next.password = 'Password is required'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) {
      setFormError(friendlyAuthError(error))
      return
    }
    navigate(from)
  }

  async function handleForgotPassword() {
    setFormError(null)
    if (!EMAIL_RE.test(email)) {
      setErrors((prev) => ({ ...prev, email: 'Enter your email first' }))
      return
    }
    setSubmitting(true)
    const { error } = await resetPassword(email)
    setSubmitting(false)
    if (error) {
      setFormError(friendlyAuthError(error))
      return
    }
    setResetSent(true)
  }

  async function handleGoogle() {
    setFormError(null)
    const { error } = await signInWithGoogle()
    if (error) setFormError(friendlyAuthError(error))
  }

  return (
    <div className="pb-10">
      {/* ── Hero (dark, 200px) ── */}
      <section className="full-bleed relative flex h-[200px] items-center justify-center overflow-hidden bg-dark">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 25%, color-mix(in srgb, var(--color-primary) 40%, transparent) 0%, transparent 60%)',
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col items-center">
          <span className="font-display text-4xl font-bold tracking-tight text-inverse">
            {PLATFORM.name}
          </span>
          <span className="mt-1 font-display text-lg italic text-secondary">
            Nairobi
          </span>
        </div>
      </section>

      {/* ── Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto -mt-10 max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg md:p-8"
      >
        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Sign up or log in"
          className="mb-6 grid grid-cols-2 gap-1 rounded-pill bg-surface-alt p-1"
        >
          {(['signup', 'login'] as const).map((key) => (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={tab === key}
              onClick={() => switchTab(key)}
              className={cn(
                'h-10 min-h-[44px] rounded-pill font-sans text-sm font-semibold transition-colors duration-fast',
                tab === key
                  ? 'bg-dark text-inverse shadow-sm'
                  : 'text-muted hover:text-text',
              )}
            >
              {key === 'signup' ? 'Sign Up' : 'Log In'}
            </button>
          ))}
        </div>

        {formError && (
          <p
            role="alert"
            className="mb-4 rounded-md bg-surface-alt px-3 py-2 font-sans text-sm text-primary"
          >
            {formError}
          </p>
        )}

        {tab === 'signup' ? (
          <form onSubmit={handleSignUp} noValidate className="space-y-4">
            {/* Account type */}
            <div>
              <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-muted">
                I want to
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { key: 'member', label: 'Find spaces', hint: 'Discover & book' },
                    { key: 'partner', label: 'List my space', hint: 'Become a partner' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setAccountType(opt.key)}
                    aria-pressed={accountType === opt.key}
                    className={cn(
                      'flex min-h-[44px] flex-col items-start rounded-md border px-3 py-2 text-left transition-colors duration-fast',
                      accountType === opt.key
                        ? 'border-primary bg-surface-alt'
                        : 'border-border hover:border-border-strong',
                    )}
                  >
                    <span className="font-sans text-sm font-semibold text-text">{opt.label}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wide text-light">
                      {opt.hint}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field
                id="firstName"
                label="First Name"
                autoComplete="given-name"
                value={firstName}
                onChange={setFirstName}
                error={errors.firstName}
              />
              <Field
                id="lastName"
                label="Last Name"
                autoComplete="family-name"
                value={lastName}
                onChange={setLastName}
                error={errors.lastName}
              />
            </div>
            <Field
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={setEmail}
              error={errors.email}
            />
            <Field
              id="password"
              label="Password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
              error={errors.password}
              hint="At least 8 characters"
            />
            <SubmitButton submitting={submitting}>Create account</SubmitButton>
          </form>
        ) : (
          <form onSubmit={handleLogIn} noValidate className="space-y-4">
            <Field
              id="login-email"
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={setEmail}
              error={errors.email}
            />
            <Field
              id="login-password"
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              error={errors.password}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="font-sans text-xs font-medium text-muted hover:text-primary"
              >
                Forgot password?
              </button>
            </div>
            {resetSent && (
              <p className="rounded-md bg-surface-alt px-3 py-2 font-sans text-sm text-success">
                Check your email for a reset link.
              </p>
            )}
            <SubmitButton submitting={submitting}>Log in</SubmitButton>
          </form>
        )}

        {/* Divider */}
        <div className="my-6 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-border" />
          <span className="font-mono text-xs uppercase tracking-widest text-light">
            or
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          className="flex h-12 w-full min-h-[44px] items-center justify-center gap-3 rounded-pill border border-border-strong bg-surface font-sans text-sm font-semibold text-text transition-colors duration-fast hover:bg-surface-alt"
        >
          <span
            aria-hidden="true"
            className="grid h-5 w-5 place-items-center rounded-pill border border-border-strong font-display text-xs font-bold"
          >
            G
          </span>
          Continue with Google
        </button>
      </motion.div>
    </div>
  )
}

// ── Local field + submit helpers ───────────────────────────────

interface FieldProps {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  autoComplete?: string
  error?: string
  hint?: string
}

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  error,
  hint,
}: FieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-muted"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={cn(
          'h-12 w-full rounded-sm border bg-surface-alt px-3 font-sans text-sm text-text placeholder:text-light focus:outline-none focus:ring-2 focus:ring-primary/40',
          error ? 'border-primary' : 'border-border focus:border-primary',
        )}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1 font-sans text-xs text-primary">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 font-sans text-xs text-light">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function SubmitButton({
  submitting,
  children,
}: {
  submitting: boolean
  children: ReactNode
}) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className="flex h-12 w-full min-h-[44px] items-center justify-center rounded-pill bg-primary font-sans text-sm font-semibold text-inverse transition-opacity duration-fast hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {submitting ? 'Please wait…' : children}
    </button>
  )
}
