import './globals.css'
import { Manrope, Epilogue } from 'next/font/google'
import { CartProvider } from '@/lib/cart-context'
import type { Metadata } from 'next'

const fontSans = Manrope({ subsets: ['latin'], variable: '--font-sans' })
const fontDisplay = Epilogue({ subsets: ['latin'], variable: '--font-display' })

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
    <html lang="en" className={`dark ${fontSans.variable} ${fontDisplay.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  )
}