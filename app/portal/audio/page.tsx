import type { Metadata } from 'next'
import { Headphones, Play } from 'lucide-react'
import { getLibrary } from '@/lib/bunnyStorage'
import LibrarySections, { countLibraryFiles } from '../components/LibrarySections'
import PageHeader from '../components/PageHeader'
import SectionPlaceholder from '../components/SectionPlaceholder'

export const metadata: Metadata = {
  title: 'Audio Trainings | Extreme Team Vault',
}

const TITLE = 'Audio Trainings'
const DESCRIPTION = 'Listen to trainings on the go.'

export default async function AudioPage() {
  const audioFiles = await getLibrary('audio')

  if (countLibraryFiles(audioFiles) === 0) {
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
      <LibrarySections
        view={audioFiles}
        icon={Headphones}
        toRow={(track) => ({
          id: track.id,
          title: track.title,
          description: track.description,
          badge: `${track.fileType} · ${track.fileSize}`,
          href: track.cdnUrl,
          actionLabel: 'Stream Audio',
          actionIcon: Play,
        })}
      />
    </div>
  )
}
