'use client'

import { useState } from 'react'
import { AdminSidebar } from '@/components/admin-sidebar'
import type { Order } from '@/lib/db'
import { Menu, TrendingUp, ShoppingCart, CreditCard, Package } from 'lucide-react'
import Link from 'next/link'

interface AdminDashboardClientProps {
  orders: Order[]
}

export default function AdminDashboardClient({ orders }: AdminDashboardClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Stats derived from orders
  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0)
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const confirmedPayments = orders.filter(o => o.payment_status === 'confirmed').length

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-500/15 text-yellow-400',
      confirmed: 'bg-blue-500/15 text-blue-400',
      preparing: 'bg-primary/15 text-primary',
      delivered: 'bg-green-500/15 text-green-400',
      cancelled: 'bg-destructive/15 text-destructive',
    }
    return map[status] ?? 'bg-muted text-muted-foreground'
  }

  const paymentColor = (status: string) => {
    const map: Record<string, string> = {
      confirmed: 'bg-green-500/15 text-green-400',
      uploaded: 'bg-yellow-500/15 text-yellow-400',
      pending: 'bg-muted text-muted-foreground',
    }
    return map[status] ?? 'bg-muted text-muted-foreground'
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block w-64 shrink-0">
        <AdminSidebar />
      </div>

      {/* Mobile sidebar */}
      {mobileMenuOpen && <AdminSidebar mobile onClose={() => setMobileMenuOpen(false)} />}

      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: 'Total Orders',
                value: totalOrders,
                icon: ShoppingCart,
                color: 'text-primary',
              },
              {
                label: 'Total Revenue',
                value: `$${totalRevenue.toFixed(2)}`,
                icon: TrendingUp,
                color: 'text-green-400',
              },
              {
                label: 'Pending Orders',
                value: pendingOrders,
                icon: Package,
                color: 'text-yellow-400',
              },
              {
                label: 'Confirmed Payments',
                value: confirmedPayments,
                icon: CreditCard,
                color: 'text-blue-400',
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-muted-foreground text-xs mb-2">{label}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  </div>
                  <Icon className={`w-8 h-8 opacity-30 ${color}`} />
                </div>
              </div>
            ))}
          </div>

          {/* Recent orders table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Recent Orders</h2>
              <Link href="/admin/orders" className="text-xs text-primary hover:underline">
                View all →
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No orders yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Order
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Payment
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 10).map(order => (
                      <tr key={order.id} className="border-b border-border hover:bg-muted/30 transition">
                        <td className="px-6 py-3">
                          <Link href={`/admin/orders/${order.id}`} className="text-primary hover:underline font-medium">
                            {order.order_number}
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">
                          {order.customers?.full_name ?? order.customers?.email ?? 'N/A'}
                        </td>
                        <td className="px-6 py-3 font-semibold text-foreground">
                          ${Number(order.total_amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${statusColor(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${paymentColor(
                              order.payment_status
                            )}`}
                          >
                            {order.payment_status}
                          </span>
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
