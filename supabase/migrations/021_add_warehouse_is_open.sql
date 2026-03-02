-- Add is_open column to warehouses for individual open/close control
-- Separate from is_active: is_active = warehouse exists and is usable, is_open = accepting orders
ALTER TABLE warehouses ADD COLUMN is_open BOOLEAN DEFAULT true;
