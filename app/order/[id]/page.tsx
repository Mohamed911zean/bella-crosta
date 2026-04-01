'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Header } from '@/components/header'
import { getOrderById } from '@/lib/db'
import type { Order } from '@/lib/db'
import { CheckCircle, Clock, Package, Truck, XCircle, Loader2, ExternalLink } from 'lucide-react'

// Visual timeline of order progress
const ORDER_STEPS = [
  { key: 'pending',   label: 'Order Placed',    icon: CheckCircle },
  { key: 'confirmed', label: 'Payment Confirmed', icon: CheckCircle },
  { key: 'preparing', label: 'Being Prepared',  icon: Package     },
  { key: 'delivered', label: 'Delivered',        icon: Truck       },
] as const

type StepKey = typeof ORDER_STEPS[number]['key']

function getStepIndex(status: string): number {
  return ORDER_STEPS.findIndex(s => s.key === status)
}

export default function OrderPage() {
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getOrderById(orderId)
      .then(data => {
        if (!data) setError('Order not found.')
        else setOrder(data)
        setLoading(false)
      })
      .catch(() => { setError('Failed to load order.'); setLoading(false) })
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <p className="text-4xl mb-4">😕</p>
          <h1 className="text-2xl font-bold text-foreground mb-3">{error || 'Order not found'}</h1>
          <Link href="/" className="text-primary hover:underline">Return to home</Link>
        </div>
      </div>
    )
  }

  const isCancelled = order.status === 'cancelled'
  const currentStep = isCancelled ? -1 : getStepIndex(order.status)

  const paymentBanner = () => {
    if (order.payment_status === 'confirmed') {
      return (
        <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/25 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-400 text-sm">Payment Confirmed</p>
            <p className="text-muted-foreground text-xs mt-0.5">Your payment has been verified. We're working on your order.</p>
          </div>
        </div>
      )
    }
    if (order.payment_status === 'uploaded') {
      return (
        <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/25 rounded-xl">
          <Clock className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-400 text-sm">Payment Under Review</p>
            <p className="text-muted-foreground text-xs mt-0.5">We received your payment screenshot and are reviewing it. This usually takes a few minutes.</p>
            {order.payment_proof_url && (
              <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline text-xs mt-1.5">
                <ExternalLink className="w-3 h-3" />
                View your uploaded proof
              </a>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* Header card */}
        <div className="bg-card border border-border rounded-xl p-6 mb-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Order confirmed</p>
              <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                {order.order_number}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(order.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
            {isCancelled ? (
              <XCircle className="w-8 h-8 text-destructive" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-400" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Total</p>
              <p className="font-bold text-primary text-xl">${Number(order.total_amount).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Payment</p>
              <p className="font-semibold text-foreground capitalize">{order.payment_method?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        {/* Payment status banner */}
        {paymentBanner() && <div className="mb-5">{paymentBanner()}</div>}

        {/* Order status timeline */}
        {!isCancelled && (
          <div className="bg-card border border-border rounded-xl p-5 mb-5">
            <h2 className="font-semibold text-foreground text-sm mb-5">Order Progress</h2>
            <div className="flex items-center gap-0">
              {ORDER_STEPS.map((step, idx) => {
                const Icon = step.icon
                const done    = idx <= currentStep
                const current = idx === currentStep
                return (
                  <div key={step.key} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        done
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      } ${current ? 'ring-2 ring-primary/40 ring-offset-2 ring-offset-card' : ''}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className={`text-xs text-center leading-tight max-w-[60px] ${done ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {step.label}
                      </p>
                    </div>
                    {idx < ORDER_STEPS.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-1 mb-5 transition-all ${idx < currentStep ? 'bg-primary' : 'bg-border'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="bg-destructive/10 border border-destructive/25 rounded-xl p-4 mb-5">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="w-4 h-4" />
              <p className="font-semibold text-sm">Order Cancelled</p>
            </div>
            <p className="text-muted-foreground text-xs mt-1">This order has been cancelled. Contact us if you have questions.</p>
          </div>
        )}

        {/* Order items */}
        <div className="bg-card border border-border rounded-xl p-5 mb-5">
          <h2 className="font-semibold text-foreground text-sm mb-4">Your Items</h2>
          <div className="space-y-3">
            {order.order_items?.map(item => (
              <div key={item.id} className="flex justify-between items-start pb-3 border-b border-border last:pb-0 last:border-0">
                <div>
                  <p className="font-medium text-foreground text-sm">{item.product_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.quantity} × ${Number(item.unit_price).toFixed(2)}</p>
                </div>
                <p className="font-semibold text-foreground text-sm">${Number(item.subtotal).toFixed(2)}</p>
              </div>
            ))}
            <div className="flex justify-between items-center pt-1">
              <span className="font-bold text-foreground">Total</span>
              <span className="font-bold text-primary">${Number(order.total_amount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Delivery info */}
        <div className="bg-card border border-border rounded-xl p-5 mb-8">
          <h2 className="font-semibold text-foreground text-sm mb-3">Delivery Address</h2>
          <p className="text-muted-foreground text-sm">{order.delivery_address}</p>
          {order.delivery_notes && (
            <p className="text-muted-foreground text-xs mt-2 italic">"{order.delivery_notes}"</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/menu" className="flex-1 py-3 text-center bg-muted text-foreground rounded-xl font-medium text-sm hover:bg-muted/80 transition">
            Order More
          </Link>
          <Link href="/" className="flex-1 py-3 text-center border border-primary text-primary rounded-xl font-medium text-sm hover:bg-primary/10 transition">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}