'use client'

import { logout } from '@/app/actions/auth'
import { LogOut } from 'lucide-react'
import { useTransition } from 'react'

export default function LogoutButton({ compact = false }: { compact?: boolean }) {
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await logout()
    })
  }

  const label = isPending ? 'Logging out…' : 'Logout'

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      aria-label={compact ? label : undefined}
      title={compact ? label : undefined}
      className={`flex items-center gap-2 min-h-11 rounded-lg border border-line bg-surface text-sm font-medium text-ink-muted transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 ${
        compact ? 'justify-center p-2.5' : 'w-full px-4 py-2'
      }`}
    >
      <LogOut className="h-4 w-4" />
      {!compact && label}
    </button>
  )
}
