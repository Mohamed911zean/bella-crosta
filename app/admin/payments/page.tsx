'use client'

import { useEffect, useState, useTransition } from 'react'
import { AdminSidebar } from '@/components/admin-sidebar'
import { getAllOrders } from '@/lib/db'
import { confirmPayment } from '@/lib/actions'
import type { Order } from '@/lib/db'
import { Menu, CheckCircle, Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function AdminPaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [filter, setFilter] = useState<'uploaded' | 'confirmed' | 'all'>('uploaded')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const loadOrders = () => {
    getAllOrders().then(data => {
      setOrders(data)
      setLoading(false)
    })
  }

  useEffect(() => { loadOrders() }, [])

  const handleConfirm = (orderId: string) => {
    setConfirmingId(orderId)
    startTransition(async () => {
      await confirmPayment(orderId)
      setConfirmingId(null)
      loadOrders()
    })
  }

  const filtered = orders.filter(o => {
    if (filter === 'all') return true
    return o.payment_status === filter
  })

  const uploadedCount  = orders.filter(o => o.payment_status === 'uploaded').length
  const confirmedCount = orders.filter(o => o.payment_status === 'confirmed').length
  const totalRevenue   = orders.filter(o => o.payment_status === 'confirmed')
    .reduce((sum, o) => sum + Number(o.total_amount), 0)

  const paymentLabel = (status: string) => {
    const map: Record<string, string> = {
      uploaded:  'Awaiting Review',
      confirmed: 'Confirmed',
      pending:   'No Proof',
    }
    return map[status] ?? status
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
          <h1 className="text-xl font-bold text-foreground">Payments</h1>
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 hover:bg-muted rounded-lg transition">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Awaiting Review</p>
              <p className="text-2xl font-bold text-yellow-400">{uploadedCount}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Confirmed</p>
              <p className="text-2xl font-bold text-green-400">{confirmedCount}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Confirmed Revenue</p>
              <p className="text-2xl font-bold text-primary">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6">
            {([['uploaded', 'Awaiting Review'], ['confirmed', 'Confirmed'], ['all', 'All']] as const).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  filter === v
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground text-sm">No payments in this category.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {['Order', 'Customer', 'Amount', 'Method', 'Status', 'Proof', 'Date', ''].map(h => (
                        <th key={h} className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(order => (
                      <tr key={order.id} className="border-b border-border hover:bg-muted/30 transition">
                        <td className="px-4 sm:px-6 py-3">
                          <Link href={`/admin/orders/${order.id}`} className="text-primary hover:underline font-medium text-xs">
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
                        <td className="px-4 sm:px-6 py-3 text-muted-foreground capitalize text-xs">
                          {order.payment_method?.replace('_', ' ')}
                        </td>
                        <td className="px-4 sm:px-6 py-3">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${paymentColor(order.payment_status)}`}>
                            {paymentLabel(order.payment_status)}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3">
                          {order.payment_proof_url ? (
                            <a
                              href={order.payment_proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 sm:px-6 py-3">
                          {order.payment_status === 'uploaded' ? (
                            <button
                              onClick={() => handleConfirm(order.id)}
                              disabled={confirmingId === order.id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                            >
                              <CheckCircle className="w-3 h-3" />
                              {confirmingId === order.id ? '…' : 'Confirm'}
                            </button>
                          ) : order.payment_status === 'confirmed' ? (
                            <span className="flex items-center gap-1 text-green-400 text-xs">
                              <CheckCircle className="w-3 h-3" />
                              Done
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
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