'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/admin-sidebar'
import { supabase } from '@/lib/db'
import { getAllOrders } from '@/lib/db'
import { Menu, TrendingUp, ShoppingCart, CreditCard, Package } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

      // Verify admin access
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // Calculate stats
  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0)
  const pendingOrders = orders.filter((o) => o.status === 'pending').length
  const confirmedPayments = orders.filter(
    (o) => o.payments?.length > 0 && o.payments[0]?.status === 'confirmed'
  ).length

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
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Orders</p>
                  <p className="text-3xl font-bold">{totalOrders}</p>
                </div>
                <ShoppingCart className="w-10 h-10 text-primary opacity-50" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-600 opacity-50" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Pending Orders</p>
                  <p className="text-3xl font-bold">{pendingOrders}</p>
                </div>
                <Package className="w-10 h-10 text-yellow-600 opacity-50" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Confirmed Payments</p>
                  <p className="text-3xl font-bold">{confirmedPayments}</p>
                </div>
                <CreditCard className="w-10 h-10 text-blue-600 opacity-50" />
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-card border border-border rounded-lg">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold">Recent Orders</h2>
              <Link
                href="/admin/orders"
                className="text-sm text-primary hover:underline"
              >
                View All
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-6 py-3 font-semibold">Order #</th>
                    <th className="text-left px-6 py-3 font-semibold">Customer</th>
                    <th className="text-left px-6 py-3 font-semibold">Amount</th>
                    <th className="text-left px-6 py-3 font-semibold">Status</th>
                    <th className="text-left px-6 py-3 font-semibold">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 10).map((order) => (
                    <tr key={order.id} className="border-b border-border hover:bg-muted/50">
                      <td className="px-6 py-3 font-medium">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-primary hover:underline"
                        >
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="px-6 py-3">{order.customers?.full_name || 'N/A'}</td>
                      <td className="px-6 py-3 font-semibold">
                        ${order.total_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          order.status === 'completed'
                            ? 'bg-green-500/20 text-green-700'
                            : order.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-700'
                            : 'bg-blue-500/20 text-blue-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          order.payments?.[0]?.status === 'confirmed'
                            ? 'bg-green-500/20 text-green-700'
                            : order.payments?.[0]?.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-700'
                            : 'bg-gray-500/20 text-gray-700'
                        }`}>
                          {order.payments?.[0]?.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
