"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { Warehouse } from "@/src/models/warehouse.model"
import { warehouseService } from "@/src/services/warehouse.service"

const supabase = createClient()

interface WarehouseContextType {
  warehouses: Warehouse[]
  selectedWarehouse: Warehouse | null
  setSelectedWarehouse: (warehouse: Warehouse | null) => void
  isLoading: boolean
  refreshWarehouses: () => Promise<void>
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined)

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchWarehouses = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from("users")
        .select("role_id")
        .eq("id", user.id)
        .single()

      const roleId = userData?.role_id
      let data: Warehouse[]

      if (roleId === 2) {
        // Admin: all warehouses
        data = await warehouseService.getAll()
      } else {
        // Manager and others: only assigned warehouses
        data = await warehouseService.getByUserId(user.id)
      }

      const sortedWarehouses = data
        .sort((a, b) => a.name.localeCompare(b.name))
      setWarehouses(sortedWarehouses)

      // If selected warehouse was deleted, deselect it
      if (selectedWarehouse && !sortedWarehouses.find(w => w.id === selectedWarehouse.id)) {
        setSelectedWarehouse(sortedWarehouses.length === 1 ? sortedWarehouses[0] : null)
      }

      // Auto-select if user has only 1 warehouse
      if (!selectedWarehouse && sortedWarehouses.length === 1) {
        setSelectedWarehouse(sortedWarehouses[0])
      }
    } catch (error) {
      console.error("Error fetching warehouses:", error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedWarehouse])

  useEffect(() => {
    fetchWarehouses()
  }, [])

  return (
    <WarehouseContext.Provider
      value={{
        warehouses,
        selectedWarehouse,
        setSelectedWarehouse,
        isLoading,
        refreshWarehouses: fetchWarehouses,
      }}
    >
      {children}
    </WarehouseContext.Provider>
  )
}

export function useWarehouseContext() {
  const context = useContext(WarehouseContext)
  if (context === undefined) {
    throw new Error("useWarehouseContext must be used within a WarehouseProvider")
  }
  return context
}
