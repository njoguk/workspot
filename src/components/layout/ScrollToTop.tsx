import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Resets scroll position to the top on every route change. React Router v6
 * preserves scroll by default, which left detail pages opening mid-page.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  return null
}
