'use client'

import { useEffect, useState, useTransition } from 'react'
import { useParams } from 'next/navigation'
import { AdminSidebar } from '@/components/admin-sidebar'
import { getOrderById } from '@/lib/db'
import { updateOrderStatus, confirmPayment } from '@/lib/actions'
import type { Order } from '@/lib/db'
import { Menu, ArrowLeft, CheckCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'

const STATUSES = ['pending','confirmed','preparing','delivered','cancelled'] as const

export default function AdminOrderDetailPage() {
  const { id: orderId } = useParams<{ id: string }>()
  const [order,    setOrder]    = useState<Order | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [mobile,   setMobile]   = useState(false)
  const [selStatus,setSelStatus]= useState('')
  const [pending,  start]       = useTransition()

  const load = () => getOrderById(orderId).then(d => { setOrder(d); setSelStatus(d?.status ?? '') })

  useEffect(() => { load().finally(() => setLoading(false)) }, [orderId])

  const handleStatus  = () => { if (!selStatus || selStatus === order?.status) return; start(async () => { await updateOrderStatus(orderId, selStatus as Order['status']); load() }) }
  const handleConfirm = () => start(async () => { await confirmPayment(orderId); load() })

  const statusColor = (s: string) => ({ pending:'bg-yellow-500/15 text-yellow-400', confirmed:'bg-blue-500/15 text-blue-400', preparing:'bg-primary/15 text-primary', delivered:'bg-green-500/15 text-green-400', cancelled:'bg-destructive/15 text-destructive' }[s] ?? 'bg-muted text-muted-foreground')
  const payColor    = (s: string) => ({ confirmed:'bg-green-500/15 text-green-400', uploaded:'bg-yellow-500/15 text-yellow-400', pending:'bg-muted text-muted-foreground' }[s] ?? 'bg-muted text-muted-foreground')

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:block w-64 shrink-0"><AdminSidebar /></div>
      {mobile && <AdminSidebar mobile onClose={() => setMobile(false)} />}

      <div className="flex-1 overflow-auto">
        <div className="bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Link href="/admin/orders" className="text-muted-foreground hover:text-primary text-sm flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">Orders</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-base font-bold text-foreground">{order?.order_number ?? '…'}</h1>
          </div>
          <button onClick={() => setMobile(true)} className="md:hidden p-2 hover:bg-muted rounded-lg"><Menu className="w-5 h-5" /></button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading order…</div>
        ) : !order ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Order not found.</div>
        ) : (
          <div className="p-4 sm:p-6 max-w-4xl">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                {/* Summary */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="font-semibold text-foreground mb-4">Order Summary</h2>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-muted-foreground text-xs mb-0.5">Order #</p><p className="font-semibold text-foreground">{order.order_number}</p></div>
                    <div><p className="text-muted-foreground text-xs mb-0.5">Date</p><p className="text-foreground">{new Date(order.created_at).toLocaleString()}</p></div>
                    <div><p className="text-muted-foreground text-xs mb-0.5">Total</p><p className="font-bold text-primary text-lg">${Number(order.total_amount).toFixed(2)}</p></div>
                    <div><p className="text-muted-foreground text-xs mb-0.5">Method</p><p className="font-medium text-foreground capitalize">{order.payment_method?.replace('_',' ')}</p></div>
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
                          <p className="text-xs text-muted-foreground mt-0.5">{item.quantity} × ${Number(item.unit_price).toFixed(2)}</p>
                        </div>
                        <p className="font-semibold text-foreground text-sm">${Number(item.subtotal).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="font-semibold text-foreground mb-3">Delivery</h2>
                  <p className="text-muted-foreground text-xs mb-0.5">Address</p>
                  <p className="text-foreground text-sm">{order.delivery_address ?? '—'}</p>
                  {order.delivery_notes && <><p className="text-muted-foreground text-xs mb-0.5 mt-3">Notes</p><p className="text-foreground text-sm">{order.delivery_notes}</p></>}
                </div>

                {/* Customer */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="font-semibold text-foreground mb-3">Customer</h2>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex gap-2"><span className="text-muted-foreground w-14">Name</span><span className="font-medium text-foreground">{order.customers?.full_name ?? '—'}</span></div>
                    <div className="flex gap-2"><span className="text-muted-foreground w-14">Email</span><span className="text-foreground">{order.customers?.email ?? '—'}</span></div>
                    {order.customers?.phone && <div className="flex gap-2"><span className="text-muted-foreground w-14">Phone</span><span className="text-foreground">{order.customers.phone}</span></div>}
                  </div>
                </div>
              </div>

              {/* Right sidebar */}
              <div className="space-y-5">
                {/* Order status */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-3">Order Status</h3>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${statusColor(order.status)}`}>Current: {order.status}</span>
                  <select value={selStatus} onChange={e => setSelStatus(e.target.value)}
                    className="w-full mt-3 px-3 py-2 border border-border rounded-xl bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                  <button onClick={handleStatus} disabled={pending || selStatus === order.status}
                    className="w-full mt-3 bg-primary text-primary-foreground py-2 rounded-xl text-sm font-semibold hover:bg-accent transition disabled:opacity-40">
                    {pending ? 'Updating…' : 'Update Status'}
                  </button>
                </div>

                {/* Payment */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-3">Payment</h3>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium capitalize ${payColor(order.payment_status)}`}>{order.payment_status}</span>
                    </div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold text-foreground">${Number(order.total_amount).toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span className="text-foreground capitalize">{order.payment_method?.replace('_',' ')}</span></div>
                  </div>
                  {order.payment_proof_url && (
                    <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline text-xs mb-4">
                      <ExternalLink className="w-3 h-3" />View payment proof
                    </a>
                  )}
                  {order.payment_status !== 'confirmed' ? (
                    <button onClick={handleConfirm} disabled={pending}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-sm font-semibold transition disabled:opacity-40">
                      <CheckCircle className="w-4 h-4" />{pending ? 'Confirming…' : 'Confirm Payment'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <CheckCircle className="w-4 h-4" />Payment confirmed
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