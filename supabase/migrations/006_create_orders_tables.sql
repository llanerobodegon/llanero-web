-- Add delivery_fee to warehouses
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0;

-- Create orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Readable identifier
    order_number VARCHAR(20) UNIQUE NOT NULL,

    -- Relations
    user_id UUID NOT NULL REFERENCES users(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    address_id UUID REFERENCES addresses(id),
    delivery_person_id UUID REFERENCES users(id),

    -- Delivery type and status
    delivery_type VARCHAR(20) NOT NULL CHECK (delivery_type IN ('pickup', 'delivery')),
    delivery_code VARCHAR(4) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'on_delivery', 'delivered', 'completed', 'cancelled')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'verified', 'rejected')),

    -- Payment information from customer
    payment_method_type VARCHAR(30) NOT NULL CHECK (payment_method_type IN ('pago_movil', 'transferencia', 'zelle', 'banesco_panama')),
    payment_bank VARCHAR(100),
    payment_reference VARCHAR(10),
    payment_proof_url TEXT,

    -- Amounts
    subtotal_usd DECIMAL(10,2) NOT NULL,
    subtotal_bs DECIMAL(15,2) NOT NULL,
    delivery_fee_usd DECIMAL(10,2) DEFAULT 0,
    delivery_fee_bs DECIMAL(15,2) DEFAULT 0,
    total_usd DECIMAL(10,2) NOT NULL,
    total_bs DECIMAL(15,2) NOT NULL,
    exchange_rate DECIMAL(10,4) NOT NULL,

    -- Notes
    customer_notes TEXT,
    admin_notes TEXT,

    -- Timestamps
    confirmed_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),

    -- Product snapshot at time of purchase
    product_name VARCHAR(255) NOT NULL,
    product_image_url TEXT,

    -- Quantities and prices
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_usd DECIMAL(10,2) NOT NULL,
    unit_price_bs DECIMAL(15,2) NOT NULL,
    total_usd DECIMAL(10,2) NOT NULL,
    total_bs DECIMAL(15,2) NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_warehouse_id ON orders(warehouse_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Create function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 5) AS INTEGER)), 0) + 1
    INTO next_num
    FROM orders;

    NEW.order_number := 'ORD-' || LPAD(next_num::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate order number
CREATE TRIGGER trigger_generate_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
    EXECUTE FUNCTION generate_order_number();

-- Create function to generate delivery code
CREATE OR REPLACE FUNCTION generate_delivery_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.delivery_code := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate delivery code
CREATE TRIGGER trigger_generate_delivery_code
    BEFORE INSERT ON orders
    FOR EACH ROW
    WHEN (NEW.delivery_code IS NULL OR NEW.delivery_code = '')
    EXECUTE FUNCTION generate_delivery_code();

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on orders
CREATE TRIGGER trigger_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_orders_updated_at();

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
CREATE POLICY "Admins can do everything with orders" ON orders
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.name = 'admin'
        )
    );

CREATE POLICY "Delivery members can view and update assigned orders" ON orders
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.name = 'delivery'
        )
        AND (
            delivery_person_id = auth.uid()
            OR delivery_person_id IS NULL
        )
    );

CREATE POLICY "Customers can view their own orders" ON orders
    FOR SELECT
    USING (user_id = auth.uid());

-- RLS Policies for order_items
CREATE POLICY "Admins can do everything with order_items" ON order_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.name = 'admin'
        )
    );

CREATE POLICY "Users can view items of their orders" ON order_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
            AND (orders.user_id = auth.uid() OR orders.delivery_person_id = auth.uid())
        )
    );

-- Add comments
COMMENT ON TABLE orders IS 'Customer orders with payment and delivery information';
COMMENT ON TABLE order_items IS 'Individual items within an order';
COMMENT ON COLUMN orders.delivery_code IS '4-digit code for delivery verification';
COMMENT ON COLUMN orders.exchange_rate IS 'USD to BS exchange rate at time of order';
COMMENT ON COLUMN warehouses.delivery_fee IS 'Fixed delivery fee in USD for this warehouse';
