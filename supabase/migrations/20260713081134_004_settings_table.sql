-- Settings table for store configuration (UPI ID, etc.)
CREATE TABLE IF NOT EXISTS settings (
  key   text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read settings (UPI ID needed at checkout)
CREATE POLICY "settings_select_all" ON settings FOR SELECT TO authenticated, anon USING (true);

-- Only authenticated users (admin) can upsert settings
CREATE POLICY "settings_insert_admin" ON settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "settings_update_admin" ON settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "settings_delete_admin" ON settings FOR DELETE TO authenticated USING (true);

-- Seed default UPI ID (empty — admin must fill it)
INSERT INTO settings (key, value) VALUES ('upi_id', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('store_name', 'MMMobiles') ON CONFLICT (key) DO NOTHING;
