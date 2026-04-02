'use client'

import { useEffect, useState, useTransition } from 'react'
import { AdminSidebar } from '@/components/admin-sidebar'
import { getAllProducts } from '@/lib/db'
import { updateProduct } from '@/lib/actions'
import type { Product } from '@/lib/db'
import { Menu, AlertCircle, Save, X } from 'lucide-react'

const LOW = 10

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading,  setLoading]  = useState(true)
  const [mobile,   setMobile]   = useState(false)
  const [editId,   setEditId]   = useState<string | null>(null)
  const [editQty,  setEditQty]  = useState('')
  const [qtyError, setQtyError] = useState('')
  const [pending,  start]       = useTransition()

  const load = () => getAllProducts().then(d => { setProducts(d); setLoading(false) })
  useEffect(() => { load() }, [])

  const startEdit = (p: Product) => { setEditId(p.id); setEditQty(String(p.stock_qty)); setQtyError('') }
  const cancelEdit = () => { setEditId(null); setEditQty(''); setQtyError('') }

  // FIX 2: validate qty before saving — must be a finite non-negative integer
  const saveEdit = (productId: string) => {
    const qty = parseInt(editQty, 10)
    if (!Number.isFinite(qty) || qty < 0 || qty > 99999) {
      setQtyError('Enter a valid quantity (0–99999).')
      return
    }
    setQtyError('')
    start(async () => {
      await updateProduct(productId, { stock_qty: qty })
      cancelEdit()
      load()
    })
  }

  const low    = products.filter(p => p.stock_qty <= LOW)
  const inStock = products.filter(p => p.stock_qty > LOW)

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:block w-64 shrink-0"><AdminSidebar /></div>
      {mobile && <AdminSidebar mobile onClose={() => setMobile(false)} />}

      <div className="flex-1 overflow-auto">
        <div className="bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-bold text-foreground">Inventory</h1>
          <button onClick={() => setMobile(true)} className="md:hidden p-2 hover:bg-muted rounded-lg"><Menu className="w-5 h-5" /></button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Summary */}
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
              <p className="text-2xl font-bold text-yellow-400">{low.length}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
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
                    {products.map(p => {
                      const isLow = p.stock_qty <= LOW
                      const isEdit = editId === p.id
                      return (
                        <tr key={p.id} className="border-b border-border hover:bg-muted/30 transition">
                          <td className="px-4 sm:px-6 py-3 font-medium text-foreground">{p.name}</td>
                          <td className="px-4 sm:px-6 py-3 text-muted-foreground capitalize">{p.category}</td>
                          <td className="px-4 sm:px-6 py-3">
                            {isEdit ? (
                              <div>
                                <input type="number" min="0" max="99999" value={editQty}
                                  onChange={e => { setEditQty(e.target.value); setQtyError('') }}
                                  className={`w-24 px-2 py-1 border rounded-lg bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring ${qtyError ? 'border-destructive' : 'border-border'}`}
                                />
                                {qtyError && <p className="text-xs text-destructive mt-1">{qtyError}</p>}
                              </div>
                            ) : (
                              <span className={`font-semibold ${isLow ? 'text-yellow-400' : 'text-green-400'}`}>{p.stock_qty}</span>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            {isLow
                              ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-yellow-500/15 text-yellow-400"><AlertCircle className="w-3 h-3" />Low Stock</span>
                              : <span className="px-2 py-1 rounded-md text-xs font-medium bg-green-500/15 text-green-400">In Stock</span>
                            }
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            {isEdit ? (
                              <div className="flex items-center gap-2">
                                <button onClick={() => saveEdit(p.id)} disabled={pending}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-accent transition disabled:opacity-50">
                                  <Save className="w-3 h-3" />Save
                                </button>
                                <button onClick={cancelEdit}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs hover:bg-muted/80 transition">
                                  <X className="w-3 h-3" />Cancel
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => startEdit(p)} className="text-primary hover:underline text-xs font-medium">Edit</button>
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