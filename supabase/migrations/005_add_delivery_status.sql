-- Add delivery_status column to users table
-- This column is used to track the operational status of delivery members
-- Values: 'available' (disponible), 'on_delivery' (en delivery), 'unavailable' (no disponible)

-- Create enum type for delivery status
CREATE TYPE delivery_status_enum AS ENUM ('available', 'on_delivery', 'unavailable');

-- Add delivery_status column to users table
ALTER TABLE users ADD COLUMN delivery_status delivery_status_enum DEFAULT 'available';

-- Add comment to explain the column
COMMENT ON COLUMN users.delivery_status IS 'Operational status for delivery members: available, on_delivery, unavailable';
