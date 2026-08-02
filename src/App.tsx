import { Routes, Route } from 'react-router-dom'
import { RootLayout } from '@/components/layout/RootLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import ExplorePage from '@/pages/ExplorePage'
import SpotDetailPage from '@/pages/SpotDetailPage'
import CheckInPage from '@/pages/CheckInPage'
import CommunityPage from '@/pages/CommunityPage'
import EventsPage from '@/pages/EventsPage'
import ProfilePage from '@/pages/ProfilePage'
import AuthPage from '@/pages/AuthPage'
import PartnerPage from '@/pages/PartnerPage'
import VenueDashboard from '@/pages/VenueDashboard'
import OnboardingPage from '@/pages/OnboardingPage'
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
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/partner"
          element={
            <ProtectedRoute>
              <PartnerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner/dashboard"
          element={
            <ProtectedRoute>
              <VenueDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
