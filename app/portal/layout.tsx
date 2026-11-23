import { getSession, isAdmin, sessionDisplayName } from '@/app/lib/session'
import PortalActivityBeacon from './components/PortalActivityBeacon'
import PortalSidebar from './components/PortalSidebar'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [admin, session] = await Promise.all([isAdmin(), getSession()])
  const memberName = sessionDisplayName(session)

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PortalActivityBeacon />
      <PortalSidebar isAdmin={admin} memberName={memberName}>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
      </PortalSidebar>
    </div>
  )
}
