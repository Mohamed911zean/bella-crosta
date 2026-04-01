'use client'

import { useEffect, useState, useTransition } from 'react'
import { useParams } from 'next/navigation'
import { AdminSidebar } from '@/components/admin-sidebar'
import { getOrderById } from '@/lib/db'
import { updateOrderStatus, confirmPayment } from '@/lib/actions'
import type { Order } from '@/lib/db'
import { Menu, ArrowLeft, CheckCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'

const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'delivered', 'cancelled'] as const

export default function AdminOrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [isPending, startTransition] = useTransition()

  const loadOrder = () => {
    getOrderById(orderId).then(data => {
      setOrder(data)
      setSelectedStatus(data?.status ?? '')
      setLoading(false)
    })
  }

  useEffect(() => { loadOrder() }, [orderId])

  const handleUpdateStatus = () => {
    if (!selectedStatus || selectedStatus === order?.status) return
    startTransition(async () => {
      await updateOrderStatus(orderId, selectedStatus as Order['status'])
      loadOrder()
    })
  }

  const handleConfirmPayment = () => {
    startTransition(async () => {
      await confirmPayment(orderId)
      loadOrder()
    })
  }

  const statusColor = (s: string) => ({
    pending:   'bg-yellow-500/15 text-yellow-400',
    confirmed: 'bg-blue-500/15 text-blue-400',
    preparing: 'bg-primary/15 text-primary',
    delivered: 'bg-green-500/15 text-green-400',
    cancelled: 'bg-destructive/15 text-destructive',
  }[s] ?? 'bg-muted text-muted-foreground')

  const paymentColor = (s: string) => ({
    confirmed: 'bg-green-500/15 text-green-400',
    uploaded:  'bg-yellow-500/15 text-yellow-400',
    pending:   'bg-muted text-muted-foreground',
  }[s] ?? 'bg-muted text-muted-foreground')

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:block w-64 shrink-0">
        <AdminSidebar />
      </div>

      {mobileMenuOpen && (
        <AdminSidebar mobile onClose={() => setMobileMenuOpen(false)} />
      )}

      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Link href="/admin/orders" className="text-muted-foreground hover:text-primary transition flex items-center gap-1.5 text-sm">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Orders</span>
            </Link>
            <span className="text-border">/</span>
            <h1 className="text-base font-bold text-foreground">{order?.order_number ?? '…'}</h1>
          </div>
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 hover:bg-muted rounded-lg transition">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading order…</div>
        ) : !order ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Order not found.</div>
        ) : (
          <div className="p-4 sm:p-6 max-w-4xl">
            <div className="grid lg:grid-cols-3 gap-6">

              {/* ── Left column ── */}
              <div className="lg:col-span-2 space-y-5">

                {/* Order summary */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="font-semibold text-foreground mb-4">Order Summary</h2>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-0.5">Order number</p>
                      <p className="font-semibold text-foreground">{order.order_number}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-0.5">Date</p>
                      <p className="text-foreground">{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-0.5">Total</p>
                      <p className="font-bold text-primary text-lg">${Number(order.total_amount).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-0.5">Payment method</p>
                      <p className="font-medium text-foreground capitalize">{order.payment_method?.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="font-semibold text-foreground mb-4">Items</h2>
                  <div className="space-y-3">
                    {order.order_items?.map(item => (
                      <div key={item.id} className="flex justify-between items-start pb-3 border-b border-border last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium text-foreground text-sm">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.quantity} × ${Number(item.unit_price).toFixed(2)}
                          </p>
                        </div>
                        <p className="font-semibold text-foreground text-sm">${Number(item.subtotal).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="font-semibold text-foreground mb-4">Delivery Information</h2>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-0.5">Address</p>
                      <p className="text-foreground">{order.delivery_address ?? '—'}</p>
                    </div>
                    {order.delivery_notes && (
                      <div>
                        <p className="text-muted-foreground mb-0.5">Notes</p>
                        <p className="text-foreground">{order.delivery_notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="font-semibold text-foreground mb-4">Customer</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-16">Name</span>
                      <span className="font-medium text-foreground">{order.customers?.full_name ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-16">Email</span>
                      <span className="text-foreground">{order.customers?.email ?? '—'}</span>
                    </div>
                    {order.customers?.phone && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-16">Phone</span>
                        <span className="text-foreground">{order.customers.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Right column ── */}
              <div className="space-y-5">

                {/* Order status */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-3">Order Status</h3>
                  <div className="mb-1">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${statusColor(order.status)}`}>
                      Current: {order.status}
                    </span>
                  </div>
                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                    className="w-full mt-3 px-3 py-2 border border-border rounded-xl bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {ORDER_STATUSES.map(s => (
                      <option key={s} value={s} className="capitalize">{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleUpdateStatus}
                    disabled={isPending || selectedStatus === order.status}
                    className="w-full mt-3 bg-primary text-primary-foreground py-2 rounded-xl text-sm font-semibold hover:bg-accent transition disabled:opacity-40"
                  >
                    {isPending ? 'Updating…' : 'Update Status'}
                  </button>
                </div>

                {/* Payment */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-3">Payment</h3>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium capitalize ${paymentColor(order.payment_status)}`}>
                        {order.payment_status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-semibold text-foreground">${Number(order.total_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Method</span>
                      <span className="text-foreground capitalize">{order.payment_method?.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {order.payment_proof_url && (
                    <a
                      href={order.payment_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline text-xs mb-4"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View payment proof
                    </a>
                  )}

                  {order.payment_status !== 'confirmed' && (
                    <button
                      onClick={handleConfirmPayment}
                      disabled={isPending}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-sm font-semibold transition disabled:opacity-40"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {isPending ? 'Confirming…' : 'Confirm Payment'}
                    </button>
                  )}

                  {order.payment_status === 'confirmed' && (
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Payment confirmed
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}