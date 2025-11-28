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
}

class DashboardService {
  async getStats(): Promise<DashboardStats> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Get current month orders
    const { data: currentMonthOrders } = await supabase
      .from("orders")
      .select("id, total_usd, status")
      .gte("created_at", startOfMonth.toISOString())
      .not("status", "eq", "cancelled")

    // Get last month orders
    const { data: lastMonthOrders } = await supabase
      .from("orders")
      .select("id, total_usd, status")
      .gte("created_at", startOfLastMonth.toISOString())
      .lte("created_at", endOfLastMonth.toISOString())
      .not("status", "eq", "cancelled")

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

    // Get current month new customers
    const { count: currentCustomers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role_id", customerRole?.id || 0)
      .gte("created_at", startOfMonth.toISOString())

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

  async getSalesLast7Days(): Promise<DailySales[]> {
    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from("orders")
      .select("total_usd, created_at")
      .gte("created_at", sevenDaysAgo.toISOString())
      .not("status", "eq", "cancelled")

    if (error) {
      console.error("Error fetching sales last 7 days:", error)
      return []
    }

    // Initialize all 7 days with 0 sales
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    const salesByDay: DailySales[] = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const dateStr = date.toISOString().split("T")[0]
      salesByDay.push({
        date: dateStr,
        dayName: dayNames[date.getDay()],
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

  async getTopProducts(limit: number = 5): Promise<TopProduct[]> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get all order items from this month with product info
    const { data, error } = await supabase
      .from("order_items")
      .select(`
        product_id,
        product_name,
        product_image_url,
        quantity,
        total_usd,
        orders!inner (
          created_at,
          status
        )
      `)
      .gte("orders.created_at", startOfMonth.toISOString())
      .not("orders.status", "eq", "cancelled")

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

      if (existing) {
        existing.quantitySold += item.quantity || 0
        existing.totalSales += parseFloat(item.total_usd || 0)
      } else {
        productMap.set(productId, {
          id: productId,
          name: item.product_name || "Producto",
          imageUrl: item.product_image_url,
          quantitySold: item.quantity || 0,
          totalSales: parseFloat(item.total_usd || 0),
        })
      }
    })

    // Sort by quantity sold and return top N
    const sortedProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, limit)

    return sortedProducts
  }
}

export const dashboardService = new DashboardService()
