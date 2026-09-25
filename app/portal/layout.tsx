import { isAdmin } from '@/app/lib/session'
import PortalSidebar from './components/PortalSidebar'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await isAdmin()

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PortalSidebar isAdmin={admin}>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
      </PortalSidebar>
    </div>
  )
}
