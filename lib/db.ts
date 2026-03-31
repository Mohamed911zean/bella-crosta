import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Categories
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }
  return data || []
}

// Products
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, inventory(*)')
    .eq('is_available', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }
  return data || []
}

export async function getProductsByCategory(categoryId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*, inventory(*)')
    .eq('category_id', categoryId)
    .eq('is_available', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products by category:', error)
    return []
  }
  return data || []
}

export async function getFeaturedProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, inventory(*)')
    .eq('is_featured', true)
    .eq('is_available', true)
    .order('created_at', { ascending: false })
    .limit(6)

  if (error) {
    console.error('Error fetching featured products:', error)
    return []
  }
  return data || []
}

export async function getProductById(productId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*, inventory(*)')
    .eq('id', productId)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }
  return data
}

// Orders
export async function getCustomerOrders(customerId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(*)), payments(*)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }
  return data || []
}

export async function getOrderById(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(*)), payments(*)')
    .eq('id', orderId)
    .single()

  if (error) {
    console.error('Error fetching order:', error)
    return null
  }
  return data
}

// Admin - All Orders
export async function getAllOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(*)), payments(*), customers(*)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all orders:', error)
    return []
  }
  return data || []
}

// Inventory
export async function getInventory(productId: string) {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('product_id', productId)
    .single()

  if (error) {
    console.error('Error fetching inventory:', error)
    return null
  }
  return data
}
