import type { Metadata } from 'next'
import { Video } from 'lucide-react'
import { enrichTrainingVideoSections } from '@/lib/enrichVideosWithDocuments'
import { getTrainingLibraryVideoSections } from '@/lib/bunnyStream'
import PageHeader from '../components/PageHeader'
import SectionPlaceholder from '../components/SectionPlaceholder'
import TrainingVideoGallery from '../components/TrainingVideoGallery'

export const metadata: Metadata = {
  title: 'Training Videos | Extreme Team Vault',
}

const TITLE = 'Training Videos'
const DESCRIPTION = 'On-demand video trainings for the team.'

export default async function VideosPage() {
  const sections = await enrichTrainingVideoSections(await getTrainingLibraryVideoSections())
  const videoCount = sections.reduce((total, section) => total + section.videos.length, 0)

  if (videoCount === 0) {
    return (
      <SectionPlaceholder icon={Video} title={TITLE} description={DESCRIPTION} />
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader icon={Video} title={TITLE} description={DESCRIPTION} />
      <TrainingVideoGallery sections={sections} />
    </div>
  )
}
