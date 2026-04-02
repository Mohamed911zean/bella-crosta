'use client'

import { useEffect, useState, useTransition } from 'react'
import { AdminSidebar } from '@/components/admin-sidebar'
import { getAllProducts } from '@/lib/db'
import { deleteProduct } from '@/lib/actions'
import type { Product } from '@/lib/db'
import { Menu, Plus, Search, Filter, Edit, Trash2, Package, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [mobile, setMobile] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setFilter] = useState('all')
  const [isPending, startTransition] = useTransition()

  const load = () => getAllProducts().then(d => { setProducts(d); setLoading(false) })
  useEffect(() => { load() }, [])

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to disable this product?')) return
    startTransition(async () => {
      await deleteProduct(id)
      load()
    })
  }

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))]

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                         p.description?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:block w-64 shrink-0"><AdminSidebar /></div>
      {mobile && <AdminSidebar mobile onClose={() => setMobile(false)} />}

      <div className="flex-1 overflow-auto">
        <div className="bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Package className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Menu Products</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/products/add" className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition shadow-sm">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Product</span>
            </Link>
            <button onClick={() => setMobile(true)} className="md:hidden p-2 hover:bg-muted rounded-lg"><Menu className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={categoryFilter}
                onChange={e => setFilter(e.target.value)}
                className="bg-card border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 capitalize"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading products...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">
                No products found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Product</th>
                      <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Category</th>
                      <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Price</th>
                      <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} className="border-b border-border hover:bg-muted/30 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-muted" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-foreground">{p.name}</p>
                              {p.is_featured && <span className="text-[10px] font-bold text-primary uppercase">Featured</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="capitalize text-muted-foreground font-medium">{p.category}</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-foreground">
                          ${Number(p.price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          {p.is_available ? (
                            <span className="inline-flex items-center gap-1 text-green-500 font-bold text-[10px] uppercase">
                              <Eye className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-muted-foreground font-bold text-[10px] uppercase">
                              <EyeOff className="w-3 h-3" /> Disabled
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/products/edit/${p.id}`} className="p-2 hover:bg-primary/10 rounded-lg text-primary transition" title="Edit">
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button 
                              onClick={() => handleDelete(p.id)}
                              disabled={isPending}
                              className="p-2 hover:bg-destructive/10 rounded-lg text-destructive transition disabled:opacity-50" 
                              title="Disable"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
