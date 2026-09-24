'use client'

import { useState, useTransition } from 'react'
import { AlertCircle } from 'lucide-react'
import type { ActionResult } from '@/lib/libraryTypes'

export const inputClass =
  'w-full rounded-md border border-white/10 bg-zinc-800 px-2.5 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50'

export const selectClass =
  'rounded-md border border-white/10 bg-zinc-800 px-2.5 py-1.5 text-sm text-zinc-100 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50'

export const iconButtonClass =
  'rounded-md p-1.5 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-30'

export const primaryButtonClass =
  'inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-60'

export const dangerButtonClass =
  'inline-flex items-center gap-1 rounded-md bg-red-600/80 px-2 py-1 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-60'

export const ghostButtonClass = 'rounded-md px-2 py-1 text-xs text-zinc-300 hover:bg-white/5'

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
    <p className="flex items-center gap-1.5 text-xs text-red-300">
      <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
      {error}
    </p>
  )
}
