'use client'

import { useEffect, useState, useTransition } from 'react'
import { AdminSidebar } from '@/components/admin-sidebar'
import { getAllProducts } from '@/lib/db'
import { updateProduct } from '@/lib/actions'
import type { Product } from '@/lib/db'
import { Menu, AlertCircle, Save, X } from 'lucide-react'

const LOW_STOCK_THRESHOLD = 10

export default function AdminInventoryPage() {
  const [user, setUser] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    async function checkAdmin() {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      if (!data.user || data.user.role !== 'admin') {
        window.location.href = '/'
        return
      }
      setUser(data.user)
      loadProducts()
    }
    checkAdmin()
  }, [])

  const loadProducts = () => {
    getAllProducts().then(data => {
      setProducts(data)
      setLoading(false)
    })
  }

  const startEdit = (product: Product) => {
    setEditingId(product.id)
    setEditQty(String(product.stock_qty))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditQty('')
  }

  const saveEdit = (productId: string) => {
    const qty = parseInt(editQty, 10)
    if (isNaN(qty) || qty < 0) return

    startTransition(async () => {
      await updateProduct(productId, { stock_qty: qty })
      cancelEdit()
      loadProducts()
    })
  }

  const lowStock  = products.filter(p => p.stock_qty <= LOW_STOCK_THRESHOLD)
  const inStock   = products.filter(p => p.stock_qty > LOW_STOCK_THRESHOLD)

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:block w-64 shrink-0">
        <AdminSidebar />
      </div>

      {mobileMenuOpen && (
        <AdminSidebar mobile onClose={() => setMobileMenuOpen(false)} />
      )}

      <div className="flex-1 overflow-auto">
        <div className="bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-bold text-foreground">Inventory</h1>
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 hover:bg-muted rounded-lg transition">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Products</p>
              <p className="text-2xl font-bold text-foreground">{products.length}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">In Stock</p>
              <p className="text-2xl font-bold text-green-400">{inStock.length}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-400">{lowStock.length}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No products found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {['Product', 'Category', 'Stock Qty', 'Status', 'Action'].map(h => (
                        <th key={h} className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => {
                      const isLow     = product.stock_qty <= LOW_STOCK_THRESHOLD
                      const isEditing = editingId === product.id
                      return (
                        <tr key={product.id} className="border-b border-border hover:bg-muted/30 transition">
                          <td className="px-4 sm:px-6 py-3 font-medium text-foreground">{product.name}</td>
                          <td className="px-4 sm:px-6 py-3 text-muted-foreground capitalize">{product.category}</td>
                          <td className="px-4 sm:px-6 py-3">
                            {isEditing ? (
                              <input
                                type="number"
                                min="0"
                                value={editQty}
                                onChange={e => setEditQty(e.target.value)}
                                className="w-20 px-2 py-1 border border-border rounded-lg bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              />
                            ) : (
                              <span className={`font-semibold ${isLow ? 'text-yellow-400' : 'text-green-400'}`}>
                                {product.stock_qty}
                              </span>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-yellow-500/15 text-yellow-400">
                                <AlertCircle className="w-3 h-3" />
                                Low Stock
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-md text-xs font-medium bg-green-500/15 text-green-400">
                                In Stock
                              </span>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => saveEdit(product.id)}
                                  disabled={isPending}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-accent transition disabled:opacity-50"
                                >
                                  <Save className="w-3 h-3" />
                                  Save
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs font-medium hover:bg-muted/80 transition"
                                >
                                  <X className="w-3 h-3" />
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEdit(product)}
                                className="text-primary hover:underline text-xs font-medium"
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}