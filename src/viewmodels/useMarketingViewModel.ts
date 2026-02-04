"use client"

import { useState, useEffect, useCallback } from "react"
import { sliderService } from "@/src/services/slider.service"
import { Slider, SliderGroup, UpdateSliderData } from "@/src/models/slider.model"

export function useMarketingViewModel() {
  const [sliderGroups, setSliderGroups] = useState<SliderGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSliders = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const groups = await sliderService.getGroupedSliders()
      setSliderGroups(groups)
    } catch (err) {
      console.error("Error fetching sliders:", err)
      setError(err instanceof Error ? err.message : "Error al cargar los sliders")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSliders()
  }, [fetchSliders])

  const upsertSlider = async (
    position: number,
    slot: number,
    data: { name: string; imageUrl: string; linkUrl?: string; isActive?: boolean }
  ): Promise<Slider> => {
    const slider = await sliderService.upsertSlider(position, slot, data)
    await fetchSliders()
    return slider
  }

  const updateSlider = async (id: string, data: UpdateSliderData): Promise<Slider> => {
    const slider = await sliderService.update(id, data)
    await fetchSliders()
    return slider
  }

  const deleteSlider = async (id: string): Promise<void> => {
    await sliderService.delete(id)
    await fetchSliders()
  }

  const toggleSliderEnabled = async (settingsId: string, isEnabled: boolean): Promise<void> => {
    await sliderService.updateSliderSettings(settingsId, isEnabled)
    await fetchSliders()
  }

  return {
    sliderGroups,
    isLoading,
    error,
    refetch: fetchSliders,
    upsertSlider,
    updateSlider,
    deleteSlider,
    toggleSliderEnabled,
  }
}
