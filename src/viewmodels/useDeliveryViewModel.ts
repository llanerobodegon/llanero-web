"use client"

import { useState, useEffect, useCallback } from "react"
import {
  deliveryService,
  DeliveryMember,
  CreateDeliveryMemberData,
  Warehouse,
} from "@/src/services/delivery.service"
import { useWarehouseContext } from "@/src/contexts/warehouse-context"

export type { DeliveryMember, CreateDeliveryMemberData, Warehouse }

interface UseDeliveryViewModelReturn {
  deliveryMembers: DeliveryMember[]
  warehouses: Warehouse[]
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  createDeliveryMember: (data: CreateDeliveryMemberData) => Promise<DeliveryMember>
  updateDeliveryMember: (id: string, data: Partial<CreateDeliveryMemberData>) => Promise<DeliveryMember>
  deleteDeliveryMember: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useDeliveryViewModel(): UseDeliveryViewModelReturn {
  const { selectedWarehouse } = useWarehouseContext()
  const [deliveryMembers, setDeliveryMembers] = useState<DeliveryMember[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const fetchDeliveryMembers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await deliveryService.getPaginated(
        { page, pageSize },
        { warehouseId: selectedWarehouse?.id }
      )

      setDeliveryMembers(response.data)
      setTotalCount(response.totalCount)
      setTotalPages(response.totalPages)
    } catch (err) {
      console.error("Error fetching delivery members:", err)
      setError("Error al cargar los repartidores")
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, selectedWarehouse])

  const fetchWarehouses = useCallback(async () => {
    try {
      const warehousesData = await deliveryService.getWarehouses()
      setWarehouses(warehousesData)
    } catch (err) {
      console.error("Error fetching warehouses:", err)
    }
  }, [])

  // Reset page when warehouse changes
  useEffect(() => {
    setPage(1)
  }, [selectedWarehouse])

  useEffect(() => {
    fetchDeliveryMembers()
  }, [fetchDeliveryMembers])

  useEffect(() => {
    fetchWarehouses()
  }, [fetchWarehouses])

  const createDeliveryMember = useCallback(
    async (data: CreateDeliveryMemberData): Promise<DeliveryMember> => {
      const member = await deliveryService.create(data)
      await fetchDeliveryMembers()
      return member
    },
    [fetchDeliveryMembers]
  )

  const updateDeliveryMember = useCallback(
    async (id: string, data: Partial<CreateDeliveryMemberData>): Promise<DeliveryMember> => {
      const member = await deliveryService.update(id, data)
      await fetchDeliveryMembers()
      return member
    },
    [fetchDeliveryMembers]
  )

  const deleteDeliveryMember = useCallback(
    async (id: string): Promise<void> => {
      await deliveryService.delete(id)
      await fetchDeliveryMembers()
    },
    [fetchDeliveryMembers]
  )

  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handleSetPageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
  }, [])

  return {
    deliveryMembers,
    warehouses,
    isLoading,
    error,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
    },
    setPage: handleSetPage,
    setPageSize: handleSetPageSize,
    createDeliveryMember,
    updateDeliveryMember,
    deleteDeliveryMember,
    refresh: fetchDeliveryMembers,
  }
}
