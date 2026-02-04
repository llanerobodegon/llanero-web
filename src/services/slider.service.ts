import { createClient } from "@/lib/supabase/client"
import {
  Slider,
  SliderSettings,
  CreateSliderData,
  UpdateSliderData,
  SliderGroup,
} from "@/src/models/slider.model"

interface SliderSettingsRow {
  id: string
  position: number
  title: string
  is_enabled: boolean
  created_at: string
  updated_at: string
}

function transformSliderSettings(row: SliderSettingsRow): SliderSettings {
  return {
    id: row.id,
    position: row.position,
    title: row.title,
    isEnabled: row.is_enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

interface SliderRow {
  id: string
  name: string
  position: number
  slot: number
  image_url: string
  link_url: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

function transformSlider(row: SliderRow): Slider {
  return {
    id: row.id,
    name: row.name,
    position: row.position,
    slot: row.slot,
    imageUrl: row.image_url,
    linkUrl: row.link_url,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const sliderService = {
  async getAll(): Promise<Slider[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("sliders")
      .select("*")
      .order("position", { ascending: true })
      .order("slot", { ascending: true })

    if (error) {
      throw new Error(`Error fetching sliders: ${error.message}`)
    }

    return (data as SliderRow[]).map(transformSlider)
  },

  async getById(id: string): Promise<Slider | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("sliders")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") return null
      throw new Error(`Error fetching slider: ${error.message}`)
    }

    return transformSlider(data as SliderRow)
  },

  async getSliderSettings(): Promise<SliderSettings[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("slider_settings")
      .select("*")
      .order("position", { ascending: true })

    if (error) {
      throw new Error(`Error fetching slider settings: ${error.message}`)
    }

    return (data as SliderSettingsRow[]).map(transformSliderSettings)
  },

  async updateSliderSettings(id: string, isEnabled: boolean): Promise<SliderSettings> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("slider_settings")
      .update({ is_enabled: isEnabled })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error updating slider settings: ${error.message}`)
    }

    return transformSliderSettings(data as SliderSettingsRow)
  },

  async getGroupedSliders(): Promise<SliderGroup[]> {
    const supabase = createClient()

    // Fetch settings and sliders in parallel
    const [settingsResult, slidersResult] = await Promise.all([
      supabase
        .from("slider_settings")
        .select("*")
        .order("position", { ascending: true }),
      supabase
        .from("sliders")
        .select("*")
        .order("position", { ascending: true })
        .order("slot", { ascending: true }),
    ])

    if (settingsResult.error) {
      throw new Error(`Error fetching slider settings: ${settingsResult.error.message}`)
    }
    if (slidersResult.error) {
      throw new Error(`Error fetching sliders: ${slidersResult.error.message}`)
    }

    const settings = (settingsResult.data as SliderSettingsRow[]).map(transformSliderSettings)
    const sliders = (slidersResult.data as SliderRow[]).map(transformSlider)

    const groups: SliderGroup[] = settings.map((setting) => ({
      position: setting.position,
      title: setting.title,
      isEnabled: setting.isEnabled,
      settingsId: setting.id,
      sliders: [null, null, null],
    }))

    for (const slider of sliders) {
      const groupIndex = slider.position - 1
      const slotIndex = slider.slot - 1
      if (groupIndex >= 0 && groupIndex < groups.length && slotIndex >= 0 && slotIndex < 3) {
        groups[groupIndex].sliders[slotIndex] = slider
      }
    }

    return groups
  },

  async create(sliderData: CreateSliderData): Promise<Slider> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("sliders")
      .insert({
        name: sliderData.name,
        position: sliderData.position,
        slot: sliderData.slot,
        image_url: sliderData.imageUrl,
        link_url: sliderData.linkUrl || null,
        is_active: sliderData.isActive ?? true,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Error creating slider: ${error.message}`)
    }

    return transformSlider(data as SliderRow)
  },

  async update(id: string, sliderData: UpdateSliderData): Promise<Slider> {
    const supabase = createClient()

    const updateData: Record<string, unknown> = {}

    if (sliderData.name !== undefined) {
      updateData.name = sliderData.name
    }
    if (sliderData.imageUrl !== undefined) {
      updateData.image_url = sliderData.imageUrl
    }
    if (sliderData.linkUrl !== undefined) {
      updateData.link_url = sliderData.linkUrl
    }
    if (sliderData.isActive !== undefined) {
      updateData.is_active = sliderData.isActive
    }

    const { data, error } = await supabase
      .from("sliders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error updating slider: ${error.message}`)
    }

    return transformSlider(data as SliderRow)
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase.from("sliders").delete().eq("id", id)

    if (error) {
      throw new Error(`Error deleting slider: ${error.message}`)
    }
  },

  async upsertSlider(
    position: number,
    slot: number,
    data: { name: string; imageUrl: string; linkUrl?: string; isActive?: boolean }
  ): Promise<Slider> {
    const supabase = createClient()

    // Check if slider exists for this position and slot
    const { data: existing } = await supabase
      .from("sliders")
      .select("id")
      .eq("position", position)
      .eq("slot", slot)
      .single()

    if (existing) {
      // Update existing
      return this.update(existing.id, {
        name: data.name,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        isActive: data.isActive,
      })
    } else {
      // Create new
      return this.create({
        name: data.name,
        position,
        slot,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        isActive: data.isActive,
      })
    }
  },
}
