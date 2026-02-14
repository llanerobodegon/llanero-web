"use client"

import { useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, XAxis } from "recharts"
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
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/src/components/shared/stat-card"
import { DailySales } from "@/src/services/dashboard.service"

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

export function SalesChart({ dailySales, isLoading }: SalesChartProps) {
  const [viewMode, setViewMode] = useState<"sales" | "orders">("sales")

  // Calculate totals and max for opacity scaling
  const totalWeekSales = dailySales.reduce((sum, day) => sum + day.sales, 0)
  const totalWeekOrders = dailySales.reduce((sum, day) => sum + day.orders, 0)
  const maxSales = Math.max(...dailySales.map((d) => d.sales), 1)
  const maxOrders = Math.max(...dailySales.map((d) => d.orders), 1)

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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
            <Bar dataKey={viewMode} radius={8}>
              {dailySales.map((day, index) => {
                const value = viewMode === "sales" ? day.sales : day.orders
                const max = viewMode === "sales" ? maxSales : maxOrders
                const opacity = 0.3 + 0.7 * (value / max)
                return (
                  <Cell
                    key={index}
                    fill={`var(--color-${viewMode})`}
                    fillOpacity={opacity}
                  />
                )
              })}
            </Bar>
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
