import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageWrapperProps {
  children: ReactNode
  className?: string
}

/**
 * Consistent page container:
 *  - horizontal padding: 16px mobile → 40px tablet → 60px desktop
 *  - max-width 1440px, centered
 *  - top padding clears the 64px fixed TopNav
 *  - bottom padding clears the 68px mobile BottomTabs (hidden md+)
 */
export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <main
      className={cn(
        'mx-auto w-full max-w-content px-4 pt-16 pb-[68px] md:px-10 md:pb-10 lg:px-[60px]',
        className,
      )}
    >
      {children}
    </main>
  )
}
