-- Enable Realtime for orders table
-- This allows clients to subscribe to changes in the orders table

-- Add orders table to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Note: You may also need to enable this in the Supabase Dashboard:
-- 1. Go to Database -> Replication
-- 2. Find "supabase_realtime" publication
-- 3. Add "orders" table if not already there
--
-- Or enable it via the Supabase Dashboard:
-- 1. Go to Database -> Tables
-- 2. Click on "orders" table
-- 3. Enable "Realtime" toggle
