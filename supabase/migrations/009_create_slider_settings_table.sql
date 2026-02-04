-- ============================================
-- SLIDER_SETTINGS TABLE (Configuration for each slider group)
-- ============================================

CREATE TABLE slider_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position INT NOT NULL UNIQUE, -- 1 = Slider principal, 2 = Slider secundario
  title VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_settings_position CHECK (position IN (1, 2))
);

-- Insert default settings
INSERT INTO slider_settings (position, title, is_enabled) VALUES
  (1, 'Slider Principal', true),
  (2, 'Slider Secundario', true);

CREATE TRIGGER update_slider_settings_updated_at
  BEFORE UPDATE ON slider_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SLIDER_SETTINGS POLICIES
-- ============================================

ALTER TABLE slider_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view slider settings
CREATE POLICY "Users can view slider settings"
  ON slider_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins/Managers can update slider settings
CREATE POLICY "Admins can update slider settings"
  ON slider_settings FOR UPDATE
  USING (is_manager_or_admin());
