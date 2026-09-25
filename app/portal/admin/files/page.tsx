import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertCircle, FolderCog } from 'lucide-react'
import { isAdmin } from '@/app/lib/session'
import { getBlobAccess } from '@/lib/blobAccess'
import { getAdminVideos } from '@/lib/bunnyStream'
import { getLibrary } from '@/lib/bunnyStorage'
import { LIBRARIES, LIBRARY_LABELS, groupOptions, isLibrary } from '@/lib/libraryTypes'
import PageHeader from '../../components/PageHeader'
import FileManager from './FileManager'
import UploadPanel from './UploadPanel'
import VideoManager from './VideoManager'
import VideoUploadPanel from './VideoUploadPanel'

export const metadata: Metadata = {
  title: 'Manage Files | Extreme Team Vault',
}

// Large audio files are streamed from Vercel Blob to Bunny inside a server action.
export const maxDuration = 300

const VIDEO_TAB = 'videos'

const tabClass = (active: boolean) =>
  `-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
    active
      ? 'border-violet-600 text-violet-700'
      : 'border-transparent text-ink-muted hover:text-ink'
  }`

export default async function AdminFilesPage({
  searchParams,
}: {
  searchParams: Promise<{ library?: string }>
}) {
  if (!(await isAdmin())) redirect('/portal')

  const { library: requested } = await searchParams
  const isVideos = requested === VIDEO_TAB
  const library = isLibrary(requested) ? requested : 'documents'

  const videosView = isVideos ? await getAdminVideos({ fresh: true }) : null
  const filesView = isVideos ? null : await getLibrary(library, { fresh: true })
  const blobAccess = isVideos ? null : getBlobAccess()

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        icon={FolderCog}
        title="Manage Files"
        description="Upload documents, audio, and videos, organize them into categories, and edit or replace files."
      />

      <nav className="flex gap-2 overflow-x-auto border-b border-line" aria-label="Library">
        {LIBRARIES.map((lib) => {
          const active = !isVideos && lib === library
          return (
            <Link
              key={lib}
              href={`/portal/admin/files?library=${lib}`}
              aria-current={active ? 'page' : undefined}
              className={tabClass(active)}
            >
              {LIBRARY_LABELS[lib]}
            </Link>
          )
        })}
        <Link
          href={`/portal/admin/files?library=${VIDEO_TAB}`}
          aria-current={isVideos ? 'page' : undefined}
          className={tabClass(isVideos)}
        >
          Videos
        </Link>
      </nav>

      {isVideos && videosView ? (
        <>
          {videosView.error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" aria-hidden="true" />
              <p className="text-sm text-red-700">
                Could not load videos from Bunny Stream: {videosView.error}
              </p>
            </div>
          )}
          <VideoUploadPanel />
          <VideoManager view={videosView} />
        </>
      ) : (
        filesView &&
        blobAccess && (
          <>
            {filesView.error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" aria-hidden="true" />
                <p className="text-sm text-red-700">
                  Could not load files from Bunny Storage: {filesView.error}
                </p>
              </div>
            )}
            <UploadPanel
              key={`upload-${library}`}
              library={library}
              sections={groupOptions(filesView)}
              blobAccess={blobAccess}
            />
            <FileManager
              key={`manager-${library}`}
              library={library}
              view={filesView}
              blobAccess={blobAccess}
            />
          </>
        )
      )}
    </div>
  )
}
