import type { Metadata } from 'next'
import { Download, FileText } from 'lucide-react'
import { getLibrary } from '@/lib/bunnyStorage'
import { countLibraryFiles } from '@/lib/libraryTypes'
import LibrarySections from '../components/LibrarySections'
import PageHeader from '../components/PageHeader'
import SectionPlaceholder from '../components/SectionPlaceholder'

export const metadata: Metadata = {
  title: 'PDF Documents | Extreme Team Vault',
}

const TITLE = 'PDF Documents'
const DESCRIPTION = 'Guides, scripts, and reference documents to download.'

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

  return (
    <div className="flex flex-col gap-8">
      <PageHeader icon={FileText} title={TITLE} description={DESCRIPTION} />
      <LibrarySections
        view={documents}
        icon={FileText}
        toRow={(doc) => ({
          id: doc.id,
          title: doc.title,
          description: doc.description,
          badge: `${doc.fileType} · ${doc.fileSize}`,
          href: doc.cdnUrl,
          actionLabel: `Download ${doc.fileType}`,
          actionIcon: Download,
          download: true,
        })}
      />
    </div>
  )
}
