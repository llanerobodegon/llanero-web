"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardViewModel } from "@/src/viewmodels/useDashboardViewModel"
import { DailySales, TopProduct } from "@/src/services/dashboard.service"
import Image from "next/image"
import { ImageIcon } from "lucide-react"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatPercentage(value: number): string {
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(1)}%`
}

interface StatCardProps {
  title: string
  value: string
  change: number
  trendLabel: string
  detailText: string
}

function StatCard({ title, value, change, trendLabel, detailText }: StatCardProps) {
  const isPositive = change >= 0
  const TrendIcon = isPositive ? TrendingUp : TrendingDown
  const changeColor = isPositive ? "text-green-600" : "text-red-600"

  return (
    <Card className="bg-muted/30 flex flex-col p-6">
      <CardContent className="p-0 flex flex-col flex-1">
        {/* Section 1: Title, value and percentage - aligned top */}
        <div className="mb-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{title}</span>
            <span className={`flex items-center gap-0.5 text-xs font-medium ${changeColor}`}>
              <TrendIcon className="h-3 w-3" />
              {formatPercentage(change)}
            </span>
          </div>
          <div className="text-3xl font-bold">{value}</div>
        </div>

        {/* Section 2: Trend and detail - aligned bottom */}
        <div className="mt-6">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-0.5">
            <span className="font-semibold">{trendLabel}</span>
            <TrendIcon className="h-4 w-4" />
          </div>
          <div className="text-xs text-muted-foreground">{detailText}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatCardSkeleton() {
  return (
    <Card className="bg-muted/30">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-9 w-36 mb-4" />
        <Skeleton className="h-4 w-28 mb-1" />
        <Skeleton className="h-4 w-40" />
      </CardContent>
    </Card>
  )
}

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
              title="Nuevos Clientes"
              value={stats.newCustomers.toString()}
              change={stats.newCustomersChange}
              trendLabel={stats.newCustomersChange >= 0 ? "Tendencia positiva" : "Tendencia negativa"}
              detailText="Clientes registrados este mes"
            />
            <StatCard
              title="Productos Facturados"
              value={stats.productsSold.toString()}
              change={stats.productsSoldChange}
              trendLabel={stats.productsSoldChange >= 0 ? "Tendencia positiva" : "Tendencia negativa"}
              detailText="Unidades vendidas este mes"
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

const chartConfig = {
  sales: {
    label: "Ventas",
    color: "var(--color-primary)",
  },
  orders: {
    label: "Pedidos",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig

interface SalesChartProps {
  dailySales: DailySales[]
  isLoading: boolean
}

function SalesChart({ dailySales, isLoading }: SalesChartProps) {
  const [viewMode, setViewMode] = useState<"sales" | "orders">("sales")

  // Calculate totals for the week
  const totalWeekSales = dailySales.reduce((sum, day) => sum + day.sales, 0)
  const totalWeekOrders = dailySales.reduce((sum, day) => sum + day.orders, 0)

  if (isLoading) {
    return (
      <Card className="bg-muted/30">
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[150px] w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-4 w-64" />
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="bg-muted/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">
              {viewMode === "sales" ? "Ventas por Día" : "Pedidos por Día"}
            </CardTitle>
            <CardDescription>Últimos 7 días</CardDescription>
          </div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "sales" | "orders")}>
            <TabsList className="h-8">
              <TabsTrigger value="sales" className="text-xs px-3 cursor-pointer">
                Ventas
              </TabsTrigger>
              <TabsTrigger value="orders" className="text-xs px-3 cursor-pointer">
                Pedidos
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <ChartContainer config={chartConfig} className="h-[150px] w-full">
          <BarChart accessibilityLayer data={dailySales}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="dayName"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value) =>
                    viewMode === "sales"
                      ? [`$${Number(value).toFixed(2)} `, "Ventas"]
                      : [`${Number(value)} `, "Pedidos"]
                  }
                />
              }
            />
            <Bar
              dataKey={viewMode}
              fill={`var(--color-${viewMode})`}
              radius={8}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-1 text-sm pt-0">
        <div className="flex gap-2 leading-none font-medium">
          {viewMode === "sales"
            ? `Total de la semana: ${formatCurrency(totalWeekSales)}`
            : `Total de la semana: ${totalWeekOrders} pedidos`}
        </div>
        <div className="text-muted-foreground leading-none text-xs">
          {viewMode === "sales"
            ? "Mostrando ventas de los últimos 7 días"
            : "Mostrando pedidos de los últimos 7 días"}
        </div>
      </CardFooter>
    </Card>
  )
}

interface TopProductsTableProps {
  topProducts: TopProduct[]
  isLoading: boolean
}

function TopProductsTable({ topProducts, isLoading }: TopProductsTableProps) {

  if (isLoading) {
    return (
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16 ml-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-muted/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Productos Más Vendidos</CardTitle>
        <CardDescription>Top 5 del mes actual</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-muted-foreground font-normal">Producto</TableHead>
              <TableHead className="text-muted-foreground font-normal text-right">Cantidad</TableHead>
              <TableHead className="text-muted-foreground font-normal text-right">Ventas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topProducts.length > 0 ? (
              topProducts.map((product) => (
                <TableRow key={product.id} className="border-b last:border-0">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative h-9 w-9 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{product.quantitySold}</TableCell>
                  <TableCell className="text-right">{formatCurrency(product.totalSales)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  No hay datos de productos este mes
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
