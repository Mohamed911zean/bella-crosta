'use server'

import { supabase } from './db'
import { getSessionToken } from './auth'
import { createClient } from '@supabase/supabase-js'

// Authed client — uses the session cookie token so RLS applies correctly
async function getAuthedClient() {
  const token = await getSessionToken()
  if (!token) throw new Error('Not authenticated')

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  )
}

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string }

// ─── Create Order ─────────────────────────────────────────────────────────────
export async function createOrder(
  customerId: string,
  items: Array<{ productId: string; quantity: number; price: number; name: string }>,
  totalAmount: number,
  deliveryAddress: string,
  deliveryNotes: string,
  paymentMethod: 'instapay' | 'vodafone_cash',
  paymentProofUrl: string
): Promise<ActionResult<{ orderId: string; orderNumber: string }>> {
  try {
    const db = await getAuthedClient()
    const orderNumber = `BC-${Date.now()}`

    // 1. Create the order
    const { data: orderData, error: orderError } = await db
      .from('bc_orders')
      .insert({
        customer_id: customerId,
        order_number: orderNumber,
        total_amount: totalAmount,
        delivery_address: deliveryAddress,
        delivery_notes: deliveryNotes || '',
        payment_method: paymentMethod,
        payment_status: 'uploaded',
        payment_proof_url: paymentProofUrl,
        status: 'pending',
      })
      .select()
      .single()

    if (orderError || !orderData) {
      return { success: false, error: orderError?.message ?? 'Failed to create order' }
    }

    // 2. Insert line items
    const { error: itemsError } = await db
      .from('bc_order_items')
      .insert(
        items.map(item => ({
          order_id: orderData.id,
          product_id: item.productId,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.price * item.quantity,
        }))
      )

    if (itemsError) {
      return { success: false, error: itemsError.message }
    }

    // 3. Decrement stock (best-effort, don't fail the order if this errors)
    for (const item of items) {
      const { data: product } = await supabase
        .from('bc_products')
        .select('stock_qty')
        .eq('id', item.productId)
        .single()

      if (product) {
        await supabase
          .from('bc_products')
          .update({ stock_qty: Math.max(0, product.stock_qty - item.quantity) })
          .eq('id', item.productId)
      }
    }

    return { success: true, data: { orderId: orderData.id, orderNumber } }
  } catch (err) {
    console.error('createOrder error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// ─── Update Order Status (admin) ──────────────────────────────────────────────
export async function updateOrderStatus(
  orderId: string,
  status: 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled'
): Promise<ActionResult> {
  try {
    const db = await getAuthedClient()
    const { error } = await db
      .from('bc_orders')
      .update({ status })
      .eq('id', orderId)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    console.error('updateOrderStatus error:', err)
    return { success: false, error: 'Failed to update order status.' }
  }
}

// ─── Confirm Payment (admin) ──────────────────────────────────────────────────
// Payment proof is stored directly on bc_orders (payment_proof_url, payment_status).
// Confirming just flips payment_status → 'confirmed' and status → 'confirmed'.
export async function confirmPayment(orderId: string): Promise<ActionResult> {
  try {
    const db = await getAuthedClient()
    const { error } = await db
      .from('bc_orders')
      .update({ payment_status: 'confirmed', status: 'confirmed' })
      .eq('id', orderId)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    console.error('confirmPayment error:', err)
    return { success: false, error: 'Failed to confirm payment.' }
  }
}

// ─── Update Product (admin) ───────────────────────────────────────────────────
export async function updateProduct(
  productId: string,
  updates: {
    name?: string
    description?: string
    price?: number
    image_url?: string
    category?: string
    is_featured?: boolean
    is_available?: boolean
    stock_qty?: number
  }
): Promise<ActionResult> {
  try {
    const db = await getAuthedClient()
    const { error } = await db
      .from('bc_products')
      .update(updates)
      .eq('id', productId)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    console.error('updateProduct error:', err)
    return { success: false, error: 'Failed to update product.' }
  }
}

// ─── Create Product (admin) ───────────────────────────────────────────────────
export async function createProduct(product: {
  name: string
  description?: string
  price: number
  image_url?: string
  category: string
  is_featured?: boolean
  stock_qty?: number
}): Promise<ActionResult<{ id: string }>> {
  try {
    const db = await getAuthedClient()
    const { data, error } = await db
      .from('bc_products')
      .insert({ ...product, is_available: true })
      .select('id')
      .single()

    if (error || !data) return { success: false, error: error?.message ?? 'Failed to create product' }
    return { success: true, data: { id: data.id } }
  } catch (err) {
    console.error('createProduct error:', err)
    return { success: false, error: 'Failed to create product.' }
  }
}

// ─── Delete Product (admin — soft delete) ────────────────────────────────────
export async function deleteProduct(productId: string): Promise<ActionResult> {
  try {
    const db = await getAuthedClient()
    const { error } = await db
      .from('bc_products')
      .update({ is_available: false })
      .eq('id', productId)

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    console.error('deleteProduct error:', err)
    return { success: false, error: 'Failed to delete product.' }
  }
}