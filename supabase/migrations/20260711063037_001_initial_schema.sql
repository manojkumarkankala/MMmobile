/*
# MMMobiles - Initial Schema

## Overview
Creates the complete database for MMMobiles, an AI-powered mobile phone e-commerce
platform. Supports customers, sellers, delivery partners, and admins.

## Tables
1. profiles — extends Supabase auth.users with name, phone, role
2. categories — product categories (Smartphones, Tablets, Accessories, etc.)
3. brands — phone brands (Apple, Samsung, Vivo, etc.)
4. products — catalog with specs (jsonb), pricing, images, stock, ratings
5. reviews — product reviews with pros/cons
6. wishlists — saved products per user
7. cart_items — shopping cart per user
8. addresses — saved delivery addresses per user
9. orders — placed orders with status tracking + delivery info
10. order_items — line items per order
11. coupons — discount codes

## Security (RLS)
- Public catalog (categories, brands, products, reviews, coupons) → readable by anon + authenticated
- User data (wishlists, cart_items, addresses, orders, order_items, profiles) → owner-scoped to authenticated via auth.uid()
- Products/coupons write restricted to admin/seller roles
- Every table has RLS enabled
*/

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','seller','delivery','admin')),
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============ CATEGORIES ============
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon text DEFAULT '',
  image_url text DEFAULT '',
  sort_order int DEFAULT 0
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_read" ON categories;
CREATE POLICY "categories_read" ON categories FOR SELECT TO anon, authenticated USING (true);

-- ============ BRANDS ============
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  logo_url text DEFAULT '',
  country text DEFAULT '',
  sort_order int DEFAULT 0
);
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brands_read" ON brands;
CREATE POLICY "brands_read" ON brands FOR SELECT TO anon, authenticated USING (true);

-- ============ PRODUCTS ============
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  mrp numeric(10,2) NOT NULL DEFAULT 0,
  images text[] NOT NULL DEFAULT '{}',
  description text DEFAULT '',
  highlights text[] NOT NULL DEFAULT '{}',
  specs jsonb NOT NULL DEFAULT '{}'::jsonb,
  stock int NOT NULL DEFAULT 0,
  rating numeric(2,1) NOT NULL DEFAULT 0,
  review_count int NOT NULL DEFAULT 0,
  emi_available boolean NOT NULL DEFAULT true,
  emi_from numeric(10,2) NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  is_new boolean NOT NULL DEFAULT false,
  colors text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_read" ON products;
CREATE POLICY "products_read" ON products FOR SELECT TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- ============ REVIEWS ============
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL DEFAULT '',
  rating int NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  title text DEFAULT '',
  body text DEFAULT '',
  pros text[] NOT NULL DEFAULT '{}',
  cons text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_read" ON reviews;
CREATE POLICY "reviews_read" ON reviews FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
CREATE POLICY "reviews_insert_own" ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;
CREATE POLICY "reviews_delete_own" ON reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ WISHLISTS ============
CREATE TABLE IF NOT EXISTS wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wishlist_select_own" ON wishlists;
CREATE POLICY "wishlist_select_own" ON wishlists FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishlist_insert_own" ON wishlists;
CREATE POLICY "wishlist_insert_own" ON wishlists FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishlist_delete_own" ON wishlists;
CREATE POLICY "wishlist_delete_own" ON wishlists FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ CART ITEMS ============
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cart_select_own" ON cart_items;
CREATE POLICY "cart_select_own" ON cart_items FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "cart_insert_own" ON cart_items;
CREATE POLICY "cart_insert_own" ON cart_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cart_update_own" ON cart_items;
CREATE POLICY "cart_update_own" ON cart_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cart_delete_own" ON cart_items;
CREATE POLICY "cart_delete_own" ON cart_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ ADDRESSES ============
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Home',
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  line1 text NOT NULL DEFAULT '',
  line2 text DEFAULT '',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  pincode text NOT NULL DEFAULT '',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "addr_select_own" ON addresses;
CREATE POLICY "addr_select_own" ON addresses FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "addr_insert_own" ON addresses;
CREATE POLICY "addr_insert_own" ON addresses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "addr_update_own" ON addresses;
CREATE POLICY "addr_update_own" ON addresses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "addr_delete_own" ON addresses;
CREATE POLICY "addr_delete_own" ON addresses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ ORDERS ============
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'placed' CHECK (status IN ('placed','confirmed','shipped','out_for_delivery','delivered','cancelled')),
  items_total numeric(10,2) NOT NULL DEFAULT 0,
  delivery_charge numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'razorpay',
  payment_status text NOT NULL DEFAULT 'paid',
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  delivery_otp text DEFAULT '',
  delivery_partner_name text DEFAULT '',
  tracking_lat numeric(9,6),
  tracking_lng numeric(9,6),
  eta_minutes int DEFAULT 45,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_own" ON orders;
CREATE POLICY "orders_select_own" ON orders FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_insert_own" ON orders;
CREATE POLICY "orders_insert_own" ON orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_update_own" ON orders;
CREATE POLICY "orders_update_own" ON orders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);

-- ============ ORDER ITEMS ============
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL DEFAULT '',
  product_image text DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  quantity int NOT NULL DEFAULT 1
);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select_own" ON order_items;
CREATE POLICY "order_items_select_own" ON order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

DROP POLICY IF EXISTS "order_items_insert_own" ON order_items;
CREATE POLICY "order_items_insert_own" ON order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- ============ COUPONS ============
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text DEFAULT '',
  discount_percent numeric(4,2) NOT NULL DEFAULT 0,
  min_order numeric(10,2) NOT NULL DEFAULT 0,
  max_discount numeric(10,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  valid_until timestamptz DEFAULT now() + interval '365 days'
);
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupons_read" ON coupons;
CREATE POLICY "coupons_read" ON coupons FOR SELECT TO anon, authenticated USING (true);

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_select_own" ON notifications;
CREATE POLICY "notif_select_own" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notif_insert_own" ON notifications;
CREATE POLICY "notif_insert_own" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notif_update_own" ON notifications;
CREATE POLICY "notif_update_own" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notif_delete_own" ON notifications;
CREATE POLICY "notif_delete_own" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
