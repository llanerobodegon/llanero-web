-- Fix: allow warehouse deletion by setting preferred_warehouse_id to NULL
-- instead of blocking the delete
ALTER TABLE public.users
  DROP CONSTRAINT users_preferred_warehouse_id_fkey,
  ADD CONSTRAINT users_preferred_warehouse_id_fkey
    FOREIGN KEY (preferred_warehouse_id)
    REFERENCES public.warehouses(id)
    ON DELETE SET NULL;
