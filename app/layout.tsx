import './globals.css'
import { CartProvider } from '@/lib/cart-context'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bella Crosta — Premium Pizza Delivery',
  description: 'Authentic Italian pizzas delivered fresh to your door',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  )
}
