-- Helper function to check if current user is a manager (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
      AND r.name = 'manager'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to check if a customer belongs to a manager's warehouse orders (bypasses RLS)
CREATE OR REPLACE FUNCTION is_customer_of_manager_warehouse(customer_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM orders o
    JOIN warehouse_users wu ON wu.warehouse_id = o.warehouse_id
    WHERE o.user_id = customer_id
    AND wu.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to check if an address belongs to a manager's warehouse orders (bypasses RLS)
CREATE OR REPLACE FUNCTION is_address_of_manager_warehouse(addr_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM orders o
    JOIN warehouse_users wu ON wu.warehouse_id = o.warehouse_id
    WHERE o.address_id = addr_id
    AND wu.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Managers can manage orders from their assigned warehouses
CREATE POLICY "Managers can manage orders of their warehouses" ON orders
    FOR ALL
    USING (
        is_manager()
        AND EXISTS (
            SELECT 1 FROM warehouse_users wu
            WHERE wu.user_id = auth.uid()
            AND wu.warehouse_id = orders.warehouse_id
        )
    );

-- Managers can manage order items from their warehouses
CREATE POLICY "Managers can view order items of their warehouses" ON order_items
    FOR ALL
    USING (
        is_manager()
        AND EXISTS (
            SELECT 1 FROM orders o
            JOIN warehouse_users wu ON wu.warehouse_id = o.warehouse_id
            WHERE o.id = order_items.order_id
            AND wu.user_id = auth.uid()
        )
    );

-- Managers can view customers who ordered from their warehouses
CREATE POLICY "Managers can view customers of their warehouses" ON users
    FOR SELECT
    USING (is_manager() AND is_customer_of_manager_warehouse(users.id));

-- Managers can view addresses from orders of their warehouses
CREATE POLICY "Managers can view addresses of their warehouse orders" ON addresses
    FOR SELECT
    USING (is_manager() AND is_address_of_manager_warehouse(addresses.id));
