import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Skeleton } from '@/components/ui/Skeleton'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Gate for authenticated-only routes (Phase 2 STEP 4). Redirects to /auth
 * when there is no session, preserving the intended path in router state so
 * we can return the user after they sign in. While the initial session check
 * is in flight we render a skeleton rather than flashing the login page.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoggedIn, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Skeleton className="h-12 w-12 rounded-pill" />
        <Skeleton className="h-4 w-40" />
        <span className="sr-only">Checking your session…</span>
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
