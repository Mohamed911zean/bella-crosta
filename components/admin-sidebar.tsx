'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/lib/auth'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  CreditCard,
  Users,
  LogOut,
  X,
} from 'lucide-react'
import { useTransition } from 'react'

interface AdminSidebarProps {
  mobile?: boolean
  onClose?: () => void
}

export function AdminSidebar({ mobile = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      await signOut()
    })
  }

  const navItems = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/orders',    icon: ShoppingCart,    label: 'Orders'    },
    { href: '/admin/payments',  icon: CreditCard,      label: 'Payments'  },
    { href: '/admin/inventory', icon: Package,         label: 'Inventory' },
    { href: '/admin/customers', icon: Users,           label: 'Customers' },
  ]

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-sm font-bold text-primary-foreground">
            🍕
          </div>
          <span className="font-bold text-sidebar-foreground text-sm">Bella Crosta</span>
        </Link>
        {mobile && (
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-sidebar-accent rounded-lg transition text-sidebar-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Label */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Admin Panel
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          disabled={isPending}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition disabled:opacity-50"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {isPending ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  )

  if (mobile) {
    return (
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="absolute left-0 top-0 h-full w-64"
          onClick={e => e.stopPropagation()}
        >
          {sidebarContent}
        </div>
      </div>
    )
  }

  return <div className="w-full h-full">{sidebarContent}</div>
}