'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import { Lock, AlertCircle, Loader2 } from 'lucide-react'
import PulidoLogo from '@/app/ui/PulidoLogo'

export default function LoginForm() {
  const [state, action, isPending] = useActionState(login, undefined)

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      {/* Background subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(24,24,27,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(24,24,27,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Glow accent */}
        <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-violet-400/25 via-transparent to-sky-400/20 blur-2xl" />

        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface shadow-xl shadow-zinc-900/10">
          {/* Top accent stripe */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

          <div className="px-6 pb-8 pt-10 sm:px-8">
            {/* Header */}
            <div className="mb-8 flex flex-col items-center gap-3 text-center">
              <PulidoLogo size={128} className="object-contain" priority />
              <h1 className="text-xl font-semibold tracking-tight text-ink">
                Extreme Team Vault
              </h1>
              <p className="text-sm text-ink-muted">
                Enter the team password to continue
              </p>
            </div>

            {/* Form */}
            <form action={action} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium tracking-wide text-ink-muted uppercase"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••••"
                    className="h-11 w-full rounded-lg border border-line bg-surface pl-10 pr-4 text-base text-ink placeholder-zinc-400 outline-none transition focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-100 disabled:opacity-50 sm:text-sm"
                    disabled={isPending}
                    required
                  />
                </div>
              </div>

              {/* Error message */}
              {state && 'error' in state && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3">
                  <AlertCircle className="mt-px h-4 w-4 shrink-0 text-red-500" />
                  <p className="text-sm text-red-700">{state.error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="relative mt-1 flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-violet-600 text-sm font-semibold text-white shadow-md shadow-violet-600/30 transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
