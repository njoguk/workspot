import { Link } from 'react-router-dom'
import { PlaceholderPage } from '@/components/PlaceholderPage'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center">
      <PlaceholderPage title="Not Found" subtitle="This page doesn't exist." />
      <Link
        to="/"
        className="inline-flex h-9 items-center justify-center rounded-pill bg-primary px-5 font-sans text-sm font-semibold text-inverse transition-colors duration-fast hover:opacity-90"
      >
        Back to Explore
      </Link>
    </div>
  )
}
