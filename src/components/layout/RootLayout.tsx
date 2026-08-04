import { Outlet } from 'react-router-dom'
import { TopNav } from '@/components/layout/TopNav'
import { BottomTabs } from '@/components/layout/BottomTabs'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { CheckInDock, useCheckinDockState } from '@/components/checkin/CheckInDock'

/**
 * App shell shared by every route: fixed TopNav, a PageWrapper-padded
 * content area (rendered via <Outlet />), the mobile BottomTabs, and the
 * global floating check-in dock. When the dock is visible the content area
 * reserves extra bottom padding so nothing hides behind it.
 */
export function RootLayout() {
  const { visible: dockVisible } = useCheckinDockState()
  return (
    <div className="min-h-screen overflow-x-clip bg-bg text-text">
      <ScrollToTop />
      <TopNav />
      <PageWrapper className={dockVisible ? 'pb-[140px] md:pb-24' : undefined}>
        <Outlet />
      </PageWrapper>
      <BottomTabs />
      <CheckInDock />
    </div>
  )
}
