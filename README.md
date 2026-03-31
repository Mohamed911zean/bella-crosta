# Bella Crosta - Pizza Ordering & Delivery System

A full-stack pizza restaurant ordering and delivery platform built with Next.js, Supabase, and modern web technologies.

## Features

### Customer Features
- **Beautiful Storefront** - Showcase featured pizzas and categories
- **Advanced Menu** - Browse products with category filtering and search
- **Smart Cart** - Add/remove items, adjust quantities with real-time updates
- **Secure Checkout** - Collect delivery information with form validation
- **Payment Management** - Upload bank transfer proof and track order status
- **Order Tracking** - Real-time order status updates
- **Authentication** - Secure sign up and login with Supabase Auth

### Admin Features
- **Dashboard** - Real-time overview of orders, revenue, and pending tasks
- **Order Management** - View, update status, and manage all orders
- **Payment Verification** - Review and confirm payment proofs with image preview
- **Inventory Management** - Track stock levels, set low stock thresholds, update quantities
- **Notifications** - Telegram bot notifications for new orders and payment updates

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: shadcn/ui with Tailwind CSS v4
- **State Management**: React Context API
- **Server Actions**: Next.js Server Actions for mutations
- **Notifications**: Telegram Bot API

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Telegram bot token (optional, for notifications)

### Installation

1. **Clone and install dependencies**
```bash
git clone <your-repo>
cd bella-crosta
npm install
```

2. **Set up environment variables**
Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token (optional)
TELEGRAM_CHAT_ID=your_telegram_chat_id (optional)
```

3. **Set up database**
The database schema is automatically created on first run. No manual SQL needed.

4. **Create admin user**
In Supabase SQL Editor:
```sql
INSERT INTO admin_users (id, email, full_name, role, is_active)
SELECT id, email, 'Your Name', 'admin', true
FROM auth.users
WHERE email = 'your-email@example.com'
LIMIT 1;
```

5. **Start development server**
```bash
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
├── app/
│   ├── page.tsx                 # Home page
│   ├── menu/                    # Menu browsing
│   ├── cart/                    # Shopping cart
│   ├── checkout/                # Checkout process
│   ├── order/[id]/              # Order confirmation
│   ├── admin/
│   │   ├── login/               # Admin login
│   │   ├── dashboard/           # Admin dashboard
│   │   ├── orders/              # Order management
│   │   ├── payments/            # Payment verification
│   │   └── inventory/           # Inventory management
│   └── layout.tsx
├── components/
│   ├── header.tsx               # Navigation header
│   ├── product-card.tsx         # Product display
│   ├── auth-form.tsx            # Authentication form
│   └── admin-sidebar.tsx        # Admin navigation
├── lib/
│   ├── db.ts                    # Database queries
│   ├── actions.ts               # Server actions
│   ├── cart-context.tsx         # Cart state management
│   └── telegram.ts              # Telegram notifications
└── public/                      # Static assets
```

## Key Features Explained

### Order Management
1. Customer places order with delivery info
2. Inventory automatically deducted
3. Admin receives Telegram notification
4. Customer uploads payment proof
5. Admin verifies payment
6. Admin updates order status
7. Customer tracks order in real-time

### Inventory System
- Automatic deduction on order placement
- Low stock alerts
- Manual adjustments by admin
- Per-product stock thresholds

### Payment Flow
- Bank transfer details displayed
- Customer uploads proof image
- Admin reviews proof
- Admin confirms payment
- Order confirmation sent

### Notification System
- New order alerts → Telegram
- Payment receipt → Telegram
- Payment confirmation → Telegram
- Order status changes → Telegram

## Database Schema

### Key Tables
- **categories** - Product categories (pizzas, appetizers, beverages)
- **products** - Menu items with pricing and availability
- **inventory** - Stock management per product
- **customers** - Customer profiles and contact info
- **orders** - Customer orders and delivery info
- **order_items** - Items in each order
- **payments** - Payment tracking and proof uploads
- **admin_users** - Admin staff accounts
- **notifications** - Notification log

## Customization

### Adding New Menu Items
```sql
-- Add category
INSERT INTO categories (name, description, display_order)
VALUES ('New Category', 'Description', 5);

-- Add product
INSERT INTO products (name, description, price, category_id)
VALUES ('Pizza Name', 'Description', 15.99, 'category-id');

-- Initialize inventory
INSERT INTO inventory (product_id, quantity_in_stock, low_stock_threshold)
VALUES ('product-id', 50, 5);
```

### Customizing Bank Details
Edit `/app/order/[id]/page.tsx` and update the bank information section.

### Changing Colors
Modify the CSS variables in `globals.css` - the design uses a cohesive color system with primary, destructive, and muted tones.

## API Routes

The application uses Next.js Server Actions. No traditional API routes are needed. All server-side operations are handled through server actions in `lib/actions.ts`.

## Security Considerations

- Row Level Security (RLS) policies on Supabase tables
- Secure password hashing with Supabase Auth
- Protected admin routes with auth verification
- Input validation on all forms
- Parameterized database queries to prevent SQL injection

## Deployment

Deploy to Vercel for optimal Next.js performance:

```bash
git push origin main
```

Your site will automatically deploy when you push to the main branch.

## Performance

- Image optimization with Next.js Image component
- Server-side rendering for better SEO
- Efficient database queries with indexes
- Caching strategies for static content
- Mobile-first responsive design

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Future Enhancements

- Online payment integration (Stripe, PayPal)
- Email notifications to customers
- SMS order updates
- Delivery tracking with map
- Customer ratings and reviews
- Marketing analytics
- Multiple locations support

## Support

For setup issues, refer to `SETUP.md` for detailed configuration instructions.

## License

MIT - Feel free to use this for your pizza business!

## Credits

Built with Next.js, Supabase, and modern web technologies.
