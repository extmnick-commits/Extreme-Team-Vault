'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import LogoutButton from '@/app/ui/LogoutButton'
import PulidoLogo from '@/app/ui/PulidoLogo'
import { ADMIN_NAV_ITEMS, NAV_ITEMS, type NavItem } from './navItems'

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/')
}

function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/portal/dashboard"
      className="flex min-w-0 items-center gap-2.5"
      title={collapsed ? 'Extreme Team Vault' : undefined}
    >
      <PulidoLogo
        size={collapsed ? 32 : 44}
        className="shrink-0 object-contain"
      />
      {!collapsed && (
        <span className="truncate text-sm font-semibold tracking-tight text-ink">
          Extreme Team Vault
        </span>
      )}
    </Link>
  )
}

function NavLinks({
  pathname,
  isAdmin,
  collapsed = false,
}: {
  pathname: string
  isAdmin: boolean
  collapsed?: boolean
}) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      <NavLinkList items={NAV_ITEMS} pathname={pathname} collapsed={collapsed} />
      {isAdmin && (
        <>
          <div className="my-3 border-t border-line" role="separator" />
          {!collapsed && (
            <span className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
              Admin
            </span>
          )}
          <NavLinkList
            items={ADMIN_NAV_ITEMS}
            pathname={pathname}
            collapsed={collapsed}
          />
        </>
      )}
    </nav>
  )
}

function NavLinkList({
  items,
  pathname,
  collapsed,
}: {
  items: NavItem[]
  pathname: string
  collapsed: boolean
}) {
  return (
    <>
      {items.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            title={collapsed ? label : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition ${
              collapsed ? 'justify-center px-2' : 'px-3'
            } ${
              active
                ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-100'
                : 'text-ink-muted hover:bg-zinc-100 hover:text-ink'
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </Link>
        )
      })}
    </>
  )
}

export default function PortalSidebar({
  children,
  isAdmin,
}: {
  children: React.ReactNode
  isAdmin: boolean
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [lastPathname, setLastPathname] = useState(pathname)

  if (pathname !== lastPathname) {
    setLastPathname(pathname)
    setMobileOpen(false)
  }

  useEffect(() => {
    if (!mobileOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-surface transition-[width] duration-200 md:flex ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div
          className={`flex border-b border-line px-2 ${
            collapsed
              ? 'flex-col items-center gap-1 py-3'
              : 'h-16 items-center justify-between gap-2 px-4'
          }`}
        >
          <Brand collapsed={collapsed} />
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="rounded-lg p-2 text-ink-subtle transition hover:bg-zinc-100 hover:text-ink"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto py-4">
          <NavLinks pathname={pathname} isAdmin={isAdmin} collapsed={collapsed} />
          <div className={`mt-auto px-3 pt-4 ${collapsed ? 'flex justify-center' : ''}`}>
            <LogoutButton compact={collapsed} />
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface/90 px-2 shadow-sm backdrop-blur-md md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          aria-controls="portal-mobile-drawer"
          className="flex size-11 items-center justify-center rounded-lg text-ink-muted transition hover:bg-zinc-100 hover:text-ink"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Brand />
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 bg-zinc-900/30 backdrop-blur-[2px] transition-opacity md:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      <aside
        id="portal-mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Portal navigation"
        inert={!mobileOpen}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-line bg-surface shadow-2xl shadow-zinc-900/20 transition-transform duration-200 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b border-line pr-2 pl-4">
          <Brand />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="flex size-11 items-center justify-center rounded-lg text-ink-muted transition hover:bg-zinc-100 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto py-4">
          <NavLinks pathname={pathname} isAdmin={isAdmin} />
          <div className="mt-auto px-3 pt-4 pb-[env(safe-area-inset-bottom)]">
            <LogoutButton />
          </div>
        </div>
      </aside>

      <div
        className={`transition-[padding] duration-200 ${
          collapsed ? 'md:pl-20' : 'md:pl-64'
        }`}
      >
        {children}
      </div>
    </>
  )
}
