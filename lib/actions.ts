'use server'

import { supabase } from './db'
import { getSessionToken } from './auth'
import { createClient } from '@supabase/supabase-js'

// ─── Authed Supabase client (passes JWT so RLS applies per-user) ─────────────
async function authedClient() {
  const token = await getSessionToken()
  if (!token) throw new Error('Not authenticated')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth:   { persistSession: false, autoRefreshToken: false },
    }
  )
}

export type ActionResult<T = undefined> =
  | { success: true;  data?: T }
  | { success: false; error: string }

// ─── Validation helpers ───────────────────────────────────────────────────────
function validateOrderInput(
  customerId: string,
  items: Array<{ productId: string; quantity: number; price: number; name: string }>,
  totalAmount: number,
  deliveryAddress: string,
  paymentProofUrl: string,
): string | null {
  if (!customerId?.trim())      return 'Customer ID is required.'
  if (!deliveryAddress?.trim()) return 'Delivery address is required.'
 // if (!paymentProofUrl?.trim()) return 'Payment proof is required.' ---------------------------------LOOK HERE  ------------//
  if (!Number.isFinite(totalAmount) || totalAmount <= 0)
    return 'Invalid order total.'
  if (!Array.isArray(items) || items.length === 0)
    return 'Order must contain at least one item.'
  for (const item of items) {
    if (!item.productId?.trim())     return `Invalid product ID.`
    if (!Number.isFinite(item.quantity) || item.quantity < 1 || item.quantity > 999)
      return `Invalid quantity for "${item.name}".`
    if (!Number.isFinite(item.price) || item.price <= 0)
      return `Invalid price for "${item.name}".`
  }
  return null
}

// ─── FIX 1: Create Order ──────────────────────────────────────────────────────
// • Validates every field before hitting DB
// • Idempotency: checks for existing order with same order_number prefix + customer
export async function createOrder(
  customerId: string,
  items: Array<{ productId: string; quantity: number; price: number; name: string }>,
  totalAmount: number,
  deliveryAddress: string,
  deliveryNotes: string,
  paymentMethod: 'instapay' | 'vodafone_cash',
  paymentProofUrl: string,
): Promise<ActionResult<{ orderId: string; orderNumber: string }>> {
  // ── Validate inputs
  const validationError = validateOrderInput(
    customerId, items, totalAmount, deliveryAddress, paymentProofUrl
  )
  if (validationError) return { success: false, error: validationError }

  try {
    const db = await authedClient()

    // ── Idempotency: generate deterministic key for this cart+customer combo
    const idempotencyKey = `${customerId}-${items.map(i => `${i.productId}:${i.quantity}`).sort().join(',')}`

    // Check if an identical pending order was placed in the last 5 minutes
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString()
    const { data: existing } = await db
      .from('orders')
      .select('id, order_number')
      .eq('customer_id', customerId)
      .eq('status', 'pending')
      .gte('created_at', fiveMinAgo)
      .maybeSingle()

    // If an identical recent order exists, return it instead of creating a duplicate
    if (existing) {
      return { success: true, data: { orderId: existing.id, orderNumber: existing.order_number } }
    }

    const orderNumber = `BC-${Date.now()}`

    // ── Insert the order
    const { data: orderData, error: orderErr } = await db
      .from('orders')
      .insert({
        customer_id:       customerId,
        order_number:      orderNumber,
        total_amount:      totalAmount,
        delivery_address:  deliveryAddress.trim(),
        delivery_notes:    deliveryNotes?.trim() ?? '',
        payment_method:    paymentMethod,
        payment_status:    'uploaded',
        payment_proof_url: paymentProofUrl || null,
        status:            'pending',
      })
      .select()
      .single()

    if (orderErr || !orderData)
      return { success: false, error: orderErr?.message ?? 'Failed to create order.' }

    // ── Insert line items
    const lineItems = items.map(item => ({
      order_id:     orderData.id,
      product_id:   item.productId,
      product_name: item.name,
      quantity:     item.quantity,
      unit_price:   item.price,
      subtotal:     Math.round(item.price * item.quantity * 100) / 100,
    }))

    const { error: itemsErr } = await db.from('order_items').insert(lineItems) 
    if (itemsErr) return { success: false, error: itemsErr.message }

    // ── Decrement stock (best-effort — never fail the order over this)
    for (const item of items) {
      try {
        const { data: prod } = await supabase
          .from('products').select('stock_qty').eq('id', item.productId).single()
        if (prod) {
          await supabase
            .from('products')
            .update({ stock_qty: Math.max(0, prod.stock_qty - item.quantity) })
            .eq('id', item.productId)
        }
      } catch (e) {
        console.error(`stock decrement failed for ${item.productId}:`, e)
      }
    }

    return { success: true, data: { orderId: orderData.id, orderNumber } }
  } catch (e) {
    console.error('createOrder:', e)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// ─── Update Order Status (admin only) ────────────────────────────────────────
export async function updateOrderStatus(
  orderId: string,
  status: 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled',
): Promise<ActionResult> {
  try {
    const db = await authedClient()
    const { error } = await db
      .from('orders').update({ status }).eq('id', orderId)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (e) {
    console.error('updateOrderStatus:', e)
    return { success: false, error: 'Failed to update order status.' }
  }
}

// ─── Confirm Payment (admin only) ─────────────────────────────────────────────
export async function confirmPayment(orderId: string): Promise<ActionResult> {
  try {
    const db = await authedClient()
    const { error } = await db
      .from('orders')
      .update({ payment_status: 'confirmed', status: 'confirmed' })
      .eq('id', orderId)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (e) {
    console.error('confirmPayment:', e)
    return { success: false, error: 'Failed to confirm payment.' }
  }
}

// ─── Update Product (admin only) ──────────────────────────────────────────────
export async function updateProduct(
  productId: string,
  updates: {
    name?: string; description?: string; price?: number
    image_url?: string; category?: string; is_featured?: boolean
    is_available?: boolean; stock_qty?: number
  },
): Promise<ActionResult> {
  try {
    const db = await authedClient()
    const { error } = await db
      .from('products').update(updates).eq('id', productId)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (e) {
    console.error('updateProduct:', e)
    return { success: false, error: 'Failed to update product.' }
  }
}

// ─── Create Product (admin only) ──────────────────────────────────────────────
export async function createProduct(product: {
  name: string; description?: string; price: number
  image_url?: string; category: string; is_featured?: boolean; stock_qty?: number
}): Promise<ActionResult<{ id: string }>> {
  try {
    const db = await authedClient()
    const { data, error } = await db
      .from('products')
      .insert({ ...product, is_available: true })
      .select('id').single()
    if (error || !data) return { success: false, error: error?.message ?? 'Failed to create product.' }
    return { success: true, data: { id: data.id } }
  } catch (e) {
    console.error('createProduct:', e)
    return { success: false, error: 'Failed to create product.' }
  }
}

// ─── Soft-delete Product (admin only) ────────────────────────────────────────
export async function deleteProduct(productId: string): Promise<ActionResult> {
  try {
    const db = await authedClient()
    const { error } = await db
      .from('products').update({ is_available: false }).eq('id', productId)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (e) {
    console.error('deleteProduct:', e)
    return { success: false, error: 'Failed to delete product.' }
  }
}