'use server'

import { AdminSidebar } from '@/components/admin-sidebar'
import { getAllOrders } from '@/lib/db'
import type { Order } from '@/lib/db'
import { Menu, TrendingUp, ShoppingCart, CreditCard, Package } from 'lucide-react'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import AdminDashboardClient from './client'

export default async function AdminDashboard() {
  await requireAdmin()
  const orders = await getAllOrders()

  return <AdminDashboardClient orders={orders} />
}
