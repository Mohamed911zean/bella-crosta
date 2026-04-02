'use client'

import { useState } from 'react'
import { useCart } from '@/lib/cart-context'
import type { Product } from '@/lib/db'
import { ShoppingCart, Plus, Minus, Check } from 'lucide-react'

interface ProductCardProps {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string
  is_available: boolean
  stock_qty: number
}

export function ProductCard({
  id,
  name,
  description,
  price,
  image_url,
  is_available,
  stock_qty,
  category,
}: ProductCardProps) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  // stock_qty lives directly on bc_products
  const isOutOfStock = !is_available || stock_qty === 0

  const handleAdd = () => {
    addItem({
      productId: id,
      name,
      price,
      quantity,
      image_url: image_url ?? undefined,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden group hover:border-border/60 transition-all duration-200">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-muted">
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🍕</div>
        )}
        {/* Category pill */}
        <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-full text-xs font-medium text-white capitalize">
          {category}
        </span>
        {/* Price pill */}
        <span className="absolute top-3 right-3 px-2.5 py-1 bg-primary rounded-full text-xs font-bold text-primary-foreground">
          ${Number(price).toFixed(2)}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-1.5 leading-snug">{name}</h3>

        {description && (
          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 mb-3">
            {description}
          </p>
        )}

        {/* Stock indicator */}
        {!isOutOfStock && stock_qty <= 10 && (
          <p className="text-yellow-400 text-xs mb-3 font-medium">
            Only {stock_qty} left
          </p>
        )}

        {isOutOfStock ? (
          <button
            disabled
            className="w-full py-2.5 bg-muted text-muted-foreground rounded-xl text-sm font-medium cursor-not-allowed"
          >
            Out of Stock
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {/* Qty selector */}
            <div className="flex items-center border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-2.5 py-2 hover:bg-muted transition text-foreground"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-3 py-2 text-sm font-semibold text-foreground min-w-[2rem] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(stock_qty, q + 1))}
                className="px-2.5 py-2 hover:bg-muted transition text-foreground"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Add to cart */}
            <button
              onClick={handleAdd}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                added
                  ? 'bg-green-600 text-white'
                  : 'bg-primary text-primary-foreground hover:bg-accent'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-4 h-4" />
                  Added
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Add
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}