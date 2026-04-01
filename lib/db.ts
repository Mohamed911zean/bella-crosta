import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string
  is_featured: boolean
  is_available: boolean
  stock_qty: number
  created_at: string
}

export interface Customer {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  alt_phone: string | null
  address: string | null
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
  created_at: string
}

export interface Order {
  id: string
  customer_id: string
  order_number: string
  status: 'pending' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled'
  total_amount: number
  delivery_address: string | null
  delivery_notes: string | null
  payment_method: 'instapay' | 'vodafone_cash'
  payment_status: 'pending' | 'uploaded' | 'confirmed'
  payment_proof_url: string | null
  created_at: string
  order_items?: OrderItem[]
  customers?: Customer
}

// ─── Products ─────────────────────────────────────────────────────────────────
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_available', true)
    .order('created_at', { ascending: false })

  if (error) { console.error('getProducts:', error.message); return [] }
  return data ?? []
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', category)
    .eq('is_available', true)
    .order('created_at', { ascending: false })

  if (error) { console.error('getProductsByCategory:', error.message); return [] }
  return data ?? []
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_featured', true)
    .eq('is_available', true)
    .order('created_at', { ascending: false })
    .limit(6)

  if (error) { console.error('getFeaturedProducts:', error.message); return [] }
  return data ?? []
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) { console.error('getProductById:', error.message); return null }
  return data
}

export async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) { console.error('getAllProducts:', error.message); return [] }
  return data ?? []
}

// ─── Orders ───────────────────────────────────────────────────────────────────
// Alias bc_order_items → order_items and bc_customers → customers
// so the rest of the app doesn't need to know the underlying table names.
export async function getOrderById(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items:bc_order_items(*),
      customers:bc_customers(*)
    `)
    .eq('id', orderId)
    .single()

  if (error) { console.error('getOrderById:', error.message); return null }
  return data
}

export async function getCustomerOrders(customerId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items:bc_order_items(*)
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (error) { console.error('getCustomerOrders:', error.message); return [] }
  return data ?? []
}

export async function getAllOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items:bc_order_items(*),
      customers:bc_customers(*)
    `)
    .order('created_at', { ascending: false })

  if (error) { console.error('getAllOrders:', error.message); return [] }
  return data ?? []
}

// ─── Customers ────────────────────────────────────────────────────────────────
export async function getAllCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) { console.error('getAllCustomers:', error.message); return [] }
  return data ?? []
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) { console.error('getCustomerById:', error.message); return null }
  return data
}

export async function getLowStockProducts(threshold = 10): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .lte('stock_qty', threshold)
    .eq('is_available', true)
    .order('stock_qty', { ascending: true })

  if (error) { console.error('getLowStockProducts:', error.message); return [] }
  return data ?? []
}