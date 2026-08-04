import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { RootLayout } from '@/components/layout/RootLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Skeleton } from '@/components/ui/Skeleton'
import ExplorePage from '@/pages/ExplorePage'
import SpotDetailPage from '@/pages/SpotDetailPage'
import CheckInPage from '@/pages/CheckInPage'
import CommunityPage from '@/pages/CommunityPage'
import EventsPage from '@/pages/EventsPage'
import EventDetailPage from '@/pages/EventDetailPage'
import ProfilePage from '@/pages/ProfilePage'
import AuthPage from '@/pages/AuthPage'
import PartnerLandingPage from '@/pages/PartnerLandingPage'
import OnboardingPage from '@/pages/OnboardingPage'

// The partner dashboard pulls in Recharts — lazy-load it so that chart library
// stays out of the initial bundle for everyone who isn't a venue owner.
const VenueDashboard = lazy(() => import('@/pages/partner/VenueDashboard'))
import WorkPassPage from '@/pages/WorkPassPage'
import BookingPage from '@/pages/BookingPage'
import BookingConfirmPage from '@/pages/BookingConfirmPage'
import MyBookingsPage from '@/pages/MyBookingsPage'
import NotFoundPage from '@/pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<ExplorePage />} />
        <Route path="/spot/:id" element={<SpotDetailPage />} />
        <Route path="/check-in" element={<CheckInPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/auth" element={<AuthPage />} />
        {/* Partner landing is public; the dashboard requires sign-in. */}
        <Route path="/partner" element={<PartnerLandingPage />} />
        <Route
          path="/partner/dashboard"
          element={
            <ProtectedRoute>
              <Suspense fallback={<Skeleton className="mt-6 h-[60vh] w-full rounded-xl" />}>
                <VenueDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Phase 3 — WorkPass + slot bookings (all require sign-in) */}
        <Route
          path="/workpass"
          element={
            <ProtectedRoute>
              <WorkPassPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/book/:spotId"
          element={
            <ProtectedRoute>
              <BookingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking/:bookingId/confirm"
          element={
            <ProtectedRoute>
              <BookingConfirmPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
