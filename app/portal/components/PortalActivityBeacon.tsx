'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { readMemberActivityHint } from '@/lib/client/memberActivityHint'

const PRESENCE_URL = '/api/portal/presence'
const INTERVAL_MS = 45_000

export default function PortalActivityBeacon() {
  const pathname = usePathname()

  useEffect(() => {
    let cancelled = false

    function ping() {
      if (cancelled) return
      const hint = readMemberActivityHint()
      const activity =
        hint ??
        (pathname.startsWith('/portal')
          ? { kind: 'browsing' as const, detail: 'In the portal' }
          : { kind: 'idle' as const })
      void fetch(PRESENCE_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        keepalive: true,
        body: JSON.stringify({ path: pathname, activity }),
      }).catch(() => undefined)
    }

    ping()
    const interval = window.setInterval(ping, INTERVAL_MS)
    const onHide = () => {
      if (document.visibilityState === 'hidden') ping()
    }
    document.addEventListener('visibilitychange', onHide)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [pathname])

  return null
}