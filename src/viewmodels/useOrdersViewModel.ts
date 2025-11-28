"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ordersService,
  Order,
  OrderListItem,
  OrderStatus,
  PaymentStatus,
  UpdateOrderData,
} from "@/src/services/orders.service"

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
  refresh: () => Promise<void>
}

export function useOrdersViewModel(): UseOrdersViewModelReturn {
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

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await ordersService.getPaginated({ page, pageSize }, filters)

      setOrders(response.data)
      setTotalCount(response.totalCount)
      setTotalPages(response.totalPages)
    } catch (err) {
      console.error("Error fetching orders:", err)
      setError("Error al cargar los pedidos")
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, filters])

  const fetchDeliveryMembers = useCallback(async () => {
    try {
      const members = await ordersService.getDeliveryMembers()
      setDeliveryMembers(members)
    } catch (err) {
      console.error("Error fetching delivery members:", err)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    fetchDeliveryMembers()
  }, [fetchDeliveryMembers])

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
    refresh: fetchOrders,
  }
}
