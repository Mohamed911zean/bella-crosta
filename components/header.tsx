'use client'

import Link from 'next/link'
import { useCart } from '@/lib/cart-context'
import { ShoppingCart, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const { totalItems } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-background border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
              BC
            </div>
            <span className="hidden sm:inline font-bold text-lg">Bella Crosta</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-foreground hover:text-primary transition">
              Home
            </Link>
            <Link href="/menu" className="text-foreground hover:text-primary transition">
              Menu
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/cart"
              className="relative p-2 text-foreground hover:bg-muted rounded-lg transition"
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-foreground hover:bg-muted rounded-lg transition"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 flex flex-col gap-2">
            <Link
              href="/"
              className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition"
            >
              Home
            </Link>
            <Link
              href="/menu"
              className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition"
            >
              Menu
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
