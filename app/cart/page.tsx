'use client'

import Link from 'next/link'
import { Header } from '@/components/header'
import { useCart } from '@/lib/cart-context'
import { Trash2, Plus, Minus, ArrowLeft } from 'lucide-react'

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
            <p className="text-muted-foreground mb-8">
              Add some delicious pizzas to get started!
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              {items.map((item, index) => (
                <div
                  key={item.productId}
                  className={`p-4 flex gap-4 ${index > 0 ? 'border-t border-border' : ''}`}
                >
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-lg bg-muted"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      ${item.price.toFixed(2)} per item
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="p-1 hover:bg-muted rounded transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-3 text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="p-1 hover:bg-muted rounded transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="mt-2 p-2 text-destructive hover:bg-destructive/10 rounded transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-card border border-border rounded-lg p-6 h-fit sticky top-20">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery</span>
                <span>Calculated at checkout</span>
              </div>
            </div>
            <div className="border-t border-border pt-4 mb-6">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition block text-center mb-3"
            >
              Proceed to Checkout
            </Link>

            <button
              onClick={() => clearCart()}
              className="w-full border border-border text-foreground py-2 rounded-lg font-medium hover:bg-muted transition"
            >
              Clear Cart
            </button>

            <Link
              href="/menu"
              className="w-full text-center mt-4 text-primary font-medium hover:underline"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
