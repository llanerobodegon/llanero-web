-- ============================================
-- CATEGORIES TABLE
-- ============================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_is_active ON categories(is_active);
CREATE INDEX idx_categories_created_by ON categories(created_by);

-- ============================================
-- SUBCATEGORIES TABLE
-- ============================================

CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX idx_subcategories_is_active ON subcategories(is_active);
CREATE INDEX idx_subcategories_created_by ON subcategories(created_by);

-- ============================================
-- PRODUCTS TABLE
-- ============================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_urls TEXT[], -- Array of image URLs
  barcode VARCHAR(50),
  sku VARCHAR(50),
  price DECIMAL(10, 2) NOT NULL, -- Base price
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_barcode UNIQUE (barcode),
  CONSTRAINT unique_sku UNIQUE (sku),
  CONSTRAINT valid_price CHECK (price >= 0)
);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_subcategory_id ON products(subcategory_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_sku ON products(sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_products_created_by ON products(created_by);

-- ============================================
-- WAREHOUSES TABLE
-- ============================================

CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  address TEXT,
  phone VARCHAR(15),
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_warehouses_is_active ON warehouses(is_active);
CREATE INDEX idx_warehouses_created_by ON warehouses(created_by);

-- ============================================
-- WAREHOUSE_PRODUCTS TABLE (Inventory per warehouse)
-- ============================================

CREATE TABLE warehouse_products (
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  stock INT DEFAULT 0,
  price DECIMAL(10, 2), -- Override price for this warehouse (NULL = use product base price)
  is_available BOOLEAN DEFAULT true,
  is_on_discount BOOLEAN DEFAULT false,
  is_promo BOOLEAN DEFAULT false,
  discount_price DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Primary key
  PRIMARY KEY (warehouse_id, product_id),

  -- Constraints
  CONSTRAINT valid_stock CHECK (stock >= 0),
  CONSTRAINT valid_warehouse_price CHECK (price IS NULL OR price >= 0),
  CONSTRAINT valid_discount_price CHECK (discount_price IS NULL OR discount_price >= 0),
  CONSTRAINT discount_price_required CHECK (
    (is_on_discount = false AND is_promo = false) OR
    (discount_price IS NOT NULL)
  )
);

CREATE INDEX idx_warehouse_products_warehouse_id ON warehouse_products(warehouse_id);
CREATE INDEX idx_warehouse_products_product_id ON warehouse_products(product_id);
CREATE INDEX idx_warehouse_products_is_available ON warehouse_products(is_available);
CREATE INDEX idx_warehouse_products_is_on_discount ON warehouse_products(is_on_discount) WHERE is_on_discount = true;
CREATE INDEX idx_warehouse_products_is_promo ON warehouse_products(is_promo) WHERE is_promo = true;

-- ============================================
-- WAREHOUSE_USERS TABLE (Manager permissions)
-- ============================================

CREATE TABLE warehouse_users (
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Primary key
  PRIMARY KEY (warehouse_id, user_id)
);

CREATE INDEX idx_warehouse_users_warehouse_id ON warehouse_users(warehouse_id);
CREATE INDEX idx_warehouse_users_user_id ON warehouse_users(user_id);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcategories_updated_at
  BEFORE UPDATE ON subcategories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouses_updated_at
  BEFORE UPDATE ON warehouses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouse_products_updated_at
  BEFORE UPDATE ON warehouse_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if user is manager of a specific warehouse
CREATE OR REPLACE FUNCTION is_warehouse_manager(warehouse_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM warehouse_users
    WHERE warehouse_id = warehouse_uuid
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is manager or admin
CREATE OR REPLACE FUNCTION is_manager_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
      AND r.name IN ('admin', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CATEGORIES POLICIES
-- ============================================

-- Anyone authenticated can view active categories
CREATE POLICY "Users can view active categories"
  ON categories FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

-- Admins/Managers can view all categories
CREATE POLICY "Admins can view all categories"
  ON categories FOR SELECT
  USING (is_manager_or_admin());

-- Admins/Managers can insert categories
CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  WITH CHECK (is_manager_or_admin());

-- Admins/Managers can update categories
CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  USING (is_manager_or_admin());

-- Only admins can delete categories
CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  USING (is_admin());

-- ============================================
-- SUBCATEGORIES POLICIES
-- ============================================

-- Anyone authenticated can view active subcategories
CREATE POLICY "Users can view active subcategories"
  ON subcategories FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

-- Admins/Managers can view all subcategories
CREATE POLICY "Admins can view all subcategories"
  ON subcategories FOR SELECT
  USING (is_manager_or_admin());

-- Admins/Managers can insert subcategories
CREATE POLICY "Admins can insert subcategories"
  ON subcategories FOR INSERT
  WITH CHECK (is_manager_or_admin());

-- Admins/Managers can update subcategories
CREATE POLICY "Admins can update subcategories"
  ON subcategories FOR UPDATE
  USING (is_manager_or_admin());

-- Only admins can delete subcategories
CREATE POLICY "Admins can delete subcategories"
  ON subcategories FOR DELETE
  USING (is_admin());

-- ============================================
-- PRODUCTS POLICIES
-- ============================================

-- Anyone authenticated can view active products
CREATE POLICY "Users can view active products"
  ON products FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

-- Admins/Managers can view all products
CREATE POLICY "Admins can view all products"
  ON products FOR SELECT
  USING (is_manager_or_admin());

-- Admins/Managers can insert products
CREATE POLICY "Admins can insert products"
  ON products FOR INSERT
  WITH CHECK (is_manager_or_admin());

-- Admins/Managers can update products
CREATE POLICY "Admins can update products"
  ON products FOR UPDATE
  USING (is_manager_or_admin());

-- Only admins can delete products
CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  USING (is_admin());

-- ============================================
-- WAREHOUSES POLICIES
-- ============================================

-- Anyone authenticated can view active warehouses
CREATE POLICY "Users can view active warehouses"
  ON warehouses FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

-- Admins can view all warehouses
CREATE POLICY "Admins can view all warehouses"
  ON warehouses FOR SELECT
  USING (is_admin());

-- Warehouse managers can view their warehouses
CREATE POLICY "Managers can view assigned warehouses"
  ON warehouses FOR SELECT
  USING (is_warehouse_manager(id));

-- Only admins can insert warehouses
CREATE POLICY "Admins can insert warehouses"
  ON warehouses FOR INSERT
  WITH CHECK (is_admin());

-- Admins can update any warehouse
CREATE POLICY "Admins can update warehouses"
  ON warehouses FOR UPDATE
  USING (is_admin());

-- Managers can update their assigned warehouses
CREATE POLICY "Managers can update assigned warehouses"
  ON warehouses FOR UPDATE
  USING (is_warehouse_manager(id));

-- Only admins can delete warehouses
CREATE POLICY "Admins can delete warehouses"
  ON warehouses FOR DELETE
  USING (is_admin());

-- ============================================
-- WAREHOUSE_PRODUCTS POLICIES
-- ============================================

-- Anyone authenticated can view available products in active warehouses
CREATE POLICY "Users can view available warehouse products"
  ON warehouse_products FOR SELECT
  USING (
    is_available = true
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM warehouses
      WHERE id = warehouse_id AND is_active = true
    )
  );

-- Admins can view all warehouse products
CREATE POLICY "Admins can view all warehouse products"
  ON warehouse_products FOR SELECT
  USING (is_admin());

-- Managers can view products in their warehouses
CREATE POLICY "Managers can view assigned warehouse products"
  ON warehouse_products FOR SELECT
  USING (is_warehouse_manager(warehouse_id));

-- Admins can insert warehouse products
CREATE POLICY "Admins can insert warehouse products"
  ON warehouse_products FOR INSERT
  WITH CHECK (is_admin());

-- Managers can insert products in their warehouses
CREATE POLICY "Managers can insert assigned warehouse products"
  ON warehouse_products FOR INSERT
  WITH CHECK (is_warehouse_manager(warehouse_id));

-- Admins can update any warehouse products
CREATE POLICY "Admins can update warehouse products"
  ON warehouse_products FOR UPDATE
  USING (is_admin());

-- Managers can update products in their warehouses
CREATE POLICY "Managers can update assigned warehouse products"
  ON warehouse_products FOR UPDATE
  USING (is_warehouse_manager(warehouse_id));

-- Admins can delete warehouse products
CREATE POLICY "Admins can delete warehouse products"
  ON warehouse_products FOR DELETE
  USING (is_admin());

-- Managers can delete products from their warehouses
CREATE POLICY "Managers can delete assigned warehouse products"
  ON warehouse_products FOR DELETE
  USING (is_warehouse_manager(warehouse_id));

-- ============================================
-- WAREHOUSE_USERS POLICIES
-- ============================================

-- Users can see their own warehouse assignments
CREATE POLICY "Users can view own warehouse assignments"
  ON warehouse_users FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all warehouse assignments
CREATE POLICY "Admins can view all warehouse assignments"
  ON warehouse_users FOR SELECT
  USING (is_admin());

-- Only admins can manage warehouse assignments
CREATE POLICY "Admins can insert warehouse assignments"
  ON warehouse_users FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete warehouse assignments"
  ON warehouse_users FOR DELETE
  USING (is_admin());
