'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, PanelLeftClose, PanelLeftOpen, Shield, X } from 'lucide-react'
import LogoutButton from '@/app/ui/LogoutButton'
import { NAV_ITEMS } from './navItems'

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/')
}

function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/portal/dashboard"
      className="flex min-w-0 items-center gap-3"
      title={collapsed ? 'Extreme Team Vault' : undefined}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-600/20 ring-1 ring-violet-500/30">
        <Shield className="h-5 w-5 text-violet-400" strokeWidth={1.5} />
      </span>
      {!collapsed && (
        <span className="truncate text-sm font-semibold tracking-tight text-zinc-100">
          Extreme Team Vault
        </span>
      )}
    </Link>
  )
}

function NavLinks({
  pathname,
  collapsed = false,
}: {
  pathname: string
  collapsed?: boolean
}) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            title={collapsed ? label : undefined}
            className={`flex items-center gap-3 rounded-lg border-l-2 py-2.5 text-sm font-medium transition ${
              collapsed ? 'justify-center px-2' : 'px-3'
            } ${
              active
                ? 'border-violet-500 bg-violet-500/10 text-violet-200'
                : 'border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}

export default function PortalSidebar({
  children,
}: {
  children: React.ReactNode
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
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-white/10 bg-zinc-900/80 backdrop-blur-sm transition-[width] duration-200 md:flex ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div
          className={`flex h-16 items-center border-b border-white/10 px-4 ${
            collapsed ? 'justify-center' : 'justify-between gap-2'
          }`}
        >
          {!collapsed && <Brand />}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto py-4">
          <NavLinks pathname={pathname} collapsed={collapsed} />
          <div className={`mt-auto px-3 pt-4 ${collapsed ? 'flex justify-center' : ''}`}>
            <LogoutButton compact={collapsed} />
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/10 bg-zinc-900/80 px-4 backdrop-blur-sm md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          aria-controls="portal-mobile-drawer"
          className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Brand />
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity md:hidden ${
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
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-white/10 bg-zinc-900 shadow-2xl shadow-black/60 transition-transform duration-200 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b border-white/10 px-4">
          <Brand />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/5 hover:text-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto py-4">
          <NavLinks pathname={pathname} />
          <div className="mt-auto px-3 pt-4">
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
