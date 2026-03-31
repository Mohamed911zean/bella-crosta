'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/admin-sidebar'
import { supabase } from '@/lib/db'
import { Menu, CheckCircle, Clock, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'

export default function AdminPaymentsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('pending')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

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
      loadPayments()
    } catch (err) {
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const loadPayments = async () => {
    try {
      const { data } = await supabase
        .from('payments')
        .select('*, orders(order_number, total_amount, customers(full_name, email))')
        .order('created_at', { ascending: false })

      setPayments(data || [])
    } catch (err) {
      console.error('Error loading payments:', err)
    }
  }

  const confirmPayment = async (paymentId: string) => {
    setConfirmingId(paymentId)
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'confirmed',
          verified_at: new Date().toISOString(),
          verified_by: user.id,
        })
        .eq('id', paymentId)

      if (error) throw error

      // Get the order ID and update its payment status
      const payment = payments.find((p) => p.id === paymentId)
      if (payment) {
        await supabase
          .from('orders')
          .update({ payment_status: 'confirmed' })
          .eq('id', payment.order_id)
      }

      await loadPayments()
    } catch (err) {
      console.error('Error confirming payment:', err)
    } finally {
      setConfirmingId(null)
    }
  }

  const filteredPayments = payments.filter((payment) => {
    if (filterStatus === 'all') return true
    return payment.status === filterStatus
  })

  const statuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'all', label: 'All' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const pendingCount = payments.filter((p) => p.status === 'pending').length
  const confirmedCount = payments.filter((p) => p.status === 'confirmed').length
  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0)

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
          <h1 className="text-2xl font-bold">Payments</h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Pending Payments</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Confirmed Payments</p>
              <p className="text-3xl font-bold text-green-600">{confirmedCount}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-primary">
                ${totalAmount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-2">
            {statuses.map((status) => (
              <button
                key={status.value}
                onClick={() => setFilterStatus(status.value)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterStatus === status.value
                    ? 'bg-primary text-white'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>

          {/* Payments Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 sm:px-6 py-3 font-semibold">Order</th>
                    <th className="text-left px-4 sm:px-6 py-3 font-semibold">Customer</th>
                    <th className="text-left px-4 sm:px-6 py-3 font-semibold">Amount</th>
                    <th className="text-left px-4 sm:px-6 py-3 font-semibold">Status</th>
                    <th className="text-left px-4 sm:px-6 py-3 font-semibold">Proof</th>
                    <th className="text-left px-4 sm:px-6 py-3 font-semibold">Date</th>
                    <th className="text-center px-4 sm:px-6 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-border hover:bg-muted/50 transition">
                      <td className="px-4 sm:px-6 py-3 font-medium">
                        <Link
                          href={`/admin/orders/${payment.order_id}`}
                          className="text-primary hover:underline"
                        >
                          {payment.orders?.order_number}
                        </Link>
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <div>
                          <p className="font-medium text-sm">
                            {payment.orders?.customers?.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payment.orders?.customers?.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 font-semibold">
                        ${payment.amount.toFixed(2)}
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          payment.status === 'confirmed'
                            ? 'bg-green-500/20 text-green-700'
                            : payment.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-700'
                            : 'bg-destructive/20 text-destructive'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3">
                        {payment.proof_image_url ? (
                          <a
                            href={payment.proof_image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-xs flex items-center gap-1 w-fit"
                          >
                            <ImageIcon className="w-3 h-3" />
                            View
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">No proof</span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-xs text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-center">
                        {payment.status === 'pending' ? (
                          <button
                            onClick={() => confirmPayment(payment.id)}
                            disabled={confirmingId === payment.id}
                            className="text-xs font-medium text-green-600 hover:underline disabled:opacity-50 flex items-center gap-1 w-fit mx-auto"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Confirm
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {payment.status === 'confirmed' ? 'Confirmed' : 'Rejected'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredPayments.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No payments found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
