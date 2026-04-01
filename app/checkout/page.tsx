'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { AuthForm } from '@/components/auth-form'
import { useCart } from '@/lib/cart-context'
import { createOrder } from '@/lib/actions'
import { ArrowLeft, Loader2, AlertCircle, Upload, X } from 'lucide-react'

interface SessionUser {
  id: string
  email: string
  role: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPrice, clearCart } = useCart()

  const [user, setUser] = useState<SessionUser | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  // Delivery form
  const [fullName,      setFullName]      = useState('')
  const [phone,         setPhone]         = useState('')
  const [altPhone,      setAltPhone]      = useState('')
  const [address,       setAddress]       = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'instapay' | 'vodafone_cash'>('instapay')
  const [proofImage,    setProofImage]    = useState<string | null>(null)

  // Check auth via the session API (reads the bc_session cookie)
  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => { setUser(d.user); setCheckingAuth(false) })
      .catch(() => setCheckingAuth(false))
  }, [])

  const handleProof = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setProofImage(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!user) { setError('Please sign in to place an order.'); return }
    if (!fullName.trim()) { setError('Please enter your full name.'); return }
    if (!address.trim()) { setError('Please enter your delivery address.'); return }
    if (!proofImage) { setError('Please upload your payment screenshot.'); return }

    startTransition(async () => {
      const result = await createOrder(
        user.id,
        items.map(i => ({
          productId: i.productId,
          quantity:  i.quantity,
          price:     i.price,
          name:      i.name,
        })),
        totalPrice,
        address.trim(),
        deliveryNotes.trim(),
        paymentMethod,
        proofImage
      )

      if (!result.success) {
        setError(result.error)
        return
      }

      clearCart()
      router.push(`/order/${result.data!.orderId}`)
    })
  }

  // ── Empty cart ──
  if (!checkingAuth && items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <p className="text-5xl mb-6">🛒</p>
          <h1 className="text-2xl font-bold text-foreground mb-3">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Add some pizzas before checking out.</p>
          <Link href="/menu" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-accent transition">
            <ArrowLeft className="w-4 h-4" />
            Back to Menu
          </Link>
        </div>
      </div>
    )
  }

  // ── Loading ──
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  // ── Not logged in ──
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link href="/cart" className="inline-flex items-center gap-2 text-primary hover:underline text-sm mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to cart
          </Link>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-2xl font-bold text-foreground mb-2">Sign in to checkout</h1>
              <p className="text-muted-foreground mb-6">Create an account or sign in to place your order.</p>
              <AuthForm
                mode="signup"
                onSuccess={() => {
                  fetch('/api/auth/session').then(r => r.json()).then(d => setUser(d.user))
                }}
              />
            </div>
            <OrderSummaryCard items={items} total={totalPrice} />
          </div>
        </div>
      </div>
    )
  }

  const paymentInfo = {
    instapay:       { label: 'Instapay',        detail: 'ID: bellacrostaeg'  },
    vodafone_cash:  { label: 'Vodafone Cash',   detail: '01098765432'        },
  }

  // ── Checkout form ──
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/cart" className="inline-flex items-center gap-2 text-primary hover:underline text-sm mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to cart
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">

            {/* Delivery details */}
            <section className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold text-foreground mb-4">📍 Delivery Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-secondary-foreground block mb-1.5">Full Name *</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ahmed Hassan" required className="field" />
                </div>
                <div>
                  <label className="text-xs font-medium text-secondary-foreground block mb-1.5">Phone *</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="01012345678" required className="field" />
                </div>
                <div>
                  <label className="text-xs font-medium text-secondary-foreground block mb-1.5">Alternative Phone</label>
                  <input value={altPhone} onChange={e => setAltPhone(e.target.value)} placeholder="Optional" className="field" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-secondary-foreground block mb-1.5">Detailed Address *</label>
                  <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, building, floor, apartment…" required className="field" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-secondary-foreground block mb-1.5">Delivery Notes</label>
                  <textarea
                    value={deliveryNotes}
                    onChange={e => setDeliveryNotes(e.target.value)}
                    placeholder="Any special instructions…"
                    rows={2}
                    className="w-full px-4 py-2.5 border border-border rounded-xl bg-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none font-sans"
                  />
                </div>
              </div>
            </section>

            {/* Payment method */}
            <section className="bg-card border border-border rounded-xl p-5">
              <h2 className="font-semibold text-foreground mb-4">💳 Payment Method</h2>
              <div className="flex gap-3 flex-wrap mb-4">
                {(['instapay', 'vodafone_cash'] as const).map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`flex-1 min-w-[140px] py-3 rounded-xl border text-sm font-medium transition capitalize ${
                      paymentMethod === method
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-input text-muted-foreground hover:text-foreground hover:border-border/60'
                    }`}
                  >
                    {method === 'instapay' ? '🔵 Instapay' : '🔴 Vodafone Cash'}
                  </button>
                ))}
              </div>

              {/* Instructions */}
              <div className="bg-primary/8 border border-primary/20 rounded-xl p-4 mb-4">
                <p className="text-xs text-muted-foreground mb-1">Send <strong className="text-primary">${totalPrice.toFixed(2)}</strong> to:</p>
                <p className="font-semibold text-foreground text-sm">{paymentInfo[paymentMethod].label}</p>
                <p className="text-sm text-secondary-foreground font-mono">{paymentInfo[paymentMethod].detail}</p>
              </div>

              {/* Proof upload */}
              <label className="text-xs font-medium text-secondary-foreground block mb-2">
                Upload Payment Screenshot *
              </label>
              {proofImage ? (
                <div className="relative">
                  <img src={proofImage} alt="Payment proof" className="max-h-40 rounded-xl border border-border object-contain" />
                  <button
                    type="button"
                    onClick={() => setProofImage(null)}
                    className="absolute top-2 right-2 p-1.5 bg-card border border-border rounded-lg hover:bg-muted transition"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 border-2 border-dashed border-border rounded-xl py-8 cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-7 h-7 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to upload screenshot</span>
                  <span className="text-xs text-muted-foreground/60">PNG, JPG up to 5MB</span>
                  <input type="file" accept="image/*" onChange={handleProof} className="hidden" />
                </label>
              )}
            </section>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary hover:bg-accent text-primary-foreground font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isPending ? 'Placing Order…' : `Confirm Order — $${totalPrice.toFixed(2)}`}
            </button>
          </div>

          {/* Order summary */}
          <OrderSummaryCard items={items} total={totalPrice} />
        </div>
      </div>

      <style jsx>{`
        .field {
          width: 100%;
          padding: 10px 16px;
          border: 1px solid hsl(var(--border));
          border-radius: 12px;
          background: hsl(var(--input));
          color: hsl(var(--foreground));
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: box-shadow 0.2s;
        }
        .field:focus {
          box-shadow: 0 0 0 2px hsl(var(--ring));
        }
        .field::placeholder {
          color: hsl(var(--muted-foreground));
        }
      `}</style>
    </div>
  )
}

function OrderSummaryCard({ items, total }: { items: any[]; total: number }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 h-fit sticky top-20">
      <h3 className="font-semibold text-foreground mb-4">Order Summary</h3>
      <div className="space-y-2.5 mb-4">
        {items.map(item => (
          <div key={item.productId} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.name} × {item.quantity}</span>
            <span className="text-foreground font-medium">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-border pt-4 flex justify-between font-bold text-lg">
        <span className="text-foreground">Total</span>
        <span className="text-primary">${total.toFixed(2)}</span>
      </div>
    </div>
  )
}