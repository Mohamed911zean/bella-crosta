'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AdminSidebar } from '@/components/admin-sidebar'
import { supabase } from '@/lib/db'
import { getOrderById } from '@/lib/db'
import { Menu, ArrowLeft, CheckCircle, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'

export default function AdminOrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [user, setUser] = useState<any>(null)
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push('/admin/login')
        return
      }

      const { data: adminData } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (!adminData) {
        router.push('/admin/login')
        return
      }

      setUser(currentUser)
      loadOrder()
    } catch (err) {
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const loadOrder = async () => {
    try {
      const orderData = await getOrderById(orderId)
      setOrder(orderData)
      setSelectedStatus(orderData?.status || '')
    } catch (err) {
      console.error('Error loading order:', err)
    }
  }

  const updateOrderStatus = async () => {
    if (!selectedStatus || selectedStatus === order.status) return

    setUpdatingStatus(true)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: selectedStatus })
        .eq('id', orderId)

      if (error) throw error

      await loadOrder()
    } catch (err) {
      console.error('Error updating status:', err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const confirmPayment = async () => {
    if (!order.payments?.[0]) return

    setUpdatingStatus(true)
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'confirmed',
          verified_at: new Date().toISOString(),
          verified_by: user.id,
        })
        .eq('id', order.payments[0].id)

      if (error) throw error

      // Update order payment status
      await supabase
        .from('orders')
        .update({ payment_status: 'confirmed' })
        .eq('id', orderId)

      await loadOrder()
    } catch (err) {
      console.error('Error confirming payment:', err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex h-screen bg-background">
        <div className="hidden md:block w-64">
          <AdminSidebar />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Order not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64">
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <AdminSidebar mobile onClose={() => setMobileMenuOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/orders"
              className="text-primary hover:underline flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Orders</span>
            </Link>
            <h1 className="text-2xl font-bold">{order.order_number}</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-w-4xl">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Summary */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Amount</span>
                    <span className="font-semibold">${order.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Date</span>
                    <span>{new Date(order.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Items</h2>
                <div className="space-y-3">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between pb-3 border-b border-border last:border-b-0">
                      <div>
                        <p className="font-medium">{item.products?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${item.subtotal.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          ${item.unit_price.toFixed(2)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Info */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Delivery Information</h2>
                <p className="text-muted-foreground mb-1">Address</p>
                <p className="font-medium mb-4">{order.delivery_address}</p>
                {order.delivery_notes && (
                  <>
                    <p className="text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{order.delivery_notes}</p>
                  </>
                )}
              </div>

              {/* Customer Info */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Customer Information</h2>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Name</p>
                    <p className="font-medium">{order.customers?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Email</p>
                    <p className="font-medium">{order.customers?.email}</p>
                  </div>
                  {order.customers?.phone && (
                    <div>
                      <p className="text-muted-foreground mb-1">Phone</p>
                      <p className="font-medium">{order.customers.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Order Status */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-bold mb-4">Order Status</h3>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={updateOrderStatus}
                  disabled={updatingStatus || selectedStatus === order.status}
                  className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50"
                >
                  Update Status
                </button>
              </div>

              {/* Payment Section */}
              {order.payments?.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="font-bold mb-4">Payment</h3>
                  <div className="space-y-3 text-sm mb-4">
                    <div>
                      <p className="text-muted-foreground mb-1">Status</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        order.payments[0]?.status === 'confirmed'
                          ? 'bg-green-500/20 text-green-700'
                          : 'bg-yellow-500/20 text-yellow-700'
                      }`}>
                        {order.payments[0]?.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Amount</p>
                      <p className="font-semibold">${order.payments[0]?.amount.toFixed(2)}</p>
                    </div>
                    {order.payments[0]?.proof_image_url && (
                      <div>
                        <p className="text-muted-foreground mb-1">Proof</p>
                        <a
                          href={order.payments[0].proof_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs flex items-center gap-1"
                        >
                          <ImageIcon className="w-3 h-3" />
                          View Proof
                        </a>
                      </div>
                    )}
                  </div>

                  {order.payments[0]?.status !== 'confirmed' && (
                    <button
                      onClick={confirmPayment}
                      disabled={updatingStatus}
                      className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Confirm Payment
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
