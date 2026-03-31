'use server'

import { supabase } from './db'
import { notifyNewOrder, notifyPaymentReceived } from './telegram'
import { getOrderById } from './db'

// Auth Actions
export async function signUp(email: string, password: string, fullName: string) {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: 'User creation failed' }
    }

    // Create customer profile
    const { error: profileError } = await supabase
      .from('customers')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
      })

    if (profileError) {
      return { success: false, error: profileError.message }
    }

    return { success: true, user: authData.user }
  } catch (error) {
    return { success: false, error: 'An error occurred' }
  }
}

// Order Actions
export async function createOrder(
  customerId: string,
  items: Array<{ productId: string; quantity: number; price: number }>,
  totalAmount: number,
  deliveryAddress: string,
  deliveryNotes?: string
) {
  try {
    // Generate order number
    const orderNumber = `ORD-${Date.now()}`

    // Create order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customerId,
        order_number: orderNumber,
        total_amount: totalAmount,
        delivery_address: deliveryAddress,
        delivery_notes: deliveryNotes || '',
        status: 'pending',
        payment_status: 'pending',
      })
      .select()
      .single()

    if (orderError) {
      return { success: false, error: orderError.message }
    }

    if (!orderData) {
      return { success: false, error: 'Failed to create order' }
    }

    // Create order items
    const orderItems = items.map((item) => ({
      order_id: orderData.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.price * item.quantity,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      return { success: false, error: itemsError.message }
    }

    // Deduct inventory
    for (const item of items) {
      const { data: inventory } = await supabase
        .from('inventory')
        .select('quantity_in_stock')
        .eq('product_id', item.productId)
        .single()

      if (inventory) {
        await supabase
          .from('inventory')
          .update({
            quantity_in_stock: Math.max(0, inventory.quantity_in_stock - item.quantity),
          })
          .eq('product_id', item.productId)
      }
    }

    // Get customer details for notification
    const { data: customerData } = await supabase
      .from('customers')
      .select('full_name')
      .eq('id', customerId)
      .single()

    // Get product names for notification
    const itemNames = await Promise.all(
      items.map(async (item) => {
        const { data } = await supabase
          .from('products')
          .select('name')
          .eq('id', item.productId)
          .single()
        return { name: data?.name || 'Unknown', quantity: item.quantity }
      })
    )

    // Send Telegram notification
    await notifyNewOrder({
      orderNumber,
      customerName: customerData?.full_name || 'Customer',
      totalAmount,
      items: itemNames,
      deliveryAddress,
    })

    return { success: true, orderId: orderData.id, orderNumber }
  } catch (error) {
    return { success: false, error: 'An error occurred while creating the order' }
  }
}

// Payment Actions
export async function uploadPaymentProof(
  orderId: string,
  proofImageUrl: string,
  amount: number
) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        amount,
        payment_method: 'bank_transfer',
        proof_image_url: proofImageUrl,
        proof_uploaded_at: new Date().toISOString(),
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Update order payment status
    await supabase
      .from('orders')
      .update({ payment_status: 'awaiting_confirmation' })
      .eq('id', orderId)

    // Get order details for notification
    const orderData = await getOrderById(orderId)
    if (orderData) {
      await notifyPaymentReceived({
        orderNumber: orderData.order_number,
        customerName: orderData.customers?.full_name || 'Customer',
        totalAmount: orderData.total_amount,
      })
    }

    return { success: true, paymentId: data.id }
  } catch (error) {
    return { success: false, error: 'An error occurred while uploading payment proof' }
  }
}
