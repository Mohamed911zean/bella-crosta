'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/admin-sidebar'
import { getAllRawMaterials } from '@/lib/db'
import { createProduct } from '@/lib/actions'
import type { RawMaterial } from '@/lib/db'
import { Menu, ArrowLeft, Plus, Trash2, Save, Loader2, Package, Scale } from 'lucide-react'
import Link from 'next/link'

export default function AddProductPage() {
  const router = useRouter()
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [mobile, setMobile] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Pizzas',
    image_url: '',
    is_featured: false
  })

  const [ingredients, setIngredients] = useState<Array<{ materialId: string; quantity: string }>>([])

  useEffect(() => {
    getAllRawMaterials().then(d => {
      setMaterials(d)
      setLoading(false)
    })
  }, [])

  const addIngredient = () => {
    if (materials.length === 0) return
    setIngredients([...ingredients, { materialId: materials[0].id, quantity: '1' }])
  }

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const updateIngredient = (index: number, field: 'materialId' | 'quantity', value: string) => {
    const newIngs = [...ingredients]
    newIngs[index] = { ...newIngs[index], [field]: value }
    setIngredients(newIngs)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.name || !form.price) {
      setError('Name and price are required.')
      return
    }

    startTransition(async () => {
      const result = await createProduct(
        {
          name: form.name,
          description: form.description,
          price: parseFloat(form.price),
          category: form.category,
          image_url: form.image_url || undefined,
          is_featured: form.is_featured
        },
        ingredients.map(ing => ({
          materialId: ing.materialId,
          quantity: parseFloat(ing.quantity)
        }))
      )

      if (result.success) {
        router.push('/admin/products')
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:block w-64 shrink-0"><AdminSidebar /></div>
      {mobile && <AdminSidebar mobile onClose={() => setMobile(false)} />}

      <div className="flex-1 overflow-auto">
        <div className="bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Link href="/admin/products" className="p-2 hover:bg-muted rounded-lg transition text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-foreground">Add New Product</h1>
          </div>
          <button onClick={() => setMobile(true)} className="md:hidden p-2 hover:bg-muted rounded-lg"><Menu className="w-5 h-5" /></button>
        </div>

        <div className="p-4 sm:p-6 max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Basic Info */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-2">
                  <Package className="w-4 h-4" /> Product Details
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Product Name *</label>
                  <input
                    type="text" required
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="e.g. Margherita Special"
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Description</label>
                  <textarea
                    rows={3}
                    value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                    placeholder="Describe the flavors and ingredients..."
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Price ($) *</label>
                    <input
                      type="number" step="0.01" required
                      value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                      placeholder="12.99"
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Category</label>
                    <select
                      value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    >
                      <option value="Pizzas">Pizzas</option>
                      <option value="Appetizers">Appetizers</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Desserts">Desserts</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Image URL</label>
                  <input
                    type="url"
                    value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>

                <label className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/50 transition border border-border">
                  <input
                    type="checkbox"
                    checked={form.is_featured} onChange={e => setForm({...form, is_featured: e.target.checked})}
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-bold text-foreground uppercase tracking-tighter">Feature on Home Page</span>
                </label>
              </div>

              {/* Ingredients / BOM */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                    <Scale className="w-4 h-4" /> Ingredients (Recipe)
                  </div>
                  <button
                    type="button" onClick={addIngredient}
                    className="p-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {loading ? (
                  <div className="p-8 text-center text-muted-foreground text-xs animate-pulse uppercase font-bold tracking-widest">Loading raw materials...</div>
                ) : ingredients.length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-border rounded-2xl">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">No ingredients added</p>
                    <button type="button" onClick={addIngredient} className="text-primary text-xs font-bold hover:underline">Add first ingredient</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ingredients.map((ing, idx) => (
                      <div key={idx} className="flex gap-2 items-end">
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Material</label>
                          <select
                            value={ing.materialId} onChange={e => updateIngredient(idx, 'materialId', e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                          >
                            {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                          </select>
                        </div>
                        <div className="w-24 space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Qty</label>
                          <input
                            type="number" step="0.1" min="0"
                            value={ing.quantity} onChange={e => updateIngredient(idx, 'quantity', e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        </div>
                        <button
                          type="button" onClick={() => removeIngredient(idx)}
                          className="p-2.5 text-destructive hover:bg-destructive/10 rounded-lg transition mb-0.5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-[10px] text-muted-foreground italic leading-relaxed pt-4 border-t border-border mt-4">
                  Note: When this product is ordered, the specified quantities will be automatically deducted from the raw materials inventory.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4">
              <Link href="/admin/products" className="px-6 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground transition uppercase tracking-widest">
                Cancel
              </Link>
              <button
                type="submit" disabled={isPending}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-2xl text-sm font-bold hover:opacity-90 transition shadow-lg shadow-primary/20 disabled:opacity-50 uppercase tracking-widest"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Product
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
