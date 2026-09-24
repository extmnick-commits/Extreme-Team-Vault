import PortalSidebar from './components/PortalSidebar'

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <PortalSidebar>
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      </PortalSidebar>
    </div>
  )
}
