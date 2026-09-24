import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertCircle, FolderCog } from 'lucide-react'
import { isAdmin } from '@/app/lib/session'
import { getBlobAccess } from '@/lib/blobAccess'
import { getLibrary } from '@/lib/bunnyStorage'
import { LIBRARIES, LIBRARY_LABELS, isLibrary } from '@/lib/libraryTypes'
import PageHeader from '../../components/PageHeader'
import FileManager from './FileManager'
import UploadPanel from './UploadPanel'

export const metadata: Metadata = {
  title: 'Manage Files | Extreme Team Vault',
}

// Large audio files are streamed from Vercel Blob to Bunny inside a server action.
export const maxDuration = 300

export default async function AdminFilesPage({
  searchParams,
}: {
  searchParams: Promise<{ library?: string }>
}) {
  if (!(await isAdmin())) redirect('/portal')

  const { library: requested } = await searchParams
  const library = isLibrary(requested) ? requested : 'documents'
  const view = await getLibrary(library, { fresh: true })
  const sectionOptions = view.sections.map(({ id, name }) => ({ id, name }))

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        icon={FolderCog}
        title="Manage Files"
        description="Upload, organize, rename, and remove documents and audio for the team."
      />

      <nav className="flex gap-2 border-b border-zinc-800" aria-label="Library">
        {LIBRARIES.map((lib) => {
          const active = lib === library
          return (
            <Link
              key={lib}
              href={`/portal/admin/files?library=${lib}`}
              aria-current={active ? 'page' : undefined}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                active
                  ? 'border-violet-500 text-violet-200'
                  : 'border-transparent text-zinc-400 hover:text-zinc-100'
              }`}
            >
              {LIBRARY_LABELS[lib]}
            </Link>
          )
        })}
      </nav>

      {view.error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-400" aria-hidden="true" />
          <p className="text-sm text-red-300">
            Could not load files from Bunny Storage: {view.error}
          </p>
        </div>
      )}

      <UploadPanel
        key={`upload-${library}`}
        library={library}
        sections={sectionOptions}
        blobAccess={getBlobAccess()}
      />

      <FileManager key={`manager-${library}`} library={library} view={view} />
    </div>
  )
}
