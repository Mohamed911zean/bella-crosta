import { requireAdmin } from '@/lib/auth'
import { getAllOrders } from '@/lib/db'
import AdminDashboardClient from './client'

// Server component: auth guard runs on server — no redirect flash
export default async function AdminDashboard() {
  await requireAdmin()
  const orders = await getAllOrders()
  return <AdminDashboardClient orders={orders} />
}