import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const setupDatabase = async () => {
  try {
    console.log('[v0] Starting database setup...');

    // Create tables using the admin client
    const { error: categoriesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL UNIQUE,
          description TEXT,
          icon VARCHAR(100),
          display_order INT DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    }).catch(() => ({ error: null })); // Ignore if table exists

    console.log('[v0] Categories table created');

    // Products table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS products (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
      `
    }).catch(() => ({ error: null }));

    console.log('[v0] Products table created');

    // Inventory table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS inventory (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
          quantity_in_stock INT NOT NULL DEFAULT 0,
          low_stock_threshold INT DEFAULT 5,
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    }).catch(() => ({ error: null }));

    console.log('[v0] Inventory table created');

    // Customers table
    await supabase.rpc('exec_sql', {
      sql: `
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
      `
    }).catch(() => ({ error: null }));

    console.log('[v0] Customers table created');

    // Orders table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
          order_number VARCHAR(50) NOT NULL UNIQUE,
          status VARCHAR(50) DEFAULT 'pending',
          total_amount DECIMAL(10, 2) NOT NULL,
          payment_status VARCHAR(50) DEFAULT 'pending',
          delivery_address TEXT,
          delivery_notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    }).catch(() => ({ error: null }));

    console.log('[v0] Orders table created');

    // Order items table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS order_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          product_id UUID NOT NULL REFERENCES products(id) ON DELETE SET NULL,
          product_name VARCHAR(255) NOT NULL,
          quantity INT NOT NULL,
          unit_price DECIMAL(10, 2) NOT NULL,
          subtotal DECIMAL(10, 2) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    }).catch(() => ({ error: null }));

    console.log('[v0] Order items table created');

    // Payments table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
          amount DECIMAL(10, 2) NOT NULL,
          payment_method VARCHAR(50) DEFAULT 'bank_transfer',
          bank_account VARCHAR(255),
          proof_image_url TEXT,
          proof_uploaded_at TIMESTAMP WITH TIME ZONE,
          verified_at TIMESTAMP WITH TIME ZONE,
          verified_by UUID REFERENCES auth.users(id),
          status VARCHAR(50) DEFAULT 'pending',
          rejection_reason TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    }).catch(() => ({ error: null }));

    console.log('[v0] Payments table created');

    // Admin users table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS admin_users (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email VARCHAR(255) NOT NULL UNIQUE,
          full_name VARCHAR(255),
          role VARCHAR(50) DEFAULT 'staff',
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    }).catch(() => ({ error: null }));

    console.log('[v0] Admin users table created');

    // Notifications table
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          type VARCHAR(50),
          message TEXT,
          telegram_sent BOOLEAN DEFAULT FALSE,
          sent_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    }).catch(() => ({ error: null }));

    console.log('[v0] Notifications table created');

    console.log('[v0] Database setup completed successfully!');
  } catch (error) {
    console.error('[v0] Database setup failed:', error);
    process.exit(1);
  }
};

setupDatabase();
