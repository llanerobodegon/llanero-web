"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  ordersService,
  Order,
  OrderListItem,
  OrderStatus,
  PaymentStatus,
  UpdateOrderData,
} from "@/src/services/orders.service"
import { useWarehouseContext } from "@/src/contexts/warehouse-context"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

export type { Order, OrderListItem, OrderStatus, PaymentStatus, UpdateOrderData }

interface UseOrdersViewModelReturn {
  orders: OrderListItem[]
  selectedOrder: Order | null
  deliveryMembers: { id: string; name: string }[]
  isLoading: boolean
  isLoadingOrder: boolean
  error: string | null
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
  filters: {
    status?: OrderStatus
    paymentStatus?: PaymentStatus
  }
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setFilters: (filters: { status?: OrderStatus; paymentStatus?: PaymentStatus }) => void
  selectOrder: (id: string) => Promise<void>
  clearSelectedOrder: () => void
  updateOrder: (id: string, data: UpdateOrderData) => Promise<Order>
  deleteOrder: (id: string) => Promise<void>
  refresh: () => Promise<void>
  onNewOrder: (callback: (orderNumber: string) => void) => void
}

export function useOrdersViewModel(): UseOrdersViewModelReturn {
  const { selectedWarehouse, isLoading: isWarehouseLoading } = useWarehouseContext()
  const [orders, setOrders] = useState<OrderListItem[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [deliveryMembers, setDeliveryMembers] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingOrder, setIsLoadingOrder] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [filters, setFilters] = useState<{ status?: OrderStatus; paymentStatus?: PaymentStatus }>({})

  // Realtime
  const channelRef = useRef<RealtimeChannel | null>(null)
  const newOrderCallbackRef = useRef<((orderNumber: string) => void) | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await ordersService.getPaginated(
        { page, pageSize },
        {
          ...filters,
          warehouseId: selectedWarehouse?.id,
        }
      )

      setOrders(response.data)
      setTotalCount(response.totalCount)
      setTotalPages(response.totalPages)
    } catch (err) {
      console.error("Error fetching orders:", err)
      setError("Error al cargar los pedidos")
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, filters, selectedWarehouse])

  const fetchDeliveryMembers = useCallback(async () => {
    try {
      const members = await ordersService.getDeliveryMembers()
      setDeliveryMembers(members)
    } catch (err) {
      console.error("Error fetching delivery members:", err)
    }
  }, [])

  // Reset page when warehouse changes
  useEffect(() => {
    setPage(1)
  }, [selectedWarehouse])

  useEffect(() => {
    if (isWarehouseLoading) return
    fetchOrders()
  }, [fetchOrders, isWarehouseLoading])

  useEffect(() => {
    fetchDeliveryMembers()
  }, [fetchDeliveryMembers])

  const registerNewOrderCallback = useCallback((callback: (orderNumber: string) => void) => {
    newOrderCallbackRef.current = callback
  }, [])

  const selectOrder = useCallback(async (id: string) => {
    try {
      setIsLoadingOrder(true)
      const order = await ordersService.getById(id)
      setSelectedOrder(order)
    } catch (err) {
      console.error("Error fetching order:", err)
      setError("Error al cargar el pedido")
    } finally {
      setIsLoadingOrder(false)
    }
  }, [])

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()

    // Create channel for orders table
    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log("📦 Realtime INSERT received:", payload)
          // Check if the new order matches our warehouse filter
          const newOrder = payload.new as { warehouse_id: string; order_number: string }

          if (!selectedWarehouse || newOrder.warehouse_id === selectedWarehouse.id) {
            // Refresh the orders list
            fetchOrders()

            // Call the callback if registered
            if (newOrderCallbackRef.current) {
              newOrderCallbackRef.current(newOrder.order_number)
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log("📦 Realtime UPDATE received:", payload)
          const updatedOrder = payload.new as { warehouse_id: string; id: string }

          if (!selectedWarehouse || updatedOrder.warehouse_id === selectedWarehouse.id) {
            // Refresh the orders list
            fetchOrders()

            // If this order is currently selected, refresh it
            if (selectedOrder?.id === updatedOrder.id) {
              selectOrder(updatedOrder.id)
            }
          }
        }
      )
      .subscribe((status, err) => {
        console.log("📦 Realtime subscription status:", status)
        if (err) {
          console.error("📦 Realtime subscription error:", err)
        }
      })

    channelRef.current = channel

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [selectedWarehouse, fetchOrders, selectedOrder?.id, selectOrder])

  const clearSelectedOrder = useCallback(() => {
    setSelectedOrder(null)
  }, [])

  const updateOrder = useCallback(
    async (id: string, data: UpdateOrderData): Promise<Order> => {
      const order = await ordersService.update(id, data)
      setSelectedOrder(order)
      await fetchOrders()
      return order
    },
    [fetchOrders]
  )

  const deleteOrder = useCallback(
    async (id: string): Promise<void> => {
      await ordersService.delete(id)
      setSelectedOrder(null)
      await fetchOrders()
    },
    [fetchOrders]
  )

  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handleSetPageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
  }, [])

  const handleSetFilters = useCallback((newFilters: { status?: OrderStatus; paymentStatus?: PaymentStatus }) => {
    setFilters(newFilters)
    setPage(1)
  }, [])

  return {
    orders,
    selectedOrder,
    deliveryMembers,
    isLoading,
    isLoadingOrder,
    error,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
    },
    filters,
    setPage: handleSetPage,
    setPageSize: handleSetPageSize,
    setFilters: handleSetFilters,
    selectOrder,
    clearSelectedOrder,
    updateOrder,
    deleteOrder,
    refresh: fetchOrders,
    onNewOrder: registerNewOrderCallback,
  }
}
