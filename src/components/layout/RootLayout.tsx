import { Outlet } from 'react-router-dom'
import { TopNav } from '@/components/layout/TopNav'
import { BottomTabs } from '@/components/layout/BottomTabs'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ScrollToTop } from '@/components/layout/ScrollToTop'

/**
 * App shell shared by every route: fixed TopNav, a PageWrapper-padded
 * content area (rendered via <Outlet />), and the mobile BottomTabs.
 */
export function RootLayout() {
  return (
    <div className="min-h-screen overflow-x-clip bg-bg text-text">
      <ScrollToTop />
      <TopNav />
      <PageWrapper>
        <Outlet />
      </PageWrapper>
      <BottomTabs />
    </div>
  )
}
