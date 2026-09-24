'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import { Shield, Lock, AlertCircle, Loader2 } from 'lucide-react'

export default function LoginForm() {
  const [state, action, isPending] = useActionState(login, undefined)

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      {/* Background subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Glow accent */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-violet-500/20 via-transparent to-cyan-500/10 blur-xl" />

        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/60">
          {/* Top accent stripe */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

          <div className="px-8 pb-8 pt-10">
            {/* Header */}
            <div className="mb-8 flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-violet-600/20 ring-1 ring-violet-500/30">
                <Shield className="h-7 w-7 text-violet-400" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-zinc-50">
                  Extreme Team Vault
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
                  Enter the team password to continue
                </p>
              </div>
            </div>

            {/* Form */}
            <form action={action} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium tracking-wide text-zinc-400 uppercase"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••••"
                    className="w-full rounded-lg border border-white/10 bg-zinc-800 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none ring-offset-zinc-900 transition focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:ring-offset-2 disabled:opacity-50"
                    disabled={isPending}
                    required
                  />
                </div>
              </div>

              {/* Error message */}
              {state && 'error' in state && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-3">
                  <AlertCircle className="mt-px h-4 w-4 shrink-0 text-red-400" />
                  <p className="text-sm text-red-300">{state.error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="relative mt-1 flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-900/40 transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:opacity-60 disabled:cursor-not-allowed"
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
