-- Bella Crosta Database Schema
-- This script sets up all tables for the pizza restaurant ordering system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(100),
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory table (stock management)
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  quantity_in_stock INT NOT NULL DEFAULT 0,
  low_stock_threshold INT DEFAULT 5,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customers table (extends auth.users)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, preparing, ready, completed, cancelled
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, failed
  delivery_address TEXT,
  delivery_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order items (line items in each order)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments table (for manual bank transfer verification)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'bank_transfer', -- bank_transfer, cash, card
  bank_account VARCHAR(255),
  proof_image_url TEXT,
  proof_uploaded_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'staff', -- admin, manager, staff
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table (for Telegram notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type VARCHAR(50), -- order_received, payment_confirmed, order_ready, order_completed
  message TEXT,
  telegram_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_order ON notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);

-- Row Level Security (RLS)
-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories (public read)
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (TRUE);

-- RLS Policies for products (public read)
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (TRUE);

-- RLS Policies for inventory (admin read only)
CREATE POLICY "Inventory viewable by authenticated users" ON inventory FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for customers (users can see their own data)
CREATE POLICY "Users can view their own data" ON customers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON customers FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own data" ON customers FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for orders (users can see their own orders)
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Users can insert their own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- RLS Policies for order_items (users can see their own order items)
CREATE POLICY "Users can view their own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())
);

-- RLS Policies for payments (users can see their own, admins can see all)
CREATE POLICY "Users can view their own payments" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = payments.order_id AND orders.customer_id = auth.uid())
);
CREATE POLICY "Admins can view all payments" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid() AND admin_users.is_active = TRUE)
);

-- RLS Policies for admin_users (only allow view own profile)
CREATE POLICY "Admins can view their own profile" ON admin_users FOR SELECT USING (auth.uid() = id);

-- RLS Policies for notifications (admins only)
CREATE POLICY "Admins can view notifications" ON notifications FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid() AND admin_users.is_active = TRUE)
);

-- Insert some initial categories
INSERT INTO categories (name, description, icon, display_order) VALUES
('Pizzas', 'Classic and specialty pizzas', '🍕', 1),
('Appetizers', 'Starters and sides', '🥗', 2),
('Beverages', 'Drinks and beverages', '🥤', 3),
('Desserts', 'Sweet treats', '🍰', 4)
ON CONFLICT (name) DO NOTHING;

-- Insert some sample products
INSERT INTO products (name, description, price, category_id, is_featured) 
SELECT 
  'Margherita',
  'Classic Margherita with fresh mozzarella and basil',
  12.99,
  (SELECT id FROM categories WHERE name = 'Pizzas'),
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Margherita');

INSERT INTO products (name, description, price, category_id, is_featured) 
SELECT 
  'Pepperoni',
  'Loaded with pepperoni and mozzarella',
  13.99,
  (SELECT id FROM categories WHERE name = 'Pizzas'),
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Pepperoni');

INSERT INTO products (name, description, price, category_id) 
SELECT 
  'Vegetarian',
  'Fresh vegetables and cheese',
  11.99,
  (SELECT id FROM categories WHERE name = 'Pizzas')
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Vegetarian');

INSERT INTO products (name, description, price, category_id) 
SELECT 
  'Caesar Salad',
  'Fresh romaine with Caesar dressing',
  8.99,
  (SELECT id FROM categories WHERE name = 'Appetizers')
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Caesar Salad');

INSERT INTO products (name, description, price, category_id) 
SELECT 
  'Garlic Bread',
  'Crispy bread with garlic butter',
  4.99,
  (SELECT id FROM categories WHERE name = 'Appetizers')
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Garlic Bread');

INSERT INTO products (name, description, price, category_id) 
SELECT 
  'Coca Cola',
  'Cold refreshing cola drink',
  2.49,
  (SELECT id FROM categories WHERE name = 'Beverages')
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Coca Cola');

INSERT INTO products (name, description, price, category_id) 
SELECT 
  'Tiramisu',
  'Classic Italian dessert with mascarpone',
  6.99,
  (SELECT id FROM categories WHERE name = 'Desserts')
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Tiramisu');

-- Create inventory records for all products
INSERT INTO inventory (product_id, quantity_in_stock, low_stock_threshold)
SELECT id, 50, 5 FROM products
ON CONFLICT (product_id) DO NOTHING;
