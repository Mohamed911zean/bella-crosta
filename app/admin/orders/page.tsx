'use client'

import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/admin-sidebar'
import { getAllOrders } from '@/lib/db'
import type { Order } from '@/lib/db'
import { Menu } from 'lucide-react'
import Link from 'next/link'

const FILTERS = [
  { v: 'all',       l: 'All Orders' },
  { v: 'pending',   l: 'Pending'    },
  { v: 'confirmed', l: 'Confirmed'  },
  { v: 'preparing', l: 'Preparing'  },
  { v: 'delivered', l: 'Delivered'  },
  { v: 'cancelled', l: 'Cancelled'  },
]

export default function AdminOrdersPage() {
  const [orders,  setOrders]  = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [mobile,  setMobile]  = useState(false)
  const [filter,  setFilter]  = useState('all')

  useEffect(() => {
    getAllOrders().then(d => { setOrders(d); setLoading(false) })
  }, [])

  const shown = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const statusColor = (s: string) => ({
    pending: 'bg-yellow-500/15 text-yellow-400', confirmed: 'bg-blue-500/15 text-blue-400',
    preparing: 'bg-primary/15 text-primary',     delivered: 'bg-green-500/15 text-green-400',
    cancelled: 'bg-destructive/15 text-destructive',
  }[s] ?? 'bg-muted text-muted-foreground')

  const payColor = (s: string) => ({
    confirmed: 'bg-green-500/15 text-green-400',
    uploaded:  'bg-yellow-500/15 text-yellow-400',
    pending:   'bg-muted text-muted-foreground',
  }[s] ?? 'bg-muted text-muted-foreground')

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:block w-64 shrink-0"><AdminSidebar /></div>
      {mobile && <AdminSidebar mobile onClose={() => setMobile(false)} />}

      <div className="flex-1 overflow-auto">
        <div className="bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-bold text-foreground">Orders</h1>
          <button onClick={() => setMobile(true)} className="md:hidden p-2 hover:bg-muted rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-wrap gap-2 mb-6">
            {FILTERS.map(({ v, l }) => (
              <button key={v} onClick={() => setFilter(v)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition active:scale-95 ${filter === v ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                {l}
              </button>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
            ) : shown.length === 0 ? (
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
                    {shown.map(o => (
                      <tr key={o.id} className="border-b border-border hover:bg-muted/30 transition">
                        <td className="px-4 sm:px-6 py-3">
                          <Link href={`/admin/orders/${o.id}`} className="text-primary hover:underline font-medium">{o.order_number}</Link>
                        </td>
                        <td className="px-4 sm:px-6 py-3">
                          <p className="font-medium text-foreground">{o.customers?.full_name ?? 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">{o.customers?.email}</p>
                        </td>
                        <td className="px-4 sm:px-6 py-3 font-semibold text-foreground">${Number(o.total_amount).toFixed(2)}</td>
                        <td className="px-4 sm:px-6 py-3">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${statusColor(o.status)}`}>{o.status}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-3">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${payColor(o.payment_status)}`}>{o.payment_status}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                        <td className="px-4 sm:px-6 py-3">
                          <Link href={`/admin/orders/${o.id}`} className="text-primary hover:underline text-xs">View →</Link>
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