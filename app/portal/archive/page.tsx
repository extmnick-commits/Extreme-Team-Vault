import type { Metadata } from 'next'
import { Archive } from 'lucide-react'
import SectionPlaceholder from '../components/SectionPlaceholder'

export const metadata: Metadata = {
  title: 'Archived Streams | Extreme Team Vault',
}

export default function ArchivePage() {
  return (
    <SectionPlaceholder
      icon={Archive}
      title="Archived Streams"
      description="Replays of past live trainings and opportunity nights."
    />
  )
}
