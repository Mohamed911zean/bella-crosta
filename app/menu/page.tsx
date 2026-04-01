'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { ProductCard } from '@/components/product-card'
import {  getProductsByCategory, getProducts } from '@/lib/db'

export default function MenuPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
       

        // Get products based on selected category
        let prods: any[] = []
        if (selectedCategory) {
          prods = await getProductsByCategory(selectedCategory)
        } else {
          prods = await getProducts()
        }

        // Filter by search query
        if (searchQuery) {
          prods = prods.filter(
            (p) =>
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.description.toLowerCase().includes(searchQuery.toLowerCase())
          )
        }

        setProducts(prods)
      } catch (error) {
        console.error('Error loading menu:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedCategory, searchQuery])

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8">Menu</h1>

        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search pizzas, appetizers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Categories</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full font-medium transition ${
                  selectedCategory === null
                    ? 'bg-primary text-white'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full font-medium transition ${
                    selectedCategory === category.id
                      ? 'bg-primary text-white'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading menu...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
