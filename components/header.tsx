'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useCart } from '@/lib/cart-context'
import { ShoppingCart, Menu, X, User, ChevronDown } from 'lucide-react'

interface SessionUser {
  id: string
  email: string
  role: string
}

export function Header() {
  const { totalItems } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [user, setUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    async function fetchSession() {
      const response = await fetch('/api/auth/session')
      if (!response.ok) return
      const data = await response.json()
      setUser(data.user)
    }

    fetchSession()
  }, [])

  const initials = user?.email
    ? user.email
        .split('@')[0]
        .split(/[-_.]/)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'BC'

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-2xl shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-accent text-white shadow-lg shadow-primary/20">
            <span className="text-lg font-black">🍕</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-primary/90">Bella Crosta</p>
            <p className="text-lg font-semibold text-foreground">Handcrafted Pizza Kitchen</p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-foreground/90">
          <Link href="/" className="transition hover:text-primary">Home</Link>
          <Link href="/menu" className="transition hover:text-primary">Menu</Link>
          <Link href="/#featured" className="transition hover:text-primary">Featured</Link>
          <Link href="/auth/profile" className="transition hover:text-primary">Profile</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-foreground transition hover:border-primary hover:text-primary"
          >
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((open) => !open)}
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold">
                  {initials}
                </span>
                <span className="hidden sm:inline">My account</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 top-14 z-20 w-56 overflow-hidden rounded-3xl border border-border bg-background shadow-xl shadow-black/10">
                  <div className="px-4 py-3 border-b border-border text-sm text-muted-foreground">
                    Signed in as
                    <div className="mt-1 font-semibold text-foreground break-all">{user.email}</div>
                  </div>
                  <div className="grid gap-1 p-3">
                    <Link
                      href="/auth/profile"
                      className="rounded-2xl px-3 py-2 text-sm text-foreground transition hover:bg-muted"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/auth/logout"
                      className="rounded-2xl px-3 py-2 text-sm text-foreground transition hover:bg-muted"
                    >
                      Logout
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 text-sm text-foreground transition hover:border-primary hover:text-primary"
              >
                <User className="w-4 h-4" />
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent"
              >
                Sign up
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-foreground transition hover:border-primary lg:hidden"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border bg-card/85 px-4 py-4 backdrop-blur-2xl lg:hidden">
          <nav className="grid gap-2">
            <Link href="/" className="rounded-2xl px-4 py-3 text-sm text-foreground transition hover:bg-muted">
              Home
            </Link>
            <Link href="/menu" className="rounded-2xl px-4 py-3 text-sm text-foreground transition hover:bg-muted">
              Menu
            </Link>
            <Link href="/#featured" className="rounded-2xl px-4 py-3 text-sm text-foreground transition hover:bg-muted">
              Featured
            </Link>
            <Link href="/auth/profile" className="rounded-2xl px-4 py-3 text-sm text-foreground transition hover:bg-muted">
              Profile
            </Link>
            {user ? (
              <Link href="/auth/logout" className="rounded-2xl px-4 py-3 text-sm text-foreground transition hover:bg-muted">
                Logout
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="rounded-2xl px-4 py-3 text-sm text-foreground transition hover:bg-muted">
                  Sign in
                </Link>
                <Link href="/auth/signup" className="rounded-2xl px-4 py-3 bg-primary text-sm font-semibold text-white transition hover:bg-accent">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
