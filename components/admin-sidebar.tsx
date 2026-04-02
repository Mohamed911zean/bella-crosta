'use client'

/**
 * AdminSidebar
 *
 * Logout strategy:
 *   Calling the signOut() Server Action directly from a Client Component and
 *   catching the NEXT_REDIRECT throw is fragile in Next.js 15+.
 *
 *   Instead we POST to /api/auth/logout (a Route Handler — always a valid
 *   context for cookie deletion). On success the client navigates to '/'
 *   via router.push(). This is the recommended pattern for client-initiated
 *   logout in the App Router.
 */

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, ShoppingCart, CreditCard,
  Package, Users, LogOut, X, Scale, Star,
} from 'lucide-react'

interface AdminSidebarProps {
  mobile?: boolean
  onClose?: () => void
}

export function AdminSidebar({ mobile = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  const handleLogout = async () => {
    if (signingOut) return
    setSigningOut(true)
    try {
      // POST to Route Handler — valid Server Action context for cookie deletion.
      // The handler invalidates the Supabase JWT and deletes bc_session cookie.
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      // Network error — still navigate away; middleware will block re-entry.
      console.error('[AdminSidebar] logout fetch error (non-fatal):', e)
    } finally {
      // Client-side navigation after cookie is cleared server-side.
      router.push('/')
      router.refresh() // Re-fetch server components so they see the cleared cookie.
    }
  }

  const nav = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard'    },
    { href: '/admin/orders',    icon: ShoppingCart,    label: 'Orders'       },
    { href: '/admin/payments',  icon: CreditCard,      label: 'Payments'     },
    { href: '/admin/products',  icon: Package,         label: 'Products'     },
    { href: '/admin/inventory', icon: Scale,           label: 'Raw Materials'},
    { href: '/admin/best-sellers', icon: Star,         label: 'Best Sellers' },
    { href: '/admin/customers', icon: Users,           label: 'Customers'    },
  ]

  const content = (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-sm">
            🍕
          </div>
          <span className="font-bold text-sidebar-foreground text-sm">Bella Crosta</span>
        </Link>
        {mobile && (
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-sidebar-accent rounded-lg transition text-sidebar-foreground"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Section label */}
      <div className="px-4 pt-5 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Admin Panel
        </p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-0.5" aria-label="Admin navigation">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.97] ${
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out button */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          disabled={signingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Sign out"
        >
          <LogOut className={`w-4 h-4 shrink-0 ${signingOut ? 'animate-spin opacity-60' : ''}`} />
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  )

  if (mobile) {
    return (
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
        aria-label="Admin menu"
      >
        <div
          className="absolute left-0 top-0 h-full w-64"
          onClick={e => e.stopPropagation()}
        >
          {content}
        </div>
      </div>
    )
  }

  return <div className="w-full h-full">{content}</div>
}