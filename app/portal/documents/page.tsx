import type { Metadata } from 'next'
import { Download, FileText } from 'lucide-react'
import { getLibrary } from '@/lib/bunnyStorage'
import { countGroupFiles, countLibraryFiles, type LibraryFile } from '@/lib/libraryTypes'
import DocumentAlbumCard from '../components/DocumentAlbumCard'
import MediaList, { type MediaListRow } from '../components/MediaList'
import PageHeader from '../components/PageHeader'
import SectionPlaceholder from '../components/SectionPlaceholder'

export const metadata: Metadata = {
  title: 'PDF Documents | Extreme Team Vault',
}

const TITLE = 'PDF Documents'
const DESCRIPTION = 'Guides, scripts, and reference documents to download.'

const toRow = (doc: LibraryFile): MediaListRow => ({
  id: doc.id,
  title: doc.title,
  description: doc.description,
  badge: `${doc.fileType} · ${doc.fileSize}`,
  href: doc.cdnUrl,
  actionLabel: `Download ${doc.fileType}`,
  actionIcon: Download,
  download: true,
})

export default async function DocumentsPage() {
  const documents = await getLibrary('documents')

  if (countLibraryFiles(documents) === 0) {
    return (
      <SectionPlaceholder
        icon={FileText}
        title={TITLE}
        description={DESCRIPTION}
      />
    )
  }

  const categories = documents.sections.filter((s) => countGroupFiles(s) > 0)

  return (
    <div className="flex flex-col gap-10">
      <PageHeader icon={FileText} title={TITLE} description={DESCRIPTION} />

      {categories.map((category) => {
        const albums = category.children.filter((c) => c.files.length > 0)
        return (
          <section key={category.id} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                {category.name}
              </h2>
              {category.description && (
                <p className="text-sm text-zinc-500">{category.description}</p>
              )}
            </div>

            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {category.files.length > 0 && (
                <li>
                  <DocumentAlbumCard
                    album={{ ...category, description: '' }}
                    label={albums.length > 0 ? 'More documents' : undefined}
                  />
                </li>
              )}
              {albums.map((album) => (
                <li key={album.id}>
                  <DocumentAlbumCard album={album} />
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      {documents.unsorted.length > 0 && (
        <section className="flex flex-col gap-4">
          {categories.length > 0 && (
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Other</h2>
          )}
          <MediaList icon={FileText} rows={documents.unsorted.map(toRow)} />
        </section>
      )}
    </div>
  )
}
