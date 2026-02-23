-- Helper to check if a user is a delivery member assigned to the same warehouse as the manager
CREATE OR REPLACE FUNCTION is_delivery_of_manager_warehouse(delivery_user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM warehouse_users manager_wu
    JOIN warehouse_users delivery_wu ON delivery_wu.warehouse_id = manager_wu.warehouse_id
    JOIN users u ON u.id = delivery_wu.user_id
    JOIN roles r ON r.id = u.role_id
    WHERE manager_wu.user_id = auth.uid()
    AND delivery_wu.user_id = delivery_user_id
    AND r.name = 'delivery'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Managers can view delivery members assigned to their warehouses
CREATE POLICY "Managers can view delivery members of their warehouses" ON users
    FOR SELECT
    USING (is_manager() AND is_delivery_of_manager_warehouse(users.id));

-- Helper function that bypasses RLS to check if a warehouse belongs to the manager
CREATE OR REPLACE FUNCTION is_manager_warehouse(wh_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM warehouse_users wu
    WHERE wu.user_id = auth.uid()
    AND wu.warehouse_id = wh_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Managers can view warehouse assignments of delivery members in their warehouses
CREATE POLICY "Managers can view delivery warehouse assignments" ON warehouse_users
    FOR SELECT
    USING (
        is_manager()
        AND is_manager_warehouse(warehouse_users.warehouse_id)
    );
