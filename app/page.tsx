import Link from 'next/link'
import { Header } from '@/components/header'
import { ProductCard } from '@/components/product-card'
import { getFeaturedProducts, getCategories } from '@/lib/db'
import { ArrowRight, Clock, Truck, Shield } from 'lucide-react'

export const metadata = {
  title: 'Bella Crosta - Premium Pizza Delivery',
  description: 'Authentic Italian pizzas delivered fresh to your door',
}

export default async function Home() {
  const featured = await getFeaturedProducts()
  const categories = await getCategories()

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Authentic Italian Pizzas
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Crafted with premium ingredients and delivered fresh to your door. Experience the taste of Italy.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition"
              >
                Order Now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#featured"
                className="inline-flex items-center gap-2 border border-primary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary/10 transition"
              >
                View Featured
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Fast Delivery</h3>
              <p className="text-muted-foreground">
                Hot and fresh pizzas delivered within 30 minutes
              </p>
            </div>
            <div className="text-center">
              <Truck className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Free Delivery</h3>
              <p className="text-muted-foreground">
                Free delivery on orders over $50
              </p>
            </div>
            <div className="text-center">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Quality Guaranteed</h3>
              <p className="text-muted-foreground">
                100% satisfaction guaranteed or your money back
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="bg-background border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="text-3xl font-bold mb-8">Categories</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/menu?category=${category.id}`}
                  className="p-4 bg-card border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition text-center"
                >
                  <div className="text-3xl mb-2">{category.icon || '🍕'}</div>
                  <h3 className="font-semibold">{category.name}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      {featured.length > 0 && (
        <section id="featured" className="bg-background border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="text-3xl font-bold mb-8">Featured Pizzas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition"
              >
                View All Menu
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-muted border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-muted-foreground text-sm">
            <p>&copy; 2024 Bella Crosta. All rights reserved.</p>
            <p className="mt-2">Authentic Italian pizzas delivered fresh</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
