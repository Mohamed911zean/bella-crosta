'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/db'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  CreditCard,
  LogOut,
  X,
} from 'lucide-react'
import { useState } from 'react'

interface AdminSidebarProps {
  mobile?: boolean
  onClose?: () => void
}

export function AdminSidebar({ mobile = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  const handleLogout = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const navItems = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    { href: '/admin/payments', icon: CreditCard, label: 'Payments' },
    { href: '/admin/inventory', icon: Package, label: 'Inventory' },
  ]

  const containerClass = mobile ? 'fixed inset-0 z-40 bg-black/50' : ''
  const sidebarClass = mobile
    ? 'fixed left-0 top-0 h-screen w-64 bg-card border-r border-border shadow-lg overflow-y-auto'
    : 'bg-card border-r border-border'

  return (
    <div className={containerClass} onClick={onClose}>
      <div
        className={sidebarClass}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-sm font-bold">
              BC
            </div>
            <span className="font-bold">Bella Crosta</span>
          </Link>
          {mobile && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-muted rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <button
            onClick={handleLogout}
            disabled={signingOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition disabled:opacity-50"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}
