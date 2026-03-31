import type { Metadata } from 'next'
import { Manrope, Epilogue, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/lib/cart-context'
import './globals.css'

const fontSans = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const fontDisplay = Epilogue({ subsets: ["latin"], variable: "--font-display" });
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: 'Bella Crosta - Premium Pizza Delivery & Online Ordering',
  description: 'Order authentic Italian pizzas online. Fresh ingredients, fast delivery, and delicious taste. Experience the flavor of Italy delivered to your door.',
  keywords: 'pizza delivery, italian pizza, food delivery, pizza restaurant, online ordering',
  generator: 'v0.app',
  openGraph: {
    title: 'Bella Crosta - Premium Pizza Delivery',
    description: 'Order authentic Italian pizzas online. Fresh delivery guaranteed.',
    type: 'website',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} font-sans antialiased`}>
        <CartProvider>
          {children}
          <Analytics />
        </CartProvider>
      </body>
    </html>
  )
}
