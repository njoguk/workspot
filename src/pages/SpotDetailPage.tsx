import { useParams } from 'react-router-dom'
import { PlaceholderPage } from '@/components/PlaceholderPage'

export default function SpotDetailPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <PlaceholderPage
      title="Spot Detail"
      subtitle={id ? `Spot #${id}` : undefined}
    />
  )
}
