"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardViewModel } from "@/src/viewmodels/useDashboardViewModel"
import { StatCard, StatCardSkeleton, formatCurrency } from "@/src/components/shared/stat-card"
import { SalesChart } from "@/src/components/shared/sales-chart"
import { TopProductsTable } from "@/src/components/shared/top-products-table"

export function DashboardContent() {
  const { userName, stats, dailySales, topProducts, isLoading, error } = useDashboardViewModel()

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <p className="text-destructive mb-4">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-[50px] mx-auto w-full max-w-[1200px]">
      {/* Greeting */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold">
          Hola, {isLoading ? <Skeleton className="inline-block h-7 w-32" /> : userName} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Aquí tienes un resumen de tu negocio
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : stats ? (
          <>
            <StatCard
              title="Ventas Totales"
              value={formatCurrency(stats.totalSales)}
              change={stats.totalSalesChange}
              trendLabel={stats.totalSalesChange >= 0 ? "Tendencia positiva" : "Tendencia negativa"}
              detailText={`${stats.ordersCompleted} pedidos entregados este mes`}
            />
            <StatCard
              title="Productos Facturados"
              value={stats.productsSold.toString()}
              change={stats.productsSoldChange}
              trendLabel={stats.productsSoldChange >= 0 ? "Tendencia positiva" : "Tendencia negativa"}
              detailText="Unidades vendidas este mes"
            />
            <StatCard
              title="Nuevos Clientes"
              value={stats.newCustomers.toString()}
              change={stats.newCustomersChange}
              trendLabel={stats.newCustomersChange >= 0 ? "Tendencia positiva" : "Tendencia negativa"}
              detailText="Clientes registrados este mes"
            />
            <StatCard
              title="Crecimiento"
              value={`${stats.growthPercentage >= 0 ? "+" : ""}${stats.growthPercentage.toFixed(1)}%`}
              change={stats.growthChange}
              trendLabel={stats.growthPercentage >= 0 ? "Tendencia positiva" : "Tendencia negativa"}
              detailText="Comparado con el mes anterior"
            />
          </>
        ) : null}
      </div>

      {/* Sales Chart */}
      <SalesChart dailySales={dailySales} isLoading={isLoading} />

      {/* Top Products */}
      <TopProductsTable topProducts={topProducts} isLoading={isLoading} />
    </div>
  )
}
