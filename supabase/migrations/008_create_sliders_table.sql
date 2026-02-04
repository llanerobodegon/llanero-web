-- ============================================
-- SLIDERS TABLE
-- ============================================

CREATE TABLE sliders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  position INT NOT NULL, -- 1 = Slider principal, 2 = Slider secundario
  slot INT NOT NULL, -- 1, 2, 3 (posición dentro del slider)
  image_url TEXT NOT NULL,
  link_url TEXT, -- URL opcional para redireccionar al hacer clic
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_position CHECK (position IN (1, 2)),
  CONSTRAINT valid_slot CHECK (slot BETWEEN 1 AND 3),
  CONSTRAINT unique_slider_position_slot UNIQUE (position, slot)
);

CREATE INDEX idx_sliders_position ON sliders(position);
CREATE INDEX idx_sliders_is_active ON sliders(is_active);
CREATE INDEX idx_sliders_created_by ON sliders(created_by);

-- ============================================
-- TRIGGER FOR updated_at
-- ============================================

CREATE TRIGGER update_sliders_updated_at
  BEFORE UPDATE ON sliders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE sliders ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view active sliders
CREATE POLICY "Users can view active sliders"
  ON sliders FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

-- Admins/Managers can view all sliders
CREATE POLICY "Admins can view all sliders"
  ON sliders FOR SELECT
  USING (is_manager_or_admin());

-- Admins/Managers can insert sliders
CREATE POLICY "Admins can insert sliders"
  ON sliders FOR INSERT
  WITH CHECK (is_manager_or_admin());

-- Admins/Managers can update sliders
CREATE POLICY "Admins can update sliders"
  ON sliders FOR UPDATE
  USING (is_manager_or_admin());

-- Only admins can delete sliders
CREATE POLICY "Admins can delete sliders"
  ON sliders FOR DELETE
  USING (is_admin());
