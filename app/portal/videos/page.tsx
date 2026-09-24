import type { Metadata } from 'next'
import { Video } from 'lucide-react'
import SectionPlaceholder from '../components/SectionPlaceholder'

export const metadata: Metadata = {
  title: 'Training Videos | Extreme Team Vault',
}

export default function VideosPage() {
  return (
    <SectionPlaceholder
      icon={Video}
      title="Training Videos"
      description="On-demand video trainings for the team."
    />
  )
}
