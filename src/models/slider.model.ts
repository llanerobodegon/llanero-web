// Slider Settings interface
export interface SliderSettings {
  id: string;
  position: number;
  title: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Slider interface
export interface Slider {
  id: string;
  name: string;
  position: number; // 1 = Slider principal, 2 = Slider secundario
  slot: number; // 1, 2, 3
  imageUrl: string;
  linkUrl: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CREATE/UPDATE DTOs
// ============================================

export interface CreateSliderData {
  name: string;
  position: number;
  slot: number;
  imageUrl: string;
  linkUrl?: string;
  isActive?: boolean;
}

export interface UpdateSliderData {
  name?: string;
  imageUrl?: string;
  linkUrl?: string | null;
  isActive?: boolean;
}

// Grouped sliders by position
export interface SliderGroup {
  position: number;
  title: string;
  isEnabled: boolean;
  settingsId: string;
  sliders: (Slider | null)[]; // Array de 3 elementos (slots 1, 2, 3)
}
