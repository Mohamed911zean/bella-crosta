'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/admin-sidebar'
import { supabase } from '@/lib/db'
import { Menu, AlertCircle, Save } from 'lucide-react'

export default function AdminInventoryPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push('/admin/login')
        return
      }

      const { data: adminData } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (!adminData) {
        router.push('/admin/login')
        return
      }

      setUser(currentUser)
      loadInventory()
    } catch (err) {
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const loadInventory = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('*, inventory(*), categories(name)')
        .eq('is_available', true)
        .order('created_at', { ascending: false })

      setProducts(data || [])
    } catch (err) {
      console.error('Error loading inventory:', err)
    }
  }

  const handleEdit = (product: any, inventory: any) => {
    setEditingId(product.id)
    setEditValues({
      productId: product.id,
      quantity: inventory?.quantity_in_stock || 0,
      threshold: inventory?.low_stock_threshold || 5,
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValues({})
  }

  const handleSave = async () => {
    if (!editingId) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('inventory')
        .update({
          quantity_in_stock: parseInt(editValues.quantity),
          low_stock_threshold: parseInt(editValues.threshold),
          last_updated: new Date().toISOString(),
        })
        .eq('product_id', editingId)

      if (error) throw error

      await loadInventory()
      setEditingId(null)
      setEditValues({})
    } catch (err) {
      console.error('Error saving inventory:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64">
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <AdminSidebar mobile onClose={() => setMobileMenuOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Inventory Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 sm:px-6 py-3 font-semibold">Product</th>
                    <th className="text-left px-4 sm:px-6 py-3 font-semibold">Category</th>
                    <th className="text-left px-4 sm:px-6 py-3 font-semibold">Stock</th>
                    <th className="text-left px-4 sm:px-6 py-3 font-semibold">Threshold</th>
                    <th className="text-left px-4 sm:px-6 py-3 font-semibold">Status</th>
                    <th className="text-center px-4 sm:px-6 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const inventory = product.inventory?.[0]
                    const quantity = inventory?.quantity_in_stock || 0
                    const threshold = inventory?.low_stock_threshold || 5
                    const isLowStock = quantity <= threshold
                    const isEditing = editingId === product.id

                    return (
                      <tr key={product.id} className="border-b border-border hover:bg-muted/50 transition">
                        <td className="px-4 sm:px-6 py-3 font-medium">{product.name}</td>
                        <td className="px-4 sm:px-6 py-3 text-muted-foreground">
                          {product.categories?.name}
                        </td>
                        <td className="px-4 sm:px-6 py-3">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editValues.quantity}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  quantity: e.target.value,
                                })
                              }
                              className="w-16 px-2 py-1 border border-border rounded text-sm"
                            />
                          ) : (
                            <span
                              className={`font-semibold ${
                                isLowStock ? 'text-yellow-600' : 'text-green-600'
                              }`}
                            >
                              {quantity}
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-3">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editValues.threshold}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  threshold: e.target.value,
                                })
                              }
                              className="w-16 px-2 py-1 border border-border rounded text-sm"
                            />
                          ) : (
                            <span className="text-muted-foreground">{threshold}</span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-3">
                          {isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-500/20 text-yellow-700">
                              <AlertCircle className="w-3 h-3" />
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-700">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-center">
                          {isEditing ? (
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-1"
                              >
                                <Save className="w-3 h-3" />
                                Save
                              </button>
                              <button
                                onClick={handleCancel}
                                className="px-3 py-1 bg-muted text-foreground rounded text-xs hover:bg-muted/80 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEdit(product, inventory)}
                              className="text-primary hover:underline text-xs"
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

            {products.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No products found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
