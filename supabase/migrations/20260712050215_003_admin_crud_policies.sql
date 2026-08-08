-- Allow any authenticated user (admin) to insert/update/delete products
DROP POLICY IF EXISTS "products_insert_admin" ON products;
CREATE POLICY "products_insert_admin" ON products FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "products_update_admin" ON products;
CREATE POLICY "products_update_admin" ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "products_delete_admin" ON products;
CREATE POLICY "products_delete_admin" ON products FOR DELETE TO authenticated USING (true);

-- Allow any authenticated user to read all profiles (admin customer view)
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT TO authenticated USING (true);

-- Allow any authenticated user to read all orders (admin orders view)
DROP POLICY IF EXISTS "orders_select_all" ON orders;
CREATE POLICY "orders_select_all" ON orders FOR SELECT TO authenticated USING (true);

-- Allow any authenticated user to delete orders (admin clear customer)
DROP POLICY IF EXISTS "orders_delete_admin" ON orders;
CREATE POLICY "orders_delete_admin" ON orders FOR DELETE TO authenticated USING (true);

-- Allow reading all order_items for admin
DROP POLICY IF EXISTS "order_items_select_all" ON order_items;
CREATE POLICY "order_items_select_all" ON order_items FOR SELECT TO authenticated USING (true);
