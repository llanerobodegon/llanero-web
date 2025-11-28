"use client"

import { useState, useEffect, useCallback } from "react"
import { warehouseService, WarehouseWithProductCount } from "@/src/services/warehouse.service"
import {
  CreateWarehouseData,
  UpdateWarehouseData,
  Warehouse,
} from "@/src/models/warehouse.model"

export type { WarehouseWithProductCount }

interface PaginationState {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export function useWarehousesViewModel() {
  const [warehouses, setWarehouses] = useState<WarehouseWithProductCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  })

  const fetchWarehouses = useCallback(async (page: number, pageSize: number) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await warehouseService.getPaginated({ page, pageSize })
      setWarehouses(response.data)
      setPagination({
        page: response.page,
        pageSize: response.pageSize,
        totalCount: response.totalCount,
        totalPages: response.totalPages,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar los bodegones")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWarehouses(pagination.page, pagination.pageSize)
  }, []) // Only run on mount

  const setPage = useCallback((page: number) => {
    fetchWarehouses(page, pagination.pageSize)
  }, [fetchWarehouses, pagination.pageSize])

  const setPageSize = useCallback((pageSize: number) => {
    fetchWarehouses(1, pageSize) // Reset to page 1 when changing page size
  }, [fetchWarehouses])

  const createWarehouse = useCallback(
    async (data: CreateWarehouseData): Promise<Warehouse> => {
      const newWarehouse = await warehouseService.create(data)
      // Refetch current page to show updated data
      await fetchWarehouses(pagination.page, pagination.pageSize)
      return newWarehouse
    },
    [fetchWarehouses, pagination.page, pagination.pageSize]
  )

  const updateWarehouse = useCallback(
    async (id: string, data: UpdateWarehouseData): Promise<Warehouse> => {
      const updatedWarehouse = await warehouseService.update(id, data)
      // Update local state optimistically
      setWarehouses((prev) =>
        prev.map((w) =>
          w.id === id
            ? { ...updatedWarehouse, productCount: w.productCount }
            : w
        )
      )
      return updatedWarehouse
    },
    []
  )

  const deleteWarehouse = useCallback(async (id: string): Promise<void> => {
    await warehouseService.delete(id)
    // Refetch current page to show updated data
    await fetchWarehouses(pagination.page, pagination.pageSize)
  }, [fetchWarehouses, pagination.page, pagination.pageSize])

  return {
    warehouses,
    isLoading,
    error,
    pagination,
    setPage,
    setPageSize,
    refetch: () => fetchWarehouses(pagination.page, pagination.pageSize),
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
  }
}
