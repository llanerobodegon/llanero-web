-- Bank Accounts Table (replaces payment_methods)
-- Each warehouse has its own bank accounts for receiving payments

CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  holder_name VARCHAR(255) NOT NULL,
  rif VARCHAR(20) NOT NULL,
  bank VARCHAR(100) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  pago_movil_phone VARCHAR(20),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated at trigger (reuses existing function from migration 001)
CREATE TRIGGER update_bank_accounts_updated_at
  BEFORE UPDATE ON bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_bank_accounts_warehouse_id ON bank_accounts(warehouse_id);
CREATE INDEX idx_bank_accounts_is_active ON bank_accounts(is_active);

-- Enable RLS
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- SELECT: all authenticated users can read (needed for checkout)
CREATE POLICY "Allow read access to all authenticated users"
  ON bank_accounts FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: admin (role_id=2) full access, manager (role_id=3) only their warehouses
CREATE POLICY "Allow insert for admin and warehouse managers"
  ON bank_accounts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 2
    )
    OR
    EXISTS (
      SELECT 1 FROM warehouse_users
      WHERE warehouse_users.warehouse_id = bank_accounts.warehouse_id
      AND warehouse_users.user_id = auth.uid()
    )
  );

-- UPDATE: admin full access, manager only their warehouses
CREATE POLICY "Allow update for admin and warehouse managers"
  ON bank_accounts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 2
    )
    OR
    EXISTS (
      SELECT 1 FROM warehouse_users
      WHERE warehouse_users.warehouse_id = bank_accounts.warehouse_id
      AND warehouse_users.user_id = auth.uid()
    )
  );

-- DELETE: admin full access, manager only their warehouses
CREATE POLICY "Allow delete for admin and warehouse managers"
  ON bank_accounts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role_id = 2
    )
    OR
    EXISTS (
      SELECT 1 FROM warehouse_users
      WHERE warehouse_users.warehouse_id = bank_accounts.warehouse_id
      AND warehouse_users.user_id = auth.uid()
    )
  );

-- Drop old table
DROP TABLE IF EXISTS payment_methods CASCADE;
