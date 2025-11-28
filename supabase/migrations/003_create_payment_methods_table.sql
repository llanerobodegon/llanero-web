-- Payment Methods Table
-- Supports: Nacional (Pago Móvil, Transferencia) and Internacional (Zelle, Banesco Panamá)

CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Type classification
  scope VARCHAR(20) NOT NULL CHECK (scope IN ('nacional', 'internacional')),
  type VARCHAR(20) NOT NULL CHECK (type IN ('pago_movil', 'transferencia', 'zelle', 'banesco_panama')),

  -- Nacional fields (Pago Móvil & Transferencia)
  bank VARCHAR(100),
  document_type VARCHAR(1) CHECK (document_type IN ('V', 'J', 'E')),
  document_number VARCHAR(20),

  -- Pago Móvil specific
  phone_code VARCHAR(4),
  phone_number VARCHAR(10),

  -- Transferencia & Banesco Panamá
  account_number VARCHAR(50),

  -- Zelle specific
  email VARCHAR(255),

  -- Common fields
  holder_name VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Validation constraints based on type
ALTER TABLE payment_methods ADD CONSTRAINT valid_pago_movil CHECK (
  type != 'pago_movil' OR (
    bank IS NOT NULL AND
    document_type IS NOT NULL AND
    document_number IS NOT NULL AND
    phone_code IS NOT NULL AND
    phone_number IS NOT NULL
  )
);

ALTER TABLE payment_methods ADD CONSTRAINT valid_transferencia CHECK (
  type != 'transferencia' OR (
    bank IS NOT NULL AND
    document_type IS NOT NULL AND
    document_number IS NOT NULL AND
    account_number IS NOT NULL
  )
);

ALTER TABLE payment_methods ADD CONSTRAINT valid_zelle CHECK (
  type != 'zelle' OR email IS NOT NULL
);

ALTER TABLE payment_methods ADD CONSTRAINT valid_banesco_panama CHECK (
  type != 'banesco_panama' OR account_number IS NOT NULL
);

-- Scope-type consistency
ALTER TABLE payment_methods ADD CONSTRAINT valid_scope_type CHECK (
  (scope = 'nacional' AND type IN ('pago_movil', 'transferencia')) OR
  (scope = 'internacional' AND type IN ('zelle', 'banesco_panama'))
);

-- Updated at trigger
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_payment_methods_scope ON payment_methods(scope);
CREATE INDEX idx_payment_methods_type ON payment_methods(type);
CREATE INDEX idx_payment_methods_is_active ON payment_methods(is_active);

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow read access to all authenticated users"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert for authenticated users"
  ON payment_methods FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users"
  ON payment_methods FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow delete for authenticated users"
  ON payment_methods FOR DELETE
  TO authenticated
  USING (true);
