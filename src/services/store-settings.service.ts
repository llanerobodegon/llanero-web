"use client"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export interface StoreSettings {
  storeOpen: boolean
  invoiceMessageEnabled: boolean
  invoiceMessage: string
}

class StoreSettingsService {
  async getSettings(): Promise<StoreSettings> {
    const { data, error } = await supabase
      .from("store_settings")
      .select("key, value")

    if (error) {
      console.error("Error fetching store settings:", error)
      throw new Error("Failed to fetch store settings")
    }

    const settings: StoreSettings = {
      storeOpen: true,
      invoiceMessageEnabled: false,
      invoiceMessage: "",
    }

    ;(data || []).forEach((row) => {
      switch (row.key) {
        case "store_open":
          settings.storeOpen = row.value === "true"
          break
        case "invoice_message_enabled":
          settings.invoiceMessageEnabled = row.value === "true"
          break
        case "invoice_message":
          settings.invoiceMessage = row.value || ""
          break
      }
    })

    return settings
  }

  async updateSetting(key: string, value: string): Promise<void> {
    const { error } = await supabase
      .from("store_settings")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", key)

    if (error) {
      console.error("Error updating store setting:", error)
      throw new Error("Failed to update store setting")
    }
  }

  async updateSettings(settings: Partial<StoreSettings>): Promise<void> {
    const updates: Promise<void>[] = []

    if (settings.storeOpen !== undefined) {
      updates.push(this.updateSetting("store_open", String(settings.storeOpen)))
    }
    if (settings.invoiceMessageEnabled !== undefined) {
      updates.push(this.updateSetting("invoice_message_enabled", String(settings.invoiceMessageEnabled)))
    }
    if (settings.invoiceMessage !== undefined) {
      updates.push(this.updateSetting("invoice_message", settings.invoiceMessage))
    }

    await Promise.all(updates)
  }
}

export const storeSettingsService = new StoreSettingsService()
