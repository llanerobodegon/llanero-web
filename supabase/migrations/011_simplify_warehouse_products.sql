-- Migration: Simplify warehouse_products and move discounts to products
-- warehouse_products becomes a simple availability table
-- products gains discount/promo fields

-- 1. Add discount columns to products
ALTER TABLE public.products
  ADD COLUMN is_on_discount boolean DEFAULT false,
  ADD COLUMN is_promo boolean DEFAULT false,
  ADD COLUMN discount_price numeric CHECK (discount_price IS NULL OR discount_price >= 0);

-- 2. Migrate existing discount data from warehouse_products to products
UPDATE public.products p
SET
  is_on_discount = wp.is_on_discount,
  is_promo = wp.is_promo,
  discount_price = wp.discount_price
FROM (
  SELECT DISTINCT ON (product_id) product_id, is_on_discount, is_promo, discount_price
  FROM public.warehouse_products
  ORDER BY product_id, created_at ASC
) wp
WHERE p.id = wp.product_id;

-- 3. Drop removed columns from warehouse_products
ALTER TABLE public.warehouse_products
  DROP COLUMN stock,
  DROP COLUMN price,
  DROP COLUMN is_on_discount,
  DROP COLUMN is_promo,
  DROP COLUMN discount_price;
