"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { Warehouse } from "@/src/models/warehouse.model"
import { warehouseService } from "@/src/services/warehouse.service"

interface WarehouseContextType {
  warehouses: Warehouse[]
  selectedWarehouse: Warehouse | null
  setSelectedWarehouse: (warehouse: Warehouse | null) => void
  isLoading: boolean
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined)

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const data = await warehouseService.getAll()
        // Only active warehouses, sorted alphabetically
        const activeWarehouses = data
          .filter(w => w.isActive)
          .sort((a, b) => a.name.localeCompare(b.name))
        setWarehouses(activeWarehouses)
      } catch (error) {
        console.error("Error fetching warehouses:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWarehouses()
  }, [])

  return (
    <WarehouseContext.Provider
      value={{
        warehouses,
        selectedWarehouse,
        setSelectedWarehouse,
        isLoading,
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
