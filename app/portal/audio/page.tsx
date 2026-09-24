import type { Metadata } from 'next'
import { Headphones, Play } from 'lucide-react'
import { audio } from '@/lib/mediaData'
import MediaList from '../components/MediaList'
import PageHeader from '../components/PageHeader'
import SectionPlaceholder from '../components/SectionPlaceholder'

export const metadata: Metadata = {
  title: 'Audio Trainings | Extreme Team Vault',
}

const TITLE = 'Audio Trainings'
const DESCRIPTION = 'Listen to trainings on the go.'

export default function AudioPage() {
  if (audio.length === 0) {
    return (
      <SectionPlaceholder
        icon={Headphones}
        title={TITLE}
        description={DESCRIPTION}
      />
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader icon={Headphones} title={TITLE} description={DESCRIPTION} />
      <MediaList
        icon={Headphones}
        rows={audio.map((track) => ({
          id: track.id,
          title: track.title,
          description: track.description,
          badge: track.duration,
          href: track.cdnUrl,
          actionLabel: 'Stream Audio',
          actionIcon: Play,
        }))}
      />
    </div>
  )
}
