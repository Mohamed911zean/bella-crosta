import { createClient } from '@supabase/supabase-js'

const supabaseUrl : any = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey : any = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey : any = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase : any = createClient(supabaseUrl, supabaseAnonKey)

/** Admin client — uses service role key to bypass RLS for admin dashboard data. */
export function adminClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

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
  payments?: any[]
}

export interface RawMaterial {
  id: string
  name: string
  unit: string
  stock_qty: number
  low_stock_threshold: number
  created_at: string
}

export interface ProductIngredient {
  id: string
  product_id: string
  material_id: string
  quantity: number
  raw_materials?: RawMaterial
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
  const { data, error } = await adminClient()
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) { console.error('getAllProducts:', error.message); return [] }
  return data ?? []
}

// ─── Raw Materials & Inventory ──────────────────────────────────────────────
export async function getAllRawMaterials(): Promise<RawMaterial[]> {
  const { data, error } = await adminClient()
    .from('raw_materials')
    .select('*')
    .order('name', { ascending: true })

  if (error) { console.error('getAllRawMaterials:', error.message); return [] }
  return data ?? []
}

export async function getProductIngredients(productId: string): Promise<ProductIngredient[]> {
  const { data, error } = await adminClient()
    .from('product_ingredients')
    .select(`
      *,
      raw_materials(*)
    `)
    .eq('product_id', productId)

  if (error) { console.error('getProductIngredients:', error.message); return [] }
  return data ?? []
}

export async function getLowStockMaterials(threshold = 5): Promise<RawMaterial[]> {
  const { data, error } = await adminClient()
    .from('raw_materials')
    .select('*')
    .lte('stock_qty', threshold)
    .order('stock_qty', { ascending: true })

  if (error) { console.error('getLowStockMaterials:', error.message); return [] }
  return data ?? []
}

// Helper to map DB order structure with payments relation to the Order interface
 function mapOrder(data: any): Order | null {
   if (!data) return null
   const payment = data.payments?.[0]
   const items = data.order_items?.map((item: any) => ({
     ...item,
     product_name: item.product_name || (item.products as any)?.name || 'Unknown Product'
   }))
   return {
     ...data,
     order_items: items,
     payment_method: payment?.payment_method ?? 'instapay',
     payment_proof_url: payment?.proof_image_url ?? null,
   }
 }

// ─── Orders ───────────────────────────────────────────────────────────────────
export async function getOrderById(orderId: string): Promise<Order | null> {
  const { data, error } = await adminClient()
    .from('orders')
    .select(`
      *,
      order_items(*, products(name)),
      customers(*),
      payments(*)
    `)
    .eq('id', orderId)
    .single()

  if (error) { console.error('getOrderById:', error.message); return null }
  return mapOrder(data)
}

export async function getCustomerOrders(customerId: string): Promise<Order[]> {
  const { data, error } = await adminClient()
    .from('orders')
    .select(`
      *,
      order_items(*, products(name)),
      payments(*)
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (error) { console.error('getCustomerOrders:', error.message); return [] }
  return (data ?? []).map(mapOrder) as Order[]
}

export async function getAllOrders(): Promise<Order[]> {
  const { data, error } = await adminClient()
    .from('orders')
    .select(`
      *,
      order_items(*, products(name)),
      customers(*),
      payments(*)
    `)
    .order('created_at', { ascending: false })

  if (error) { console.error('getAllOrders:', error.message); return [] }
  return (data ?? []).map(mapOrder) as Order[]
}

// ─── Customers ────────────────────────────────────────────────────────────────
export async function getAllCustomers(): Promise<Customer[]> {
  const { data, error } = await adminClient()
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) { console.error('getAllCustomers:', error.message); return [] }
  return data ?? []
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const { data, error } = await adminClient()
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) { console.error('getCustomerById:', error.message); return null }
  return data
}

export async function getLowStockProducts(threshold = 10): Promise<Product[]> {
  const { data, error } = await adminClient()
    .from('products')
    .select('*')
    .lte('stock_qty', threshold)
    .eq('is_available', true)
    .order('stock_qty', { ascending: true })

  if (error) { console.error('getLowStockProducts:', error.message); return [] }
  return data ?? []
}