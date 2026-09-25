'use client'

import { useState, useTransition } from 'react'
import { AlertCircle } from 'lucide-react'
import type { ActionResult } from '@/lib/libraryTypes'

export const inputClass =
  'w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm text-ink placeholder-zinc-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:opacity-50'

export const selectClass =
  'rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm text-ink outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:opacity-50'

export const iconButtonClass =
  'rounded-md p-1.5 text-ink-subtle transition hover:bg-zinc-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30'

export const primaryButtonClass =
  'inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-60'

export const dangerButtonClass =
  'inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60'

export const ghostButtonClass = 'rounded-md px-2 py-1 text-xs text-ink-muted hover:bg-zinc-100'

export function useAction() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function run(action: () => Promise<ActionResult>, onSuccess?: () => void, onError?: () => void) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result.ok) {
        onSuccess?.()
      } else {
        setError(result.error)
        onError?.()
      }
    })
  }

  return { pending, error, setError, run }
}

export function ErrorText({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <p className="flex items-center gap-1.5 text-xs text-red-600">
      <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
      {error}
    </p>
  )
}
