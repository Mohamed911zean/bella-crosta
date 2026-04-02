'use client'

import { useEffect, useState, useTransition } from 'react'
import { AdminSidebar } from '@/components/admin-sidebar'
import { getAllRawMaterials } from '@/lib/db'
import { updateRawMaterial } from '@/lib/actions'
import type { RawMaterial } from '@/lib/db'
import { Menu, AlertCircle, Save, X, Scale } from 'lucide-react'

export default function AdminInventoryPage() {
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [mobile, setMobile] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState('')
  const [qtyError, setQtyError] = useState('')
  const [pending, start] = useTransition()

  const load = () => getAllRawMaterials().then(d => { setMaterials(d); setLoading(false) })
  useEffect(() => { load() }, [])

  const startEdit = (m: RawMaterial) => { setEditId(m.id); setEditQty(String(m.stock_qty)); setQtyError('') }
  const cancelEdit = () => { setEditId(null); setEditQty(''); setQtyError('') }

  const saveEdit = (materialId: string) => {
    const qty = parseFloat(editQty)
    if (!Number.isFinite(qty) || qty < 0 || qty > 99999) {
      setQtyError('Enter a valid quantity (0–99999).')
      return
    }
    setQtyError('')
    start(async () => {
      await updateRawMaterial(materialId, { stock_qty: qty })
      cancelEdit()
      load()
    })
  }

  const low = materials.filter(m => m.stock_qty <= m.low_stock_threshold)
  const inStock = materials.filter(m => m.stock_qty > m.low_stock_threshold)

  return (
    <div className="flex h-screen bg-background text-foreground">
      <div className="hidden md:block w-64 shrink-0"><AdminSidebar /></div>
      {mobile && <AdminSidebar mobile onClose={() => setMobile(false)} />}

      <div className="flex-1 overflow-auto">
        <div className="bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Scale className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold">Raw Materials Inventory</h1>
          </div>
          <button onClick={() => setMobile(true)} className="md:hidden p-2 hover:bg-muted rounded-lg"><Menu className="w-5 h-5" /></button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Total Materials</p>
              <p className="text-2xl font-bold">{materials.length}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Healthy Stock</p>
              <p className="text-2xl font-bold text-green-500">{inStock.length}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center shadow-sm">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Low Stock Alert</p>
              <p className="text-2xl font-bold text-yellow-500">{low.length}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border bg-muted/20">
              <h2 className="font-semibold text-sm">Inventory Tracking (Raw Ingredients)</h2>
            </div>
            {loading ? (
              <div className="p-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading materials...
              </div>
            ) : materials.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">
                No raw materials found. Add ingredients via the Products recipe management.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {['Material', 'Current Stock', 'Unit', 'Status', 'Action'].map(h => (
                        <th key={h} className="text-left px-4 sm:px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map(m => {
                      const isLow = m.stock_qty <= m.low_stock_threshold
                      const isEdit = editId === m.id
                      return (
                        <tr key={m.id} className="border-b border-border hover:bg-muted/30 transition">
                          <td className="px-4 sm:px-6 py-4 font-bold text-foreground">{m.name}</td>
                          <td className="px-4 sm:px-6 py-4">
                            {isEdit ? (
                              <div>
                                <input type="number" step="0.1" min="0" max="99999" value={editQty}
                                  onChange={e => { setEditQty(e.target.value); setQtyError('') }}
                                  className={`w-24 px-3 py-1.5 border rounded-lg bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${qtyError ? 'border-destructive' : 'border-border'}`}
                                />
                                {qtyError && <p className="text-xs text-destructive mt-1">{qtyError}</p>}
                              </div>
                            ) : (
                              <span className={`font-mono font-bold text-lg ${isLow ? 'text-yellow-500' : 'text-green-500'}`}>
                                {Number(m.stock_qty).toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-muted-foreground font-medium uppercase tracking-tighter text-xs">
                            {m.unit}
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            {isLow
                              ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-500/15 text-yellow-600 border border-yellow-500/20"><AlertCircle className="w-3 h-3" />LOW STOCK</span>
                              : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500/15 text-green-600 border border-green-500/20">HEALTHY</span>
                            }
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-right">
                            {isEdit ? (
                              <div className="flex items-center gap-2">
                                <button onClick={() => saveEdit(m.id)} disabled={pending}
                                  className="flex items-center gap-1 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition disabled:opacity-50 shadow-sm">
                                  <Save className="w-3.5 h-3.5" />Save
                                </button>
                                <button onClick={cancelEdit}
                                  className="flex items-center gap-1 px-4 py-1.5 bg-muted text-foreground rounded-lg text-xs font-bold hover:bg-muted/80 transition">
                                  <X className="w-3.5 h-3.5" />Cancel
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => startEdit(m)} className="text-primary hover:text-accent text-xs font-bold tracking-tight px-4 py-1.5 border border-primary/20 rounded-lg hover:border-accent transition">
                                Update Stock
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
