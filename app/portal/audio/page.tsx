import type { Metadata } from 'next'
import Link from 'next/link'
import { Headphones, Play } from 'lucide-react'
import { getLibrary } from '@/lib/bunnyStorage'
import { countGroupFiles, countLibraryFiles, type LibraryFile } from '@/lib/libraryTypes'
import AlbumCard from '../components/AlbumCard'
import MediaList, { type MediaListRow } from '../components/MediaList'
import PageHeader from '../components/PageHeader'
import SectionPlaceholder from '../components/SectionPlaceholder'

export const metadata: Metadata = {
  title: 'Audio Trainings | Extreme Team Vault',
}

const TITLE = 'Audio Trainings'
const DESCRIPTION = 'Listen to trainings on the go.'

const toRow = (track: LibraryFile): MediaListRow => ({
  id: track.id,
  title: track.title,
  description: track.description,
  badge: `${track.fileType} · ${track.fileSize}`,
  href: track.cdnUrl,
  actionLabel: 'Stream Audio',
  actionIcon: Play,
})

function PlayAllLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-violet-600 px-4 text-xs font-semibold text-white shadow-sm shadow-violet-600/30 transition hover:bg-violet-700"
    >
      <Play className="size-3.5 fill-current" aria-hidden="true" />
      Play all
    </Link>
  )
}

export default async function AudioPage() {
  const audio = await getLibrary('audio')

  if (countLibraryFiles(audio) === 0) {
    return (
      <SectionPlaceholder
        icon={Headphones}
        title={TITLE}
        description={DESCRIPTION}
      />
    )
  }

  const categories = audio.sections.filter((s) => countGroupFiles(s) > 0)

  return (
    <div className="flex flex-col gap-10">
      <PageHeader icon={Headphones} title={TITLE} description={DESCRIPTION} />

      {categories.map((category) => {
        const albums = category.children.filter((c) => c.files.length > 0)
        return (
          <section key={category.id} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 border-b border-line pb-3">
              <h2 className="text-base font-semibold text-ink sm:text-lg">{category.name}</h2>
              {category.description && (
                <p className="text-sm text-ink-muted">{category.description}</p>
              )}
            </div>

            {albums.length > 0 && (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                {albums.map((album) => (
                  <li key={album.id}>
                    <AlbumCard album={album} />
                  </li>
                ))}
              </ul>
            )}

            {category.files.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  {albums.length > 0 && (
                    <h3 className="text-sm font-semibold text-ink-muted">More tracks</h3>
                  )}
                  <div className="ml-auto">
                    <PlayAllLink href={`/portal/audio/${category.id}`} />
                  </div>
                </div>
                <MediaList icon={Headphones} rows={category.files.map(toRow)} />
              </div>
            )}
          </section>
        )
      })}

      {audio.unsorted.length > 0 && (
        <section className="flex flex-col gap-4">
          {categories.length > 0 && (
            <h2 className="border-b border-line pb-3 text-base font-semibold text-ink sm:text-lg">
              Other
            </h2>
          )}
          <MediaList icon={Headphones} rows={audio.unsorted.map(toRow)} />
        </section>
      )}
    </div>
  )
}
