"use client"

import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export interface DashboardStats {
  totalSales: number
  totalSalesChange: number
  ordersCompleted: number
  newCustomers: number
  newCustomersChange: number
  productsSold: number
  productsSoldChange: number
  growthPercentage: number
  growthChange: number
}

export interface RecentOrder {
  id: string
  orderNumber: string
  customerName: string
  total: number
  status: string
  createdAt: string
}

export interface DailySales {
  date: string
  dayName: string
  sales: number
  orders: number
}

export interface TopProduct {
  id: string
  name: string
  imageUrl: string | null
  quantitySold: number
  totalSales: number
  lastSoldAt: string
}

export interface DateRangeFilter {
  from: Date
  to: Date
}

export interface WarehouseSales {
  warehouseId: string
  warehouseName: string
  totalSales: number
  ordersCount: number
}

export interface ReportOrder {
  id: string
  orderNumber: string
  customerName: string
  totalUsd: number
  status: string
  createdAt: string
}

class DashboardService {
  async getStats(warehouseId?: string, dateRange?: DateRangeFilter): Promise<DashboardStats> {
    const now = new Date()
    const startOfMonth = dateRange?.from ?? new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfRange = dateRange?.to ?? now

    // Calculate the duration of the selected range in ms
    const rangeDuration = endOfRange.getTime() - startOfMonth.getTime()
    const startOfLastMonth = new Date(startOfMonth.getTime() - rangeDuration - 86400000)
    const endOfLastMonth = new Date(startOfMonth.getTime() - 1)

    // Get current range orders
    let currentMonthQuery = supabase
      .from("orders")
      .select("id, total_usd, status")
      .gte("created_at", startOfMonth.toISOString())
      .lte("created_at", endOfRange.toISOString())
      .not("status", "eq", "cancelled")

    if (warehouseId) {
      currentMonthQuery = currentMonthQuery.eq("warehouse_id", warehouseId)
    }

    const { data: currentMonthOrders } = await currentMonthQuery

    // Get last month orders
    let lastMonthQuery = supabase
      .from("orders")
      .select("id, total_usd, status")
      .gte("created_at", startOfLastMonth.toISOString())
      .lte("created_at", endOfLastMonth.toISOString())
      .not("status", "eq", "cancelled")

    if (warehouseId) {
      lastMonthQuery = lastMonthQuery.eq("warehouse_id", warehouseId)
    }

    const { data: lastMonthOrders } = await lastMonthQuery

    // Calculate total sales
    const currentSales = (currentMonthOrders || []).reduce(
      (sum, order) => sum + parseFloat(order.total_usd || 0),
      0
    )
    const lastSales = (lastMonthOrders || []).reduce(
      (sum, order) => sum + parseFloat(order.total_usd || 0),
      0
    )
    const salesChange = lastSales > 0
      ? ((currentSales - lastSales) / lastSales) * 100
      : currentSales > 0 ? 100 : 0

    // Get customer role ID
    const { data: customerRole } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "customer")
      .single()

    // Get current range new customers
    const { count: currentCustomers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role_id", customerRole?.id || 0)
      .gte("created_at", startOfMonth.toISOString())
      .lte("created_at", endOfRange.toISOString())

    // Get last month new customers
    const { count: lastCustomers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role_id", customerRole?.id || 0)
      .gte("created_at", startOfLastMonth.toISOString())
      .lte("created_at", endOfLastMonth.toISOString())

    const customersChange = (lastCustomers || 0) > 0
      ? (((currentCustomers || 0) - (lastCustomers || 0)) / (lastCustomers || 1)) * 100
      : (currentCustomers || 0) > 0 ? 100 : 0

    // Get products sold (from order_items)
    const { data: currentMonthItems } = await supabase
      .from("order_items")
      .select("quantity, order_id")
      .in(
        "order_id",
        (currentMonthOrders || []).map((o) => o.id).filter(Boolean) as string[]
      )

    const { data: lastMonthItems } = await supabase
      .from("order_items")
      .select("quantity, order_id")
      .in(
        "order_id",
        (lastMonthOrders || []).map((o) => o.id).filter(Boolean) as string[]
      )

    const currentProducts = (currentMonthItems || []).reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    )
    const lastProducts = (lastMonthItems || []).reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    )
    const productsChange = lastProducts > 0
      ? ((currentProducts - lastProducts) / lastProducts) * 100
      : currentProducts > 0 ? 100 : 0

    // Calculate overall growth
    const growthPercentage = salesChange
    const growthChange = salesChange - (lastSales > 0 ? 0 : 0)

    // Count completed orders this month
    const ordersCompleted = (currentMonthOrders || []).filter(
      (order) => order.status === "completed"
    ).length

    return {
      totalSales: currentSales,
      totalSalesChange: salesChange,
      ordersCompleted,
      newCustomers: currentCustomers || 0,
      newCustomersChange: customersChange,
      productsSold: currentProducts,
      productsSoldChange: productsChange,
      growthPercentage: growthPercentage,
      growthChange: growthChange,
    }
  }

  async getRecentOrders(limit: number = 5): Promise<RecentOrder[]> {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        total_usd,
        status,
        created_at,
        users!orders_user_id_fkey (
          first_name,
          last_name
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching recent orders:", error)
      return []
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((order: any) => {
      const user = order.users as { first_name: string; last_name: string } | null
      return {
        id: order.id,
        orderNumber: order.order_number,
        customerName: user
          ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
          : "Cliente",
        total: parseFloat(order.total_usd),
        status: order.status,
        createdAt: order.created_at,
      }
    })
  }

  async getSalesLast7Days(warehouseId?: string, dateRange?: DateRangeFilter): Promise<DailySales[]> {
    const now = new Date()
    const rangeFrom = dateRange?.from ?? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
    const rangeTo = dateRange?.to ?? now

    const startDate = new Date(rangeFrom)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(rangeTo)
    endDate.setHours(23, 59, 59, 999)

    let query = supabase
      .from("orders")
      .select("total_usd, created_at")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .not("status", "eq", "cancelled")

    if (warehouseId) {
      query = query.eq("warehouse_id", warehouseId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching sales:", error)
      return []
    }

    // Build day entries for the range
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    const salesByDay: DailySales[] = []

    const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000)
    for (let i = 0; i <= diffDays; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)

      const dateStr = date.toISOString().split("T")[0]
      salesByDay.push({
        date: dateStr,
        dayName: `${dayNames[date.getDay()]} ${date.getDate()}`,
        sales: 0,
        orders: 0,
      })
    }

    // Sum sales and count orders by day
    (data || []).forEach((order) => {
      const orderDate = new Date(order.created_at).toISOString().split("T")[0]
      const dayEntry = salesByDay.find((d) => d.date === orderDate)
      if (dayEntry) {
        dayEntry.sales += parseFloat(order.total_usd || 0)
        dayEntry.orders += 1
      }
    })

    return salesByDay
  }

  async getTopProducts(limit: number = 5, warehouseId?: string, dateRange?: DateRangeFilter): Promise<TopProduct[]> {
    const now = new Date()
    const startOfMonth = dateRange?.from ?? new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfRange = dateRange?.to ?? now

    const endDate = new Date(endOfRange)
    endDate.setHours(23, 59, 59, 999)

    // Get all order items from the range with product info
    let query = supabase
      .from("order_items")
      .select(`
        product_id,
        product_name,
        product_image_url,
        quantity,
        total_usd,
        orders!inner (
          created_at,
          status,
          warehouse_id
        )
      `)
      .gte("orders.created_at", startOfMonth.toISOString())
      .lte("orders.created_at", endDate.toISOString())
      .not("orders.status", "eq", "cancelled")

    if (warehouseId) {
      query = query.eq("orders.warehouse_id", warehouseId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching top products:", error)
      return []
    }

    // Aggregate by product
    const productMap = new Map<string, TopProduct>()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(data || []).forEach((item: any) => {
      const productId = item.product_id
      const existing = productMap.get(productId)

      const orderCreatedAt = item.orders?.created_at || ""

      if (existing) {
        existing.quantitySold += item.quantity || 0
        existing.totalSales += parseFloat(item.total_usd || 0)
        if (orderCreatedAt > existing.lastSoldAt) {
          existing.lastSoldAt = orderCreatedAt
        }
      } else {
        productMap.set(productId, {
          id: productId,
          name: item.product_name || "Producto",
          imageUrl: item.product_image_url,
          quantitySold: item.quantity || 0,
          totalSales: parseFloat(item.total_usd || 0),
          lastSoldAt: orderCreatedAt,
        })
      }
    })

    // Sort by quantity sold and return top N (0 = no limit)
    const sortedProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantitySold - a.quantitySold)

    return limit > 0 ? sortedProducts.slice(0, limit) : sortedProducts
  }

  async getSalesByWarehouse(dateRange?: DateRangeFilter): Promise<WarehouseSales[]> {
    const now = new Date()
    const startDate = dateRange?.from ?? new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = dateRange?.to ?? now

    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from("orders")
      .select(`
        warehouse_id,
        total_usd,
        warehouses!inner (
          name
        )
      `)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", end.toISOString())
      .not("status", "eq", "cancelled")

    if (error) {
      console.error("Error fetching sales by warehouse:", error)
      return []
    }

    const warehouseMap = new Map<string, WarehouseSales>()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(data || []).forEach((order: any) => {
      const wId = order.warehouse_id
      const existing = warehouseMap.get(wId)

      if (existing) {
        existing.totalSales += parseFloat(order.total_usd || 0)
        existing.ordersCount += 1
      } else {
        warehouseMap.set(wId, {
          warehouseId: wId,
          warehouseName: order.warehouses?.name || "Sin bodegón",
          totalSales: parseFloat(order.total_usd || 0),
          ordersCount: 1,
        })
      }
    })

    return Array.from(warehouseMap.values()).sort(
      (a, b) => b.totalSales - a.totalSales
    )
  }

  async getOrders(warehouseId?: string, dateRange?: DateRangeFilter): Promise<ReportOrder[]> {
    const now = new Date()
    const startDate = dateRange?.from ?? new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = dateRange?.to ?? now

    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    let query = supabase
      .from("orders")
      .select(`
        id,
        order_number,
        total_usd,
        status,
        created_at,
        users!orders_user_id_fkey (
          first_name,
          last_name,
          email
        )
      `)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", end.toISOString())
      .order("created_at", { ascending: false })

    if (warehouseId) {
      query = query.eq("warehouse_id", warehouseId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching orders:", error)
      return []
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((row: any) => {
      const user = row.users as { first_name: string; last_name: string; email: string } | null
      return {
        id: row.id,
        orderNumber: row.order_number,
        customerName: user
          ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email
          : "Cliente",
        totalUsd: parseFloat(row.total_usd || 0),
        status: row.status,
        createdAt: row.created_at,
      }
    })
  }
}

export const dashboardService = new DashboardService()
