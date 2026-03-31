'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { AuthForm } from '@/components/auth-form'
import { useCart } from '@/lib/cart-context'
import { supabase } from '@/lib/db'
import { createOrder } from '@/lib/actions'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalPrice, clearCart } = useCart()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      setUser(currentUser)

      if (currentUser) {
        // Load customer details
        const { data: customerData } = await supabase
          .from('customers')
          .select('*')
          .eq('id', currentUser.id)
          .single()

        if (customerData) {
          setFullName(customerData.full_name || '')
          setEmail(customerData.email || '')
          setPhone(customerData.phone || '')
          setAddress(customerData.address || '')
          setCity(customerData.city || '')
          setPostalCode(customerData.postal_code || '')
        } else {
          setEmail(currentUser.email || '')
        }
      }
    } catch (err) {
      console.error('Error checking auth:', err)
    } finally {
      setCheckingAuth(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Cart is Empty</h1>
            <p className="text-muted-foreground mb-8">
              Add items to your cart before checking out.
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Menu
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (!user) {
        setError('Please log in first')
        setShowAuth(true)
        return
      }

      // Validate form
      if (!fullName || !address || !city) {
        setError('Please fill in all required fields')
        return
      }

      // Create order
      const orderItems = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      }))

      const result = await createOrder(
        user.id,
        orderItems,
        totalPrice,
        `${address}, ${city} ${postalCode}`,
        deliveryNotes
      )

      if (!result.success) {
        setError(result.error || 'Failed to create order')
        return
      }

      // Update customer details
      await supabase.from('customers').update({
        full_name: fullName,
        phone,
        address,
        city,
        postal_code: postalCode,
      }).eq('id', user.id)

      clearCart()
      router.push(`/order/${result.orderId}`)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 text-primary hover:underline mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Cart
            </Link>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Create an Account</h1>
                <p className="text-muted-foreground">
                  Sign up or log in to proceed with your order
                </p>
              </div>
              <AuthForm
                mode="signup"
                onSuccess={() => {
                  checkAuthStatus()
                  setShowAuth(false)
                }}
              />
            </div>
            {/* Order Summary */}
            <div className="bg-card border border-border rounded-lg p-6 h-fit">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-primary hover:underline mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold mb-8">Delivery Information</h1>

            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-2">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-4 py-2 border border-border rounded-lg bg-muted text-muted-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">City *</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="New York"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Address *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main Street"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Postal Code</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="10001"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Delivery Notes</label>
                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Any special instructions for delivery..."
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Continue to Payment
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-card border border-border rounded-lg p-6 h-fit sticky top-20">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
