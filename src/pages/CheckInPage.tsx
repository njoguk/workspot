import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useActiveCheckin } from '@/hooks/useCheckins'
import { CheckInPicker } from '@/components/checkin/CheckInPicker'
import { ActiveCheckIn } from '@/components/checkin/ActiveCheckIn'
import { Skeleton } from '@/components/ui/Skeleton'

/**
 * The check-in home. When signed in and checked in it shows the live active
 * session; otherwise it shows the spot picker inline. Signed-out visitors get
 * a gentle gate. The global floating dock is hidden on this route.
 */
export default function CheckInPage() {
  const { isLoggedIn, loading } = useAuth()
  const { data: active, isLoading } = useActiveCheckin()

  return (
    <div className="py-6">
      <header className="mb-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
          Check In
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-text">
          {active ? 'Your session' : 'Where are you working from?'}
        </h1>
      </header>

      {!loading && !isLoggedIn ? (
        <div className="rounded-lg border border-border bg-surface py-14 text-center">
          <p className="text-4xl" aria-hidden="true">
            📍
          </p>
          <p className="mt-3 font-display text-xl font-bold text-text">
            Log in to check in
          </p>
          <p className="mx-auto mt-2 max-w-xs font-sans text-sm text-muted">
            Check in to track your streak, see who else is working nearby, and
            leave reviews.
          </p>
          <Link
            to="/auth"
            state={{ from: '/check-in' }}
            className="mt-6 inline-flex h-11 min-h-[44px] items-center rounded-pill bg-primary px-5 font-sans text-sm font-semibold text-inverse"
          >
            Log in
          </Link>
        </div>
      ) : isLoading ? (
        <Skeleton className="h-48 w-full rounded-lg" />
      ) : active ? (
        <ActiveCheckIn checkin={active} />
      ) : (
        <div className="rounded-lg border border-border bg-surface p-5">
          <CheckInPicker onDone={() => undefined} />
        </div>
      )}
    </div>
  )
}
