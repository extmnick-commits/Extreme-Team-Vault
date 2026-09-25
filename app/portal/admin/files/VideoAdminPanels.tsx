'use client'

import { useState } from 'react'
import type { CustomVideoCategory } from '@/lib/videoTypes'
import VideoCustomCategoriesPanel from './VideoCustomCategoriesPanel'
import VideoUploadPanel from './VideoUploadPanel'

type VideoAdminTab = 'upload' | 'categories'

const tabButtonClass = (active: boolean) =>
  `-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
    active
      ? 'border-violet-600 text-violet-700'
      : 'border-transparent text-ink-muted hover:text-ink'
  }`

export default function VideoAdminPanels({
  customCategories,
}: {
  customCategories: CustomVideoCategory[]
}) {
  const [tab, setTab] = useState<VideoAdminTab>('upload')

  return (
    <div className="flex flex-col gap-4">
      <nav
        className="flex gap-1 border-b border-line"
        aria-label="Video admin sections"
      >
        <button
          type="button"
          onClick={() => setTab('upload')}
          aria-current={tab === 'upload' ? 'page' : undefined}
          className={tabButtonClass(tab === 'upload')}
        >
          Upload
        </button>
        <button
          type="button"
          onClick={() => setTab('categories')}
          aria-current={tab === 'categories' ? 'page' : undefined}
          className={tabButtonClass(tab === 'categories')}
        >
          Custom categories
        </button>
      </nav>

      {tab === 'upload' ? (
        <VideoUploadPanel customCategories={customCategories} />
      ) : (
        <VideoCustomCategoriesPanel customCategories={customCategories} />
      )}
    </div>
  )
}
