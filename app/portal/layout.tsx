import { isAdmin } from '@/app/lib/session'
import PortalSidebar from './components/PortalSidebar'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await isAdmin()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <PortalSidebar isAdmin={admin}>
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      </PortalSidebar>
    </div>
  )
}
