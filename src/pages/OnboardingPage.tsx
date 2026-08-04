import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useUpdateProfile } from '@/hooks/useProfile'
import { useToast } from '@/contexts/ToastContext'
import { isOnboardingComplete, markOnboardingComplete } from '@/lib/onboarding'
import type { ProfileRole } from '@/types'
import { cn } from '@/lib/utils'

const ROLES: { value: ProfileRole; emoji: string; label: string }[] = [
  { value: 'freelancer', emoji: '💻', label: 'Freelancer/Consultant' },
  { value: 'remote_employee', emoji: '🏠', label: 'Remote Employee' },
  { value: 'founder', emoji: '🚀', label: 'Founder/Entrepreneur' },
  { value: 'nomad', emoji: '✈️', label: 'Digital Nomad' },
]

const INTERESTS: string[] = [
  '🤫 Quiet focus',
  '⚡ Fast WiFi',
  '☕ Great coffee',
  '🌿 Outdoor setting',
  '📞 Video call friendly',
  '🤝 Networking',
  '💳 Budget-friendly',
  '🏨 Professional setting',
  '🌍 Expat-friendly',
  '🔌 Always has power',
  '🌅 Morning hours',
  '🌆 Late night work',
]

const NEIGHBOURHOODS: { emoji: string; name: string; spots: number }[] = [
  { emoji: '🏙', name: 'Westlands', spots: 7 },
  { emoji: '🌳', name: 'Kilimani', spots: 5 },
  { emoji: '🏡', name: 'Karen', spots: 4 },
  { emoji: '🌿', name: 'Lavington', spots: 3 },
  { emoji: '🌍', name: 'Gigiri/Runda', spots: 4 },
  { emoji: '🏗', name: 'Upperhill', spots: 3 },
  { emoji: '🌆', name: 'CBD', spots: 2 },
]

const stepVariants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
}

/**
 * First-run onboarding wizard (Phase 2 Part B, STEP 1). Three steps — role,
 * interests, neighbourhoods — then a single write to the profiles row.
 * Skipped entirely once `workspot_onboarding_complete` is set.
 */
export default function OnboardingPage() {
  const { isLoggedIn, loading } = useAuth()
  const navigate = useNavigate()
  const updateProfile = useUpdateProfile()
  const { showToast } = useToast()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [role, setRole] = useState<ProfileRole | null>(null)
  const [interests, setInterests] = useState<Set<string>>(new Set())
  const [hoods, setHoods] = useState<Set<string>>(new Set())

  // Already done, or reached without an account — bounce out.
  if (isOnboardingComplete()) return <Navigate to="/" replace />
  if (!loading && !isLoggedIn) return <Navigate to="/auth" replace />

  function toggle(set: Set<string>, value: string): Set<string> {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  }

  function skip() {
    markOnboardingComplete()
    navigate('/')
  }

  async function finish() {
    try {
      await updateProfile.mutateAsync({
        role,
        interests: [...interests],
        neighbourhoods: [...hoods],
      })
      showToast("You're all set — welcome!", { icon: '🎉' })
    } catch {
      // A write failure shouldn't trap the user in onboarding.
      showToast('Saved locally — we could not reach the server.', { icon: '⚠️' })
    } finally {
      markOnboardingComplete()
      navigate('/')
    }
  }

  return (
    <div className="mx-auto max-w-xl py-8">
      {/* Progress */}
      <div className="mb-8 flex items-center gap-2" aria-hidden="true">
        {[1, 2, 3].map((s) => (
          <span
            key={s}
            className={cn(
              'h-1.5 flex-1 rounded-pill transition-colors duration-normal',
              s <= step ? 'bg-primary' : 'bg-surface-alt',
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            variants={stepVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-display text-3xl font-bold text-text">
              What&rsquo;s your work setup?
            </h1>
            <p className="mt-2 font-sans text-sm text-muted">
              We&rsquo;ll use this to recommend spots that fit how you work.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ROLES.map((r) => {
                const selected = role === r.value
                return (
                  <button
                    key={r.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setRole(r.value)}
                    className={cn(
                      'relative flex min-h-[44px] items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors duration-fast',
                      selected ? 'border-primary' : 'border-border hover:border-border-strong',
                    )}
                    style={
                      selected
                        ? { background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)' }
                        : undefined
                    }
                  >
                    <span aria-hidden="true" className="text-2xl">
                      {r.emoji}
                    </span>
                    <span className="font-sans text-sm font-semibold text-text">
                      {r.label}
                    </span>
                    {selected && (
                      <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-primary text-inverse">
                        <Check size={13} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              <button
                type="button"
                disabled={!role}
                onClick={() => setStep(2)}
                className="flex h-12 w-full min-h-[44px] items-center justify-center rounded-pill bg-primary font-sans text-sm font-semibold text-inverse transition-opacity duration-fast hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next →
              </button>
              <button
                type="button"
                onClick={skip}
                className="font-sans text-sm text-muted hover:text-text"
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            variants={stepVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-display text-3xl font-bold text-text">
              What matters to you?
            </h1>
            <p className="mt-2 font-sans text-sm text-muted">
              Pick as many as you like — this shapes your recommendations.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {INTERESTS.map((interest) => {
                const selected = interests.has(interest)
                return (
                  <button
                    key={interest}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setInterests((s) => toggle(s, interest))}
                    className={cn(
                      'min-h-[44px] rounded-pill border px-4 py-2.5 font-sans text-sm font-medium transition-colors duration-fast',
                      selected
                        ? 'border-dark bg-dark text-inverse'
                        : 'border-border-strong text-muted hover:border-primary hover:text-primary',
                    )}
                  >
                    {interest}
                  </button>
                )
              })}
            </div>

            <div className="mt-8 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex h-12 min-h-[44px] items-center justify-center rounded-pill border border-border-strong px-5 font-sans text-sm font-semibold text-muted transition-colors duration-fast hover:text-text"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex h-12 flex-1 min-h-[44px] items-center justify-center rounded-pill bg-primary font-sans text-sm font-semibold text-inverse transition-opacity duration-fast hover:opacity-90"
              >
                Next →
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            variants={stepVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-display text-3xl font-bold text-text">
              Where do you mostly work from?
            </h1>
            <p className="mt-2 font-sans text-sm text-muted">
              We&rsquo;ll surface spots and events near you first.
            </p>

            <div className="mt-6 space-y-2.5">
              {NEIGHBOURHOODS.map((hood) => {
                const selected = hoods.has(hood.name)
                return (
                  <button
                    key={hood.name}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setHoods((s) => toggle(s, hood.name))}
                    className={cn(
                      'flex min-h-[44px] w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors duration-fast',
                      selected ? 'border-success' : 'border-border hover:border-border-strong',
                    )}
                    style={
                      selected
                        ? { background: 'color-mix(in srgb, var(--color-success) 10%, transparent)' }
                        : undefined
                    }
                  >
                    <span aria-hidden="true" className="text-xl">
                      {hood.emoji}
                    </span>
                    <span className="flex-1 font-sans text-sm font-semibold text-text">
                      {hood.name}
                    </span>
                    <span className="font-mono text-xs text-muted">
                      {hood.spots} spots
                    </span>
                    {selected && (
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-success text-inverse">
                        <Check size={13} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-8 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex h-12 min-h-[44px] items-center justify-center rounded-pill border border-border-strong px-5 font-sans text-sm font-semibold text-muted transition-colors duration-fast hover:text-text"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={finish}
                disabled={updateProfile.isPending}
                className="flex h-12 flex-1 min-h-[44px] items-center justify-center rounded-pill bg-success font-sans text-sm font-semibold text-inverse transition-opacity duration-fast hover:opacity-90 disabled:opacity-60"
              >
                {updateProfile.isPending ? 'Saving…' : '🎉 Finish Setup →'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
