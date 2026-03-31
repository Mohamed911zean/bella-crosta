# Bella Crosta - Setup Guide

## Environment Variables

The following environment variables need to be configured in your Vercel project:

### Supabase (Required)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

### Telegram Bot (Optional)
For Telegram notifications to work, add these variables:
- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token (get from BotFather)
- `TELEGRAM_CHAT_ID` - The chat ID to receive notifications

## Initial Setup Steps

### 1. Database
The database schema is automatically created when you run the first migration. Tables include:
- `categories` - Pizza categories
- `products` - Menu items
- `inventory` - Stock management
- `customers` - Customer profiles
- `orders` - Customer orders
- `order_items` - Items in each order
- `payments` - Payment tracking
- `admin_users` - Admin staff accounts
- `notifications` - Notification log

### 2. Admin User Setup
To create your first admin user:

1. Sign up a customer account (any email/password)
2. In Supabase SQL Editor, run:
```sql
INSERT INTO admin_users (id, email, full_name, role, is_active)
SELECT id, email, 'Admin Name', 'admin', true
FROM auth.users
WHERE email = 'your-email@example.com'
LIMIT 1;
```

Replace with your actual email address.

### 3. Telegram Bot Setup (Optional)
1. Create a bot on Telegram with BotFather
2. Get your bot token
3. Send a message to your bot and use this to get your chat ID:
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
4. Add the environment variables to your project

## Feature Walkthrough

### Customer Features
- **Home Page** - Featured pizzas and categories
- **Menu** - Browse all products with filters and search
- **Cart** - Add/remove items and adjust quantities
- **Checkout** - Collect delivery address and customer info
- **Payment** - Upload bank transfer proof and track order status

### Admin Features
- **Dashboard** - Overview of orders, revenue, and pending payments
- **Orders** - Manage all orders, update status, view details
- **Payments** - Review and confirm payment proofs
- **Inventory** - Track stock levels and update quantities

## Customization

### Adding Products
1. Go to Supabase SQL Editor
2. Insert categories first:
```sql
INSERT INTO categories (name, description, display_order)
VALUES ('Pizza Name', 'Description', 1);
```

3. Then add products:
```sql
INSERT INTO products (name, description, price, category_id)
VALUES ('Pizza Name', 'Description', 15.99, 'category-id');
```

### Updating Delivery Info
Edit the bank account information in `/app/order/[id]/page.tsx`:
```tsx
<div className="space-y-2">
  <div className="flex justify-between items-center p-2 hover:bg-muted rounded">
    <div>
      <p className="font-mono font-semibold">Bank Name: Your Bank</p>
      <p className="text-xs text-muted-foreground">Account: Your Account Number</p>
    </div>
```

### Color Theme
Customize colors in `globals.css` by modifying the CSS variables in the `@theme` section.

## Troubleshooting

### Supabase Connection Issues
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check that your Supabase project is active

### Admin Login Issues
- Ensure the user exists in `admin_users` table
- Check that their `is_active` is set to `true`

### Telegram Notifications Not Working
- Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set
- Test bot with a simple message in Telegram

## Deployment

Push your changes to GitHub and they will automatically deploy to Vercel:
```bash
git add .
git commit -m "Initial Bella Crosta setup"
git push
```

The application will be live at your Vercel URL within minutes!
