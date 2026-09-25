import type { Metadata } from 'next'
import { Archive } from 'lucide-react'
import { getVideos } from '@/lib/bunnyStream'
import PageHeader from '../components/PageHeader'
import SectionPlaceholder from '../components/SectionPlaceholder'
import VideoGallery from '../components/VideoGallery'

export const metadata: Metadata = {
  title: 'Archived Streams | Extreme Team Vault',
}

const TITLE = 'Archived Streams'
const DESCRIPTION = 'Replays of past live trainings and opportunity nights.'

export default async function ArchivePage() {
  const archivedVideos = await getVideos('archive')

  if (archivedVideos.length === 0) {
    return (
      <SectionPlaceholder
        icon={Archive}
        title={TITLE}
        description={DESCRIPTION}
      />
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader icon={Archive} title={TITLE} description={DESCRIPTION} />
      <VideoGallery videos={archivedVideos} />
    </div>
  )
}
