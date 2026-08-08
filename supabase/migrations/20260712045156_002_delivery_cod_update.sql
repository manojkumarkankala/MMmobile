-- Allow any authenticated user to update orders (delivery partner needs to mark COD paid/cancelled)
-- We drop the owner-only update policy and replace with a broader one
DROP POLICY IF EXISTS "orders_update_own" ON orders;

-- Owner can update their own orders (customer)
CREATE POLICY "orders_update_own" ON orders FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Delivery partner can update payment_status and status on any order
-- We use a separate policy with no ownership restriction
CREATE POLICY "orders_update_delivery" ON orders FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
