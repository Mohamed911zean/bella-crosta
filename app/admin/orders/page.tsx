'use client'

import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/admin-sidebar'
import { getAllOrders } from '@/lib/db'
import type { Order } from '@/lib/db'
import { Menu } from 'lucide-react'
import Link from 'next/link'

const STATUS_FILTERS = [
  { value: 'all',       label: 'All Orders' },
  { value: 'pending',   label: 'Pending'    },
  { value: 'confirmed', label: 'Confirmed'  },
  { value: 'preparing', label: 'Preparing'  },
  { value: 'delivered', label: 'Delivered'  },
  { value: 'cancelled', label: 'Cancelled'  },
]

export default function AdminOrdersPage() {
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    async function checkAdmin() {
      const res = await fetch('/api/auth/session')
      const data = await res.json()
      if (!data.user || data.user.role !== 'admin') {
        window.location.href = '/'
        return
      }
      setUser(data.user)
      getAllOrders().then(data => {
        setOrders(data)
        setLoading(false)
      })
    }
    checkAdmin()
  }, [])

  const filtered = filterStatus === 'all'
    ? orders
    : orders.filter(o => o.status === filterStatus)

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      pending:   'bg-yellow-500/15 text-yellow-400',
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
      uploaded:  'bg-yellow-500/15 text-yellow-400',
      pending:   'bg-muted text-muted-foreground',
    }
    return map[status] ?? 'bg-muted text-muted-foreground'
  }

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
          <h1 className="text-xl font-bold text-foreground">Orders</h1>
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 hover:bg-muted rounded-lg transition">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {STATUS_FILTERS.map(s => (
              <button
                key={s.value}
                onClick={() => setFilterStatus(s.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  filterStatus === s.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No orders found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {['Order #', 'Customer', 'Amount', 'Status', 'Payment', 'Date', ''].map(h => (
                        <th key={h} className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(order => (
                      <tr key={order.id} className="border-b border-border hover:bg-muted/30 transition">
                        <td className="px-4 sm:px-6 py-3">
                          <Link href={`/admin/orders/${order.id}`} className="text-primary hover:underline font-medium">
                            {order.order_number}
                          </Link>
                        </td>
                        <td className="px-4 sm:px-6 py-3">
                          <p className="font-medium text-foreground">{order.customers?.full_name ?? 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">{order.customers?.email}</p>
                        </td>
                        <td className="px-4 sm:px-6 py-3 font-semibold text-foreground">
                          ${Number(order.total_amount).toFixed(2)}
                        </td>
                        <td className="px-4 sm:px-6 py-3">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${statusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${paymentColor(order.payment_status)}`}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-center">
                          <Link href={`/admin/orders/${order.id}`} className="text-primary hover:underline text-xs">
                            View →
                          </Link>
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