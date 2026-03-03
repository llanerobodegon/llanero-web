"use client"

import { useState, useEffect, useCallback } from "react"
import {
  dashboardService,
  DashboardStats,
  DailySales,
  TopProduct,
  ReportOrder,
  DateRangeFilter,
  WarehouseSales,
  DeliveryStatRow,
} from "@/src/services/dashboard.service"
import { useWarehouseContext } from "@/src/contexts/warehouse-context"

interface UseReportsViewModelReturn {
  stats: DashboardStats | null
  dailySales: DailySales[]
  topProducts: TopProduct[]
  orders: ReportOrder[]
  warehouseSales: WarehouseSales[]
  deliveryStats: DeliveryStatRow[]
  isLoading: boolean
  error: string | null
}

export function useReportsViewModel(dateRange?: DateRangeFilter): UseReportsViewModelReturn {
  const { selectedWarehouse } = useWarehouseContext()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [dailySales, setDailySales] = useState<DailySales[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [orders, setOrders] = useState<ReportOrder[]>([])
  const [warehouseSales, setWarehouseSales] = useState<WarehouseSales[]>([])
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStatRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const warehouseId = selectedWarehouse?.id

      const basePromises = [
        dashboardService.getStats(warehouseId, dateRange),
        dashboardService.getSalesLast7Days(warehouseId, dateRange),
        dashboardService.getTopProducts(0, warehouseId, dateRange),
        dashboardService.getOrders(warehouseId, dateRange),
        dashboardService.getDeliveryStats(warehouseId, dateRange),
      ] as const

      if (!warehouseId) {
        const [statsData, salesData, productsData, ordersData, deliveryStatsData, warehouseSalesData] =
          await Promise.all([...basePromises, dashboardService.getSalesByWarehouse(dateRange)])
        setStats(statsData)
        setDailySales(salesData)
        setTopProducts(productsData)
        setOrders(ordersData)
        setDeliveryStats(deliveryStatsData)
        setWarehouseSales(warehouseSalesData)
      } else {
        const [statsData, salesData, productsData, ordersData, deliveryStatsData] =
          await Promise.all(basePromises)
        setStats(statsData)
        setDailySales(salesData)
        setTopProducts(productsData)
        setOrders(ordersData)
        setDeliveryStats(deliveryStatsData)
        setWarehouseSales([])
      }
    } catch (err) {
      console.error("Error fetching reports data:", err)
      setError("Error al cargar los datos de reportes")
    } finally {
      setIsLoading(false)
    }
  }, [selectedWarehouse, dateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    stats,
    dailySales,
    topProducts,
    orders,
    warehouseSales,
    deliveryStats,
    isLoading,
    error,
  }
}
