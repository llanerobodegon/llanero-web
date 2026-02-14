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
} from "@/src/services/dashboard.service"
import { useWarehouseContext } from "@/src/contexts/warehouse-context"

interface UseReportsViewModelReturn {
  stats: DashboardStats | null
  dailySales: DailySales[]
  topProducts: TopProduct[]
  orders: ReportOrder[]
  warehouseSales: WarehouseSales[]
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
      ] as const

      if (!warehouseId) {
        const [statsData, salesData, productsData, ordersData, warehouseSalesData] =
          await Promise.all([...basePromises, dashboardService.getSalesByWarehouse(dateRange)])
        setStats(statsData)
        setDailySales(salesData)
        setTopProducts(productsData)
        setOrders(ordersData)
        setWarehouseSales(warehouseSalesData)
      } else {
        const [statsData, salesData, productsData, ordersData] =
          await Promise.all(basePromises)
        setStats(statsData)
        setDailySales(salesData)
        setTopProducts(productsData)
        setOrders(ordersData)
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
    isLoading,
    error,
  }
}
