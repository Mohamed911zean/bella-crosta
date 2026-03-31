'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/admin-sidebar'
import { supabase } from '@/lib/db'
import { getAllOrders } from '@/lib/db'
import { Menu } from 'lucide-react'
import Link from 'next/link'

export default function AdminOrdersPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')

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
      loadOrders()
    } catch (err) {
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    try {
      const ordersData = await getAllOrders()
      setOrders(ordersData)
    } catch (err) {
      console.error('Error loading orders:', err)
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'all') return true
    return order.status === filterStatus
  })

  const statuses = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

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
          <h1 className="text-2xl font-bold">Orders</h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-2">
            {statuses.map((status) => (
              <button
                key={status.value}
                onClick={() => setFilterStatus(status.value)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterStatus === status.value
                    ? 'bg-primary text-white'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>

          {/* Orders Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 sm:px-6 py-3 font-semibold">Order #</th>
                    <th className="text-left px-4 sm:px-6 py-3 font-semibold">Customer</th>
                    <th className="text-left px-4 sm:px-6 py-3 font-semibold">Amount</th>
                    <th className="text-left px-4 sm:px-6 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 sm:px-6 py-3 font-semibold">Payment</th>
                    <th className="text-left px-4 sm:px-6 py-3 font-semibold">Date</th>
                    <th className="text-center px-4 sm:px-6 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border hover:bg-muted/50 transition">
                      <td className="px-4 sm:px-6 py-3 font-medium">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-primary hover:underline"
                        >
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <div>
                          <p className="font-medium">{order.customers?.full_name || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.customers?.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 font-semibold">
                        ${order.total_amount.toFixed(2)}
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          order.status === 'completed'
                            ? 'bg-green-500/20 text-green-700'
                            : order.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-700'
                            : order.status === 'cancelled'
                            ? 'bg-destructive/20 text-destructive'
                            : 'bg-blue-500/20 text-blue-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          order.payments?.[0]?.status === 'confirmed'
                            ? 'bg-green-500/20 text-green-700'
                            : order.payments?.[0]?.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-700'
                            : 'bg-gray-500/20 text-gray-700'
                        }`}>
                          {order.payments?.[0]?.status || 'None'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-center">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-primary hover:underline text-xs sm:text-sm"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredOrders.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No orders found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
