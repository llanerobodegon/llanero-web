-- Create store_settings table
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_store_settings_key ON public.store_settings(key);

-- Insert default settings
INSERT INTO public.store_settings (key, value) VALUES
  ('store_open', 'true'),
  ('invoice_message_enabled', 'false'),
  ('invoice_message', '')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can read settings (needed for storefront)
CREATE POLICY "Public read access for store settings"
  ON public.store_settings FOR SELECT
  USING (true);

-- Only admins can update settings
CREATE POLICY "Admin update access for store settings"
  ON public.store_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name = 'admin'
    )
  );

-- Only admins can insert settings
CREATE POLICY "Admin insert access for store settings"
  ON public.store_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.name = 'admin'
    )
  );
