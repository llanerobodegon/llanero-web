-- Add phone code 0422 to valid phone codes
-- 0422 is a new phone code in Venezuela

ALTER TABLE users DROP CONSTRAINT valid_phone_code;

ALTER TABLE users ADD CONSTRAINT valid_phone_code CHECK (
  phone_code IS NULL OR
  phone_code IN ('0412', '0414', '0416', '0422', '0424', '0426')
);
