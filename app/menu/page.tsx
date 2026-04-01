'use client'

import { useState, useEffect, useMemo } from 'react'
import { Header } from '@/components/header'
import { ProductCard } from '@/components/product-card'
import { getProducts } from '@/lib/db'
import type { Product } from '@/lib/db'

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    getProducts().then(data => {
      setProducts(data)
      setLoading(false)
    })
  }, [])

  // Build unique categories from product data — no separate categories table needed
  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map(p => p.category)))
    return unique.sort()
  }, [products])

  const shown = useMemo(() => {
    let list = products
    if (selectedCategory !== 'all') {
      list = list.filter(p => p.category === selectedCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      )
    }
    return list
  }, [products, selectedCategory, search])

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page title */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-primary mb-2 font-semibold">Our Menu</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
            Order Online
          </h1>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <input
            type="text"
            placeholder="Search pizzas, appetizers…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:max-w-md px-4 py-2.5 pl-10 border border-border rounded-xl bg-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Category filter — only shows once products are loaded */}
        {!loading && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${
                selectedCategory === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Products grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className="h-80 bg-card border border-border rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-4xl mb-4">🍕</p>
            <p className="text-muted-foreground">No items found.</p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-3 text-primary text-sm hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shown.map(product => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}