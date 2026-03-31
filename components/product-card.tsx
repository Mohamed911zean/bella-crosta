'use client'

import { useState } from 'react'
import { useCart } from '@/lib/cart-context'
import { ShoppingCart, Plus, Minus } from 'lucide-react'

interface ProductCardProps {
  id: string
  name: string
  description: string
  price: number
  image_url?: string
  is_available: boolean
  inventory?: Array<{ quantity_in_stock: number }>
}

export function ProductCard({
  id,
  name,
  description,
  price,
  image_url,
  is_available,
  inventory,
}: ProductCardProps) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const inStock = inventory?.[0]?.quantity_in_stock ?? 0
  const isOutOfStock = inStock === 0 || !is_available

  const handleAddToCart = () => {
    addItem({
      productId: id,
      name,
      price,
      quantity,
      image_url,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="bg-card rounded-lg overflow-hidden border border-border hover:shadow-lg transition-shadow">
      {image_url ? (
        <img
          src={image_url}
          alt={name}
          className="w-full h-48 object-cover bg-muted"
        />
      ) : (
        <div className="w-full h-48 bg-muted flex items-center justify-center">
          <div className="text-muted-foreground text-sm">No image</div>
        </div>
      )}

      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-2">{name}</h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{description}</p>

        <div className="flex justify-between items-end">
          <div>
            <p className="text-2xl font-bold text-primary">${price.toFixed(2)}</p>
            {!isOutOfStock && (
              <p className="text-xs text-muted-foreground">
                {inStock} in stock
              </p>
            )}
          </div>
        </div>

        {isOutOfStock ? (
          <button
            disabled
            className="w-full mt-4 py-2 px-3 bg-muted text-muted-foreground rounded-lg font-medium cursor-not-allowed"
          >
            Out of Stock
          </button>
        ) : (
          <div className="flex gap-2 mt-4">
            <div className="flex items-center border border-border rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-1 hover:bg-muted transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(inStock, quantity + 1))}
                className="p-1 hover:bg-muted transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                added
                  ? 'bg-green-600 text-white'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              {added ? 'Added!' : 'Add'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
