'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Header } from '@/components/header'
import { getOrderById } from '@/lib/db'
import { uploadPaymentProof } from '@/lib/actions'
import { Upload, CheckCircle, Clock, AlertCircle, Loader2, Copy } from 'lucide-react'

export default function OrderPage() {
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [proofImage, setProofImage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadOrder()
  }, [orderId])

  const loadOrder = async () => {
    try {
      const orderData = await getOrderById(orderId)
      setOrder(orderData)
    } catch (err) {
      setError('Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setProofImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadProof = async () => {
    if (!proofImage) {
      setError('Please select an image')
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      const result = await uploadPaymentProof(
        orderId,
        proofImage,
        order.total_amount
      )

      if (!result.success) {
        setError(result.error || 'Failed to upload proof')
        return
      }

      setSuccess('Payment proof uploaded successfully! Our team will verify it shortly.')
      setProofImage(null)
      loadOrder()
    } catch (err) {
      setError('An error occurred while uploading')
    } finally {
      setUploading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-4">Loading order...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Order Not Found</h1>
          <Link href="/" className="text-primary hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  const paymentStatus = order.payments?.[0]?.status || 'none'
  const paymentProof = order.payments?.[0]

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order Header */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Order Confirmed</h1>
              <p className="text-muted-foreground">Order #{order.order_number}</p>
            </div>
            <div className="text-right">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-primary">
                ${order.total_amount.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Order Status</p>
              <p className="text-lg font-semibold capitalize">{order.status}</p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Order Items</h2>
          <div className="space-y-3">
            {order.order_items?.map((item: any) => (
              <div key={item.id} className="flex justify-between pb-3 border-b border-border last:border-b-0">
                <div>
                  <p className="font-medium">{item.products?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Qty: {item.quantity} × ${item.unit_price.toFixed(2)}
                  </p>
                </div>
                <p className="font-semibold">${item.subtotal.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Info */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Delivery Information</h2>
          <p className="text-muted-foreground mb-1">Address</p>
          <p className="font-medium mb-4">{order.delivery_address}</p>
          {order.delivery_notes && (
            <>
              <p className="text-muted-foreground mb-1">Delivery Notes</p>
              <p className="text-sm mb-4">{order.delivery_notes}</p>
            </>
          )}
        </div>

        {/* Payment Section */}
        {paymentStatus === 'none' && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-6 mb-8">
            <div className="flex gap-3 mb-4">
              <Clock className="w-6 h-6 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">Payment Required</h3>
                <p className="text-sm text-muted-foreground">
                  Please complete the payment to confirm your order
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-950 p-4 rounded-lg mb-6">
              <p className="text-sm text-muted-foreground mb-2">Bank Transfer To:</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 hover:bg-muted rounded">
                  <div>
                    <p className="font-mono font-semibold">Bank Name: PT. Bella Crosta</p>
                    <p className="text-xs text-muted-foreground">Account: 123-456-789-0</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard('123-456-789-0')}
                    className="p-2 hover:bg-muted rounded transition"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {copied && <p className="text-xs text-green-600 mt-2">Copied to clipboard!</p>}
            </div>

            {/* Payment Proof Upload */}
            <div>
              <h4 className="font-semibold mb-3">Upload Payment Proof</h4>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center mb-4">
                {proofImage ? (
                  <div>
                    <img
                      src={proofImage}
                      alt="Payment proof"
                      className="max-h-48 mx-auto mb-4 rounded"
                    />
                    <p className="text-sm text-muted-foreground">
                      Screenshot or photo of transfer confirmation
                    </p>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="font-medium mb-1">Click to upload</p>
                    <p className="text-sm text-muted-foreground">
                      PNG, JPG up to 10MB
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              <button
                onClick={handleUploadProof}
                disabled={!proofImage || uploading}
                className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                Upload Payment Proof
              </button>
            </div>
          </div>
        )}

        {paymentStatus === 'pending' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-8">
            <div className="flex gap-3">
              <Clock className="w-6 h-6 text-yellow-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">Payment Verification Pending</h3>
                <p className="text-sm text-muted-foreground">
                  We&apos;ve received your payment proof. Our team is verifying it.
                </p>
              </div>
            </div>
          </div>
        )}

        {paymentStatus === 'confirmed' && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 mb-8">
            <div className="flex gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">Payment Confirmed</h3>
                <p className="text-sm text-muted-foreground">
                  Your order is confirmed and will be prepared soon.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link
            href="/menu"
            className="flex-1 bg-muted text-foreground py-2 rounded-lg font-medium hover:bg-muted/80 transition text-center"
          >
            Continue Shopping
          </Link>
          <Link
            href="/"
            className="flex-1 border border-primary text-primary py-2 rounded-lg font-medium hover:bg-primary/10 transition text-center"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
