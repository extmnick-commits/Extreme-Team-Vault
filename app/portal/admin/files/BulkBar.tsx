'use client'

import { useState } from 'react'
import { Loader2, Trash2, X } from 'lucide-react'
import type { GroupOption, Library } from '@/lib/libraryTypes'
import { bulkDeleteFiles, bulkMoveFiles } from './actions'
import { ErrorText, dangerButtonClass, ghostButtonClass, iconButtonClass, selectClass, useAction } from './ui'

export default function BulkBar({
  library,
  names,
  groups,
  onClear,
}: {
  library: Library
  names: string[]
  groups: GroupOption[]
  onClear: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { pending, error, run } = useAction()

  if (names.length === 0) return null

  const count = `${names.length} ${names.length === 1 ? 'file' : 'files'}`

  return (
    <div className="sticky bottom-4 z-30 flex flex-col gap-2 rounded-xl border border-violet-200 bg-surface/95 p-3 shadow-xl shadow-zinc-900/10 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-ink">{count} selected</span>
        <select
          value=""
          onChange={(e) => {
            const value = e.target.value
            if (!value) return
            run(() => bulkMoveFiles(library, names, value === 'other' ? null : value), onClear)
          }}
          disabled={pending}
          aria-label="Move selected files to"
          className={selectClass}
        >
          <option value="">Move to…</option>
          <option value="other">Other</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>

        {confirmDelete ? (
          <span className="flex items-center gap-1 text-xs text-ink-muted">
            Permanently delete {count}?
            <button
              type="button"
              onClick={() =>
                run(
                  () => bulkDeleteFiles(library, names),
                  () => {
                    setConfirmDelete(false)
                    onClear()
                  },
                )
              }
              disabled={pending}
              className={dangerButtonClass}
            >
              {pending && <Loader2 className="size-3 animate-spin" aria-hidden="true" />}
              Delete
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} className={ghostButtonClass}>
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Delete
          </button>
        )}

        {pending && <Loader2 className="size-4 animate-spin text-ink-subtle" aria-hidden="true" />}

        <button type="button" onClick={onClear} className={`${iconButtonClass} ml-auto`} aria-label="Clear selection">
          <X className="size-4" />
        </button>
      </div>
      <ErrorText error={error} />
    </div>
  )
}
