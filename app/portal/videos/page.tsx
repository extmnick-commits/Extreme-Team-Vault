import type { Metadata } from 'next'
import { Video } from 'lucide-react'
import { videos } from '@/lib/mediaData'
import PageHeader from '../components/PageHeader'
import SectionPlaceholder from '../components/SectionPlaceholder'
import VideoGallery from '../components/VideoGallery'

export const metadata: Metadata = {
  title: 'Training Videos | Extreme Team Vault',
}

const TITLE = 'Training Videos'
const DESCRIPTION = 'On-demand video trainings for the team.'

export default function VideosPage() {
  const trainingVideos = videos.filter((video) => video.category === 'training')

  if (trainingVideos.length === 0) {
    return (
      <SectionPlaceholder icon={Video} title={TITLE} description={DESCRIPTION} />
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader icon={Video} title={TITLE} description={DESCRIPTION} />
      <VideoGallery videos={trainingVideos} />
    </div>
  )
}
