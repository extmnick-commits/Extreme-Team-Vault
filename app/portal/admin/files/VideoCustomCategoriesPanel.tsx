'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, Plus, Tag, Trash2 } from 'lucide-react'
import {
  BUILTIN_VIDEO_CATEGORIES,
  VIDEO_CATEGORY_LABELS,
  type CustomVideoCategory,
} from '@/lib/videoTypes'
import { addCustomVideoCategory, removeCustomVideoCategory } from './videoActions'
import { ErrorText, dangerButtonClass, ghostButtonClass, inputClass, primaryButtonClass } from './ui'

export default function VideoCustomCategoriesPanel({
  customCategories,
}: {
  customCategories: CustomVideoCategory[]
}) {
  const router = useRouter()
  const [label, setLabel] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(undefined)
    const result = await addCustomVideoCategory(label)
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setLabel('')
    router.refresh()
  }

  async function handleRemove(id: string) {
    setPending(true)
    setError(undefined)
    const result = await removeCustomVideoCategory(id)
    setPending(false)
    setConfirmRemoveId(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="text-lg font-semibold text-ink">Video categories</h2>
        <p className="text-sm text-ink-muted">
          Built-in categories are always available. Custom categories appear on the Training Videos
          page under their own heading.
        </p>
      </div>

      <div className="rounded-lg border border-line bg-zinc-50 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Built-in</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {BUILTIN_VIDEO_CATEGORIES.map((id) => (
            <li
              key={id}
              className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-sm text-ink ring-1 ring-line"
            >
              <Tag className="size-3.5 text-violet-500" aria-hidden="true" />
              {VIDEO_CATEGORY_LABELS[id]}
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted">
          Custom category name
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            disabled={pending}
            placeholder="e.g. Leadership series"
            maxLength={80}
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          disabled={pending || !label.trim()}
          className={`${primaryButtonClass} shrink-0`}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Plus className="size-4" aria-hidden="true" />
          )}
          Add category
        </button>
      </form>

      {error && <ErrorText error={error} />}

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Custom</p>
        {customCategories.length === 0 ? (
          <p className="text-sm text-ink-subtle">No custom categories yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {customCategories.map((category) => (
              <li
                key={category.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-zinc-50 px-3 py-2"
              >
                <span className="text-sm font-medium text-ink">{category.label}</span>
                {confirmRemoveId === category.id ? (
                  <span className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleRemove(category.id)}
                      className={dangerButtonClass}
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setConfirmRemoveId(null)}
                      className={ghostButtonClass}
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setConfirmRemoveId(category.id)}
                    className={`${ghostButtonClass} text-red-600 hover:text-red-700`}
                    aria-label={`Remove ${category.label}`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
