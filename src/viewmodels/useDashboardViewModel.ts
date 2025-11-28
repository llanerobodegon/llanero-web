"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  dashboardService,
  DashboardStats,
  RecentOrder,
  DailySales,
  TopProduct,
} from "@/src/services/dashboard.service"

export type { DashboardStats, RecentOrder, DailySales, TopProduct }

interface UsedashboardViewModelReturn {
  userName: string
  stats: DashboardStats | null
  recentOrders: RecentOrder[]
  dailySales: DailySales[]
  topProducts: TopProduct[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useDashboardViewModel(): UsedashboardViewModelReturn {
  const [userName, setUserName] = useState<string>("Usuario")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [dailySales, setDailySales] = useState<DailySales[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserName = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (authUser) {
        // Try to get user from our users table
        const { data: userData } = await supabase
          .from("users")
          .select("first_name")
          .eq("id", authUser.id)
          .single()

        if (userData?.first_name) {
          setUserName(userData.first_name)
        } else {
          // Fallback to auth metadata or email
          setUserName(
            authUser.user_metadata?.name ||
            authUser.email?.split("@")[0] ||
            "Usuario"
          )
        }
      }
    } catch (err) {
      console.error("Error fetching user name:", err)
    }
  }, [])

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [statsData, ordersData, salesData, productsData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentOrders(5),
        dashboardService.getSalesLast7Days(),
        dashboardService.getTopProducts(5),
      ])

      setStats(statsData)
      setRecentOrders(ordersData)
      setDailySales(salesData)
      setTopProducts(productsData)
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      setError("Error al cargar los datos del dashboard")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUserName()
    fetchDashboardData()
  }, [fetchUserName, fetchDashboardData])

  return {
    userName,
    stats,
    recentOrders,
    dailySales,
    topProducts,
    isLoading,
    error,
    refresh: fetchDashboardData,
  }
}
