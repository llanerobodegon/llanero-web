-- Add scope and type columns to bank_accounts for international payment support
ALTER TABLE bank_accounts
  ADD COLUMN scope VARCHAR(20) NOT NULL DEFAULT 'nacional'
    CHECK (scope IN ('nacional', 'internacional')),
  ADD COLUMN type VARCHAR(20)
    CHECK (type IS NULL OR type IN ('zelle', 'banesco_panama'));

-- For internacional, type is required; for nacional, type must be null
ALTER TABLE bank_accounts ADD CONSTRAINT valid_scope_type CHECK (
  (scope = 'nacional' AND type IS NULL) OR
  (scope = 'internacional' AND type IS NOT NULL)
);

-- For nacional: bank, account_number, rif are required
-- For internacional: account_number is required (stores email for zelle or account for banesco)
-- holder_name always required; rif, bank, pago_movil_phone nullable for internacional
ALTER TABLE bank_accounts
  ALTER COLUMN rif DROP NOT NULL,
  ALTER COLUMN bank DROP NOT NULL;
