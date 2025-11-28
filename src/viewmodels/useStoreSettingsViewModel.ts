"use client"

import { useState, useEffect, useCallback } from "react"
import {
  storeSettingsService,
  StoreSettings,
} from "@/src/services/store-settings.service"

export type { StoreSettings }

interface UseStoreSettingsViewModelReturn {
  settings: StoreSettings | null
  isLoading: boolean
  isSaving: boolean
  error: string | null
  updateStoreOpen: (value: boolean) => Promise<void>
  updateInvoiceMessageEnabled: (value: boolean) => Promise<void>
  updateInvoiceMessage: (value: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useStoreSettingsViewModel(): UseStoreSettingsViewModelReturn {
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await storeSettingsService.getSettings()
      setSettings(data)
    } catch (err) {
      console.error("Error fetching settings:", err)
      setError("Error al cargar la configuración")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const updateStoreOpen = useCallback(async (value: boolean) => {
    try {
      setIsSaving(true)
      await storeSettingsService.updateSetting("store_open", String(value))
      setSettings((prev) => prev ? { ...prev, storeOpen: value } : null)
    } catch (err) {
      console.error("Error updating store open:", err)
      throw err
    } finally {
      setIsSaving(false)
    }
  }, [])

  const updateInvoiceMessageEnabled = useCallback(async (value: boolean) => {
    try {
      setIsSaving(true)
      await storeSettingsService.updateSetting("invoice_message_enabled", String(value))
      setSettings((prev) => prev ? { ...prev, invoiceMessageEnabled: value } : null)
    } catch (err) {
      console.error("Error updating invoice message enabled:", err)
      throw err
    } finally {
      setIsSaving(false)
    }
  }, [])

  const updateInvoiceMessage = useCallback(async (value: string) => {
    try {
      setIsSaving(true)
      await storeSettingsService.updateSetting("invoice_message", value)
      setSettings((prev) => prev ? { ...prev, invoiceMessage: value } : null)
    } catch (err) {
      console.error("Error updating invoice message:", err)
      throw err
    } finally {
      setIsSaving(false)
    }
  }, [])

  return {
    settings,
    isLoading,
    isSaving,
    error,
    updateStoreOpen,
    updateInvoiceMessageEnabled,
    updateInvoiceMessage,
    refresh: fetchSettings,
  }
}
