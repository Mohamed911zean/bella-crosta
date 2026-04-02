'use client'

import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/admin-sidebar'
import { getAllOrders, getAllProducts } from '@/lib/db'
import type { Order, Product } from '@/lib/db'
import { Menu, Star, TrendingUp, DollarSign, ShoppingBag, Calendar } from 'lucide-react'

type Period = 'all' | '7d' | '30d' | '30d_prev'

export default function BestSellersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [mobile, setMobile] = useState(false)
  const [period, setPeriod] = useState<Period>('all')

  useEffect(() => {
    Promise.all([getAllOrders(), getAllProducts()]).then(([o, p]) => {
      setOrders(o)
      setProducts(p)
      setLoading(false)
    })
  }, [])

  const filterOrdersByPeriod = (orders: Order[], period: Period) => {
    if (period === 'all') return orders
    
    const now = new Date()
    const days = period === '7d' ? 7 : 30
    const threshold = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    
    return orders.filter(o => new Date(o.created_at) >= threshold)
  }

  const analyzeStats = () => {
    const filteredOrders = filterOrdersByPeriod(orders, period)
    const statsMap = new Map<string, { id: string, name: string, qty: number, revenue: number }>()

    filteredOrders.forEach(order => {
      order.order_items?.forEach(item => {
        if (!item.product_id) return
        const existing = statsMap.get(item.product_id) || { id: item.product_id, name: item.product_name, qty: 0, revenue: 0 }
        existing.qty += item.quantity
        existing.revenue += Number(item.subtotal)
        statsMap.set(item.product_id, existing)
      })
    })

    return Array.from(statsMap.values()).sort((a, b) => b.qty - a.qty)
  }

  const stats = analyzeStats()
  const topStats = stats.slice(0, 4)
  const totalRevenue = stats.reduce((sum, s) => sum + s.revenue, 0)
  const totalQty = stats.reduce((sum, s) => sum + s.qty, 0)

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:block w-64 shrink-0"><AdminSidebar /></div>
      {mobile && <AdminSidebar mobile onClose={() => setMobile(false)} />}

      <div className="flex-1 overflow-auto">
        <div className="bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Best Sellers & Analytics</h1>
          </div>
          <button onClick={() => setMobile(true)} className="md:hidden p-2 hover:bg-muted rounded-lg"><Menu className="w-5 h-5" /></button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Filters */}
          <div className="flex items-center gap-2 mb-8 bg-card border border-border p-1 rounded-2xl w-fit shadow-sm">
            {[
              { id: 'all', label: 'All Time' },
              { id: '30d', label: 'Last 30 Days' },
              { id: '7d', label: 'Last 7 Days' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as Period)}
                className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                  period === p.id 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="p-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Calculating statistics...
            </div>
          ) : (
            <div className="space-y-8">
              {/* Top Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-green-500/10 rounded-2xl text-green-500">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Period Revenue</p>
                      <p className="text-2xl font-black text-foreground">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Items Sold</p>
                      <p className="text-2xl font-black text-foreground">{totalQty.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Orders Analyzed</p>
                      <p className="text-2xl font-black text-foreground">{filterOrdersByPeriod(orders, period).length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ranking Table */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
                  <h2 className="font-bold text-sm uppercase tracking-widest">Product Sales Ranking</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest w-16">Rank</th>
                        <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Product Name</th>
                        <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Quantity Sold</th>
                        <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Revenue</th>
                        <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Rev. Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.map((s, idx) => {
                        const share = (s.revenue / totalRevenue) * 100
                        return (
                          <tr key={s.id} className="border-b border-border hover:bg-muted/30 transition">
                            <td className="px-6 py-4">
                              <span className={`flex items-center justify-center w-8 h-8 rounded-full font-black text-xs ${
                                idx === 0 ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/20' : 
                                idx === 1 ? 'bg-slate-300 text-slate-700' :
                                idx === 2 ? 'bg-amber-600 text-white' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {idx + 1}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-foreground">{s.name}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-foreground">{s.qty}</span>
                                <div className="flex-1 h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary" 
                                    style={{ width: `${(s.qty / stats[0].qty) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-black text-foreground">
                              ${s.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-bold px-2 py-1 bg-primary/10 text-primary rounded-lg border border-primary/20">
                                {share.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
