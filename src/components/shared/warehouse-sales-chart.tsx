"use client"

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
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/src/components/shared/stat-card"
import { WarehouseSales } from "@/src/services/dashboard.service"

const chartConfig = {
  totalSales: {
    label: "Ventas",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig

interface WarehouseSalesChartProps {
  warehouseSales: WarehouseSales[]
  isLoading: boolean
}

export function WarehouseSalesChart({ warehouseSales, isLoading }: WarehouseSalesChartProps) {
  const totalSales = warehouseSales.reduce((sum, w) => sum + w.totalSales, 0)
  const totalOrders = warehouseSales.reduce((sum, w) => sum + w.ordersCount, 0)
  const maxSales = Math.max(...warehouseSales.map((w) => w.totalSales), 1)

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
        <CardTitle className="text-base">Ventas por Bodegón</CardTitle>
        <CardDescription>Todos los bodegones</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <ChartContainer config={chartConfig} className="h-[150px] w-full">
          <BarChart accessibilityLayer data={warehouseSales}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="warehouseName"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value) => [
                    `${formatCurrency(Number(value))} `,
                    "Ventas",
                  ]}
                />
              }
            />
            <Bar dataKey="totalSales" radius={8}>
              {warehouseSales.map((entry) => {
                const opacity = 0.3 + 0.7 * (entry.totalSales / maxSales)
                return (
                  <Cell
                    key={entry.warehouseId}
                    fill="var(--color-totalSales)"
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
          Total: {formatCurrency(totalSales)}
        </div>
        <div className="text-muted-foreground leading-none text-xs">
          {totalOrders} pedidos en {warehouseSales.length} bodegones
        </div>
      </CardFooter>
    </Card>
  )
}
